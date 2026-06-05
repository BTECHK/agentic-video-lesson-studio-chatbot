#!/usr/bin/env python3
"""gemini-watch — the Gemini-native variant of the lesson watch gate.

Where the `watch` skill decomposes a video locally (ffmpeg frames + Whisper
transcript) and hands it to Claude, this sends the *whole* MP4 to Gemini, which
is natively multimodal: it watches the video AND listens to the audio in one
pass — frame viewing + audio listening + transcription together.

Use for a quick "does the Gemini path work?" test with an existing GEMINI_API_KEY.
For the production gate, prefer: Gemini (or Groq Whisper) for the TRANSCRIPT,
Claude as the REVIEWER (Claude is the brand/teaching judge).

Usage:
  setx / export GEMINI_API_KEY=...        # or GOOGLE_API_KEY
  python scripts/gemini-watch.py out/<lesson>.mp4
  python scripts/gemini-watch.py out/<lesson>.mp4 --model gemini-2.5-flash

Pure official SDK: `pip install google-genai`.
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

DEFAULT_MODEL = os.environ.get("GOOGLE_MODEL", "gemini-2.5-flash")

# Prioritized env var names to look for a key under. Project keys
# (GOOGLE_VOICE_API_KEY / GOOGLE_CHATBOT_API_KEY) are checked too, so the gate
# works with the keys already in your shell. Override with --key-env NAME.
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


def load_key(preferred_env: str | None = None) -> tuple[str, str]:
    """Return (key, env_name_used). Checks --key-env first, then the candidates."""
    names = (preferred_env,) if preferred_env else KEY_ENV_CANDIDATES
    for name in names:
        if not name:
            continue
        v = os.environ.get(name)
        if v and v.strip():
            return v.strip(), name
    raise SystemExit(
        "No Gemini key found. Looked in: " + ", ".join(KEY_ENV_CANDIDATES) + ".\n"
        "  PowerShell:  $env:GEMINI_API_KEY = '...'   (or use --key-env GOOGLE_VOICE_API_KEY)\n"
        "  Get one at:  https://aistudio.google.com/apikey"
    )


def main() -> int:
    ap = argparse.ArgumentParser(prog="gemini-watch")
    ap.add_argument("source", help="Local video file path (e.g. out/topic-1-lesson-1.mp4)")
    ap.add_argument("--model", default=DEFAULT_MODEL, help=f"Gemini model (default {DEFAULT_MODEL})")
    ap.add_argument("--prompt", default=None, help="Override the review prompt")
    ap.add_argument("--key-env", default=None, help="Env var name to read the key from (e.g. GOOGLE_VOICE_API_KEY)")
    args = ap.parse_args()

    video = Path(args.source).expanduser().resolve()
    if not video.exists():
        raise SystemExit(f"File not found: {video}")

    try:
        from google import genai  # google-genai SDK
    except ImportError:
        raise SystemExit("Missing SDK. Install with: pip install google-genai")

    key, key_src = load_key(args.key_env)
    print(f"[gemini-watch] using key from ${key_src}", file=sys.stderr)
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

    print(f"[gemini-watch] reviewing with {args.model}…", file=sys.stderr)
    resp = client.models.generate_content(
        model=args.model,
        contents=[f, args.prompt or REVIEW_PROMPT],
    )

    print()
    print(f"# gemini-watch report — {video.name}")
    print(f"_model: {args.model}_\n")
    print(resp.text)

    try:
        client.files.delete(name=f.name)
    except Exception:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
