#!/usr/bin/env python3
"""gemini-watch — the Gemini-native variant of the lesson watch gate.

Where the `watch` skill decomposes a video locally (ffmpeg frames + Whisper
transcript) and hands it to Claude, this sends the *whole* MP4 to Gemini, which
is natively multimodal: it watches the video AND listens to the audio in one
pass — frame viewing + audio listening + transcription together.

Use for a quick "does the Gemini path work?" test with an existing GEMINI_API_KEY.
For the production gate, prefer: Gemini (or Groq Whisper) for the TRANSCRIPT,
Claude as the REVIEWER (Claude is the brand/teaching judge).

Backends are described in `scripts/review-providers.json` (one config point — add a
row, no code change). Select one with `--provider <id>`; it resolves the key env
candidates + model from that row. `--key-env` / `--model` still override directly.

Usage:
  setx / export GEMINI_API_KEY=...        # or GOOGLE_API_KEY
  python scripts/gemini-watch.py out/<lesson>.mp4
  python scripts/gemini-watch.py out/<lesson>.mp4 --provider gemini-voice
  python scripts/gemini-watch.py out/<lesson>.mp4 --model gemini-2.5-flash
  python scripts/gemini-watch.py --list-providers
  python scripts/gemini-watch.py out/<lesson>.mp4 --provider premium-multimodal --dry-run

Pure official SDK: `pip install google-genai`.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

DEFAULT_MODEL = os.environ.get("GOOGLE_MODEL", "gemini-2.5-flash")
PROVIDERS_CONFIG = Path(__file__).resolve().parent / "review-providers.json"

# Fallback prioritized env var names when no --provider/--key-env is given. Project
# keys are included so the gate works with the keys already in your shell.
KEY_ENV_CANDIDATES = (
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "GOOGLE_VOICE_API_KEY",    # project: the "voice/video" Gemini key
    "GOOGLE_CHATBOT_API_KEY",  # project: the "chatbot" Gemini key
)

REVIEW_PROMPT = """You are reviewing a RENDERED lesson video for Sample Academy (a
learner-focused AI education platform). The brand is: Syne font, warm linen
background (#EDE8E3), crimson accent (#8B2635), 4px radius, smooth motion.

Watch the whole video (visuals + audio) and return, in markdown:

1. **Timestamped transcript** of the narration (MM:SS — text). If there is no
   audio narration, say so explicitly.
2. **On-screen content per section** — the visible title/text at each beat.
3. **Brand & motion check** — does it match the brand above? Any choppy/jarring
   transitions?
4. **Teaching & accuracy flags** — anything that reads as an authoring
   instruction leaking on-screen (meta-commentary), garbled/clipped/misspelled
   text, or a tool claim that looks outdated or wrong (e.g. capability tables).
5. **One-line verdict** — does the finished video work and teach? PASS / FIX.

Be concrete and cite timestamps."""


def load_providers() -> dict:
    """Read review-providers.json. Returns {} if missing (falls back to defaults)."""
    if not PROVIDERS_CONFIG.exists():
        return {}
    try:
        return json.loads(PROVIDERS_CONFIG.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise SystemExit(f"Invalid {PROVIDERS_CONFIG.name}: {e}")


def find_provider(cfg: dict, provider_id: str) -> dict:
    for p in cfg.get("providers", []):
        if p.get("id") == provider_id:
            return p
    ids = ", ".join(p.get("id", "?") for p in cfg.get("providers", []))
    raise SystemExit(f"Unknown provider '{provider_id}'. Available: {ids or '(none)'}")


def load_key(candidates, required: bool = True) -> tuple[str | None, str | None]:
    """Return (key, env_name_used). With required=False, returns (None, None) if absent."""
    for name in candidates:
        if not name:
            continue
        v = os.environ.get(name)
        if v and v.strip():
            return v.strip(), name
    if required:
        raise SystemExit(
            "No API key found. Looked in: " + ", ".join(c for c in candidates if c) + ".\n"
            "  PowerShell:  $env:GEMINI_API_KEY = '...'   (or use --key-env GOOGLE_VOICE_API_KEY)\n"
            "  Get one at:  https://aistudio.google.com/apikey"
        )
    return None, None


def print_providers(cfg: dict) -> int:
    providers = cfg.get("providers", [])
    if not providers:
        print(f"No providers found in {PROVIDERS_CONFIG}")
        return 1
    default = cfg.get("default")
    print(f"# Review providers ({PROVIDERS_CONFIG.name})\n")
    for p in providers:
        star = "  (default)" if p.get("id") == default else ""
        print(f"- {p.get('id')}{star}  [{p.get('kind')}]  model={p.get('model')}")
        print(f"    keyEnv: {', '.join(p.get('keyEnv', []))}")
        if p.get("notes"):
            print(f"    {p['notes']}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(prog="gemini-watch")
    ap.add_argument("source", nargs="?", help="Local video file path (e.g. out/topic-1-lesson-1.mp4)")
    ap.add_argument("--provider", default=None, help="Provider id from review-providers.json (e.g. gemini-voice)")
    ap.add_argument("--model", default=None, help=f"Model override (default: provider's, else {DEFAULT_MODEL})")
    ap.add_argument("--prompt", default=None, help="Override the review prompt")
    ap.add_argument("--key-env", default=None, help="Env var name to read the key from (overrides provider)")
    ap.add_argument("--list-providers", action="store_true", help="List configured providers and exit")
    ap.add_argument("--dry-run", action="store_true", help="Resolve provider/key/model and print, without uploading")
    args = ap.parse_args()

    cfg = load_providers()

    if args.list_providers:
        return print_providers(cfg)

    # Resolve the provider row (explicit --provider, else config default if present).
    provider = None
    provider_id = args.provider or cfg.get("default")
    if provider_id and cfg:
        provider = find_provider(cfg, provider_id)

    # Key-env candidates: --key-env wins; else provider's keyEnv; else built-in fallback.
    if args.key_env:
        candidates = [args.key_env]
    elif provider:
        candidates = list(provider.get("keyEnv", []))
    else:
        candidates = list(KEY_ENV_CANDIDATES)

    # Model: --model wins; else provider's model; else env/default.
    model = args.model or (provider.get("model") if provider else None) or DEFAULT_MODEL

    if args.dry_run:
        key, key_src = load_key(candidates, required=False)
        print(f"# gemini-watch dry-run")
        print(f"provider:  {provider_id or '(none — built-in fallback)'}"
              + (f"  [{provider.get('kind')}]" if provider else ""))
        print(f"model:     {model}")
        print(f"keyEnv:    {', '.join(candidates)}")
        print(f"key found: {'yes, from $' + key_src if key else 'NO (set one of the keyEnv vars above)'}")
        if provider and provider.get("kind") == "transcribe":
            print("note:      this provider is transcribe-only - gemini-watch drives multimodal review;\n"
                  "           use it for the Phase-3 transcript leg, not this multimodal pass.")
        return 0

    if not args.source:
        ap.error("source video is required (or use --list-providers / --dry-run)")

    video = Path(args.source).expanduser().resolve()
    if not video.exists():
        raise SystemExit(f"File not found: {video}")

    if provider and provider.get("kind") == "transcribe":
        raise SystemExit(
            f"Provider '{provider_id}' is transcribe-only; gemini-watch runs multimodal review.\n"
            "Pick a multimodal provider (e.g. --provider gemini-voice) or use it for the transcript leg."
        )

    try:
        from google import genai  # google-genai SDK
    except ImportError:
        raise SystemExit("Missing SDK. Install with: pip install google-genai")

    key, key_src = load_key(candidates)
    print(f"[gemini-watch] provider={provider_id or 'fallback'} model={model} key=${key_src}", file=sys.stderr)
    client = genai.Client(api_key=key)

    print(f"[gemini-watch] uploading {video.name} ({video.stat().st_size/1e6:.1f} MB)…", file=sys.stderr)
    f = client.files.upload(file=str(video))

    # Video files are processed async; poll until ACTIVE.
    while f.state.name == "PROCESSING":
        print("[gemini-watch] processing…", file=sys.stderr)
        time.sleep(3)
        f = client.files.get(name=f.name)
    if f.state.name != "ACTIVE":
        raise SystemExit(f"Gemini file processing failed: state={f.state.name}")

    print(f"[gemini-watch] reviewing with {model}…", file=sys.stderr)
    resp = client.models.generate_content(
        model=model,
        contents=[f, args.prompt or REVIEW_PROMPT],
    )

    print()
    print(f"# gemini-watch report — {video.name}")
    print(f"_provider: {provider_id or 'fallback'} · model: {model}_\n")
    print(resp.text)

    try:
        client.files.delete(name=f.name)
    except Exception:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
