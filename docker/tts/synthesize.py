#!/usr/bin/env python3
"""Sample Academy TTS sidecar.

Commercial-safe, local, free text-to-speech. One mono WAV per scene.

Implementations:
  kokoro      -- Kokoro-82M (Apache-2.0). Branded neutral default voice. DEFAULT.
  chatterbox  -- Resemble Chatterbox (MIT). Reserved for a future custom
                 voice. Requires a ~15s reference clip (see TODO below).
  paid        -- Cloud TTS lane (Google/ElevenLabs/OpenAI). Inert unless a key is set.

We deliberately do NOT use XTTS-v2 or F5-TTS: their weights ship under
non-commercial (CC-BY-NC) licenses and are unsafe for a commercial product.

CLI:
  python synthesize.py --impl kokoro --voice af_heart --out scene-cover.wav \
      --text "Welcome to the lesson."

Output: 24 kHz mono 16-bit PCM WAV (Kokoro's native sample rate).
"""

import argparse
import sys

KOKORO_SAMPLE_RATE = 24000


def _kokoro_pipeline(voice: str):
    """Build a Kokoro pipeline once so a batch can reuse it (model loads once)."""
    from kokoro import KPipeline

    # 'a' = American English. lang_code is the first letter of the voice id.
    return KPipeline(lang_code=voice[0] if voice else "a")


def _is_word(text: str) -> bool:
    return any(c.isalnum() for c in text)


def _render_kokoro(pipeline, text: str, voice: str, out_path: str) -> list:
    """Synthesize one scene; return word-level alignment.

    Kokoro splits long text into chunks (one Result each); a chunk's token
    timestamps are relative to that chunk, so we offset by the cumulative audio
    duration of prior chunks to get scene-global timing. Pure-punctuation tokens
    are merged into the preceding word so captions read naturally.

    Returns a list of {word, startMs, endMs} (scene-relative milliseconds).
    """
    import numpy as np
    import soundfile as sf

    audio_chunks = []
    words: list = []
    offset_s = 0.0
    for result in pipeline(text, voice=voice):
        audio_chunks.append(result.audio)
        for tok in result.tokens or []:
            if tok.start_ts is None or tok.end_ts is None:
                continue
            start_ms = round((offset_s + tok.start_ts) * 1000)
            end_ms = round((offset_s + tok.end_ts) * 1000)
            if _is_word(tok.text):
                words.append({"word": tok.text, "startMs": start_ms, "endMs": end_ms})
            elif words:
                # Attach trailing punctuation to the previous word.
                words[-1]["word"] += tok.text
                words[-1]["endMs"] = max(words[-1]["endMs"], end_ms)
        offset_s += len(result.audio) / KOKORO_SAMPLE_RATE

    if not audio_chunks:
        raise RuntimeError("Kokoro produced no audio for the given text.")
    audio = np.concatenate(audio_chunks)
    sf.write(out_path, audio, KOKORO_SAMPLE_RATE, subtype="PCM_16")
    return words


def _write_align(align_path: str, words: list) -> None:
    import json

    _ensure_parent(align_path)
    with open(align_path, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False, indent=2)


def synth_kokoro(text: str, voice: str, out_path: str) -> None:
    """Kokoro-82M (Apache-2.0). Branded neutral default voice."""
    _render_kokoro(_kokoro_pipeline(voice), text, voice, out_path)


def synth_kokoro_batch(items: list, voice: str) -> None:
    """Synthesize many scenes in one process — the Kokoro model loads once.

    Each item is {text, out, align?}. When `align` is given, word-level
    timestamps from Kokoro are written there (exact: it's the real audio).
    """
    pipeline = _kokoro_pipeline(voice)
    for item in items:
        words = _render_kokoro(pipeline, item["text"], voice, item["out"])
        print(f"wrote {item['out']} (impl=kokoro, voice={voice})")
        if item.get("align"):
            _write_align(item["align"], words)
            print(f"wrote {item['align']} ({len(words)} words)")


def synth_chatterbox(text: str, voice: str, out_path: str) -> None:
    """Chatterbox (MIT) -- future custom-voice upgrade path.

    TODO(custom-voice): Wire this once a ~15 second clean reference clip of
    the target voice is available. Chatterbox is zero-shot: pass that clip as the
    `audio_prompt_path` to clone that voice. Do NOT attempt to obtain the clip
    automatically -- the voice owner must record and supply it. Until then this path
    raises so we never silently fall back to an unbranded voice.

    Reference: https://github.com/resemble-ai/chatterbox (MIT).
    """
    raise NotImplementedError(
        "chatterbox path is a documented stub. It needs a ~15s reference clip "
        "of Instructor's voice (audio_prompt_path) before it can be enabled. "
        "Use --impl kokoro for the branded neutral voice in the meantime."
    )


def synth_paid(text: str, voice: str, out_path: str) -> None:
    """Paid cloud TTS lane. Inert unless an API key is set."""
    import os

    key = os.environ.get("GOOGLE_VOICE_API_KEY") or os.environ.get("TTS_PAID_API_KEY")
    if not key:
        raise RuntimeError(
            "paid impl requires GOOGLE_VOICE_API_KEY (or legacy TTS_PAID_API_KEY)."
        )
    # TODO: implement the chosen paid provider call when/if a key is provisioned.
    raise NotImplementedError(
        "paid impl is gated and not implemented; provide GOOGLE_VOICE_API_KEY and "
        "wire the provider call before use."
    )


IMPLS = {
    "kokoro": synth_kokoro,
    "chatterbox": synth_chatterbox,
    "paid": synth_paid,
}


def _ensure_parent(path: str) -> None:
    import os

    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Sample Academy TTS sidecar")
    parser.add_argument("--impl", default="kokoro", choices=sorted(IMPLS))
    parser.add_argument("--voice", default="af_heart")
    parser.add_argument("--out", help="output WAV path (single-scene mode)")
    parser.add_argument("--text", help="narration text (single-scene mode)")
    parser.add_argument(
        "--manifest",
        help="JSON file of [{text, out}, ...] — batch mode, model loads once",
    )
    args = parser.parse_args(argv)

    # Batch mode: synthesize every scene in one process (kokoro only for now;
    # the batch fast-path is what the lesson pipeline uses).
    if args.manifest:
        import json

        with open(args.manifest, encoding="utf-8") as f:
            items = json.load(f)
        if not items:
            print("error: manifest is empty", file=sys.stderr)
            return 2
        for item in items:
            if not item.get("text", "").strip():
                print(f"error: empty text for {item.get('out')}", file=sys.stderr)
                return 2
            _ensure_parent(item["out"])
        if args.impl == "kokoro":
            synth_kokoro_batch(items, args.voice)
        else:
            for item in items:
                _ensure_parent(item["out"])
                IMPLS[args.impl](item["text"], args.voice, item["out"])
                print(f"wrote {item['out']} (impl={args.impl}, voice={args.voice})")
        return 0

    if not args.out or args.text is None:
        print("error: --out and --text are required without --manifest", file=sys.stderr)
        return 2
    if not args.text.strip():
        print("error: --text is empty", file=sys.stderr)
        return 2

    _ensure_parent(args.out)
    IMPLS[args.impl](args.text, args.voice, args.out)
    print(f"wrote {args.out} (impl={args.impl}, voice={args.voice})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
