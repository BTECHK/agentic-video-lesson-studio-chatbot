#!/usr/bin/env python3
"""Sample Academy TTS sidecar.

Commercial-safe, local, free text-to-speech. One mono WAV per scene.

Implementations:
  kokoro      -- Kokoro-82M (Apache-2.0). Branded neutral default voice. DEFAULT.
  chatterbox  -- Resemble Chatterbox (MIT). Reserved for a future custom
                 voice. Requires a ~15s reference clip (see TODO below).
  paid        -- ElevenLabs/OpenAI. Inert unless an API key env var is set.

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


def synth_kokoro(text: str, voice: str, out_path: str) -> None:
    """Kokoro-82M (Apache-2.0). Branded neutral default voice."""
    # Imported lazily so the CLI can be parsed/validated without the model.
    import soundfile as sf
    from kokoro import KPipeline

    # 'a' = American English. lang_code is the first letter of the voice id.
    pipeline = KPipeline(lang_code=voice[0] if voice else "a")
    chunks = []
    for _, _, audio in pipeline(text, voice=voice):
        chunks.append(audio)
    if not chunks:
        raise RuntimeError("Kokoro produced no audio for the given text.")

    import numpy as np

    audio = np.concatenate(chunks)
    sf.write(out_path, audio, KOKORO_SAMPLE_RATE, subtype="PCM_16")


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
    """Paid cloud TTS (ElevenLabs/OpenAI). Inert unless an API key is set."""
    import os

    if not os.environ.get("TTS_PAID_API_KEY"):
        raise RuntimeError(
            "paid impl requires TTS_PAID_API_KEY. No paid service is used by default."
        )
    # TODO: implement the chosen paid provider call when/if a key is provisioned.
    raise NotImplementedError(
        "paid impl is gated and not implemented; provide TTS_PAID_API_KEY and "
        "wire the provider call before use."
    )


IMPLS = {
    "kokoro": synth_kokoro,
    "chatterbox": synth_chatterbox,
    "paid": synth_paid,
}


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Sample Academy TTS sidecar")
    parser.add_argument("--impl", default="kokoro", choices=sorted(IMPLS))
    parser.add_argument("--voice", default="af_heart")
    parser.add_argument("--out", required=True)
    parser.add_argument("--text", required=True)
    args = parser.parse_args(argv)

    if not args.text.strip():
        print("error: --text is empty", file=sys.stderr)
        return 2

    IMPLS[args.impl](args.text, args.voice, args.out)
    print(f"wrote {args.out} (impl={args.impl}, voice={args.voice})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
