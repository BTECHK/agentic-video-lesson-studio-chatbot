# Security Review — `watch` skill (bradautomates/claude-video)

**Date:** 2026-06-05
**Reviewer:** Claude (technical lead pairing)
**Source:** https://github.com/bradautomates/claude-video (MIT, author Bradley Bonanno / bradautomates)
**Reason:** Requested before install — recent wave of compromised npm packages / supply-chain links.
**Method:** `git clone --depth 1` (no install, no postinstall runs) → read **every** file line-by-line.
**Installed snapshot:** `.claude/skills/watch/` is a copy of the exact reviewed commit — there is no
fetch-at-install and no postinstall step, so the code that runs is the code audited here.
**Tracking note:** `.gitignore` now un-ignores `.claude/skills/` (2026-06-05) so this audited
snapshot is committed and ships to Instructor on clone — the code in git history **is** the code reviewed
here. Local-only machinery (`settings.local.json`, `worktrees/`) stays ignored.

## Verdict: ✅ SAFE TO INSTALL

Transparent, pure-Python-stdlib skill. The SKILL.md "Security & Permissions" section matches the
code exactly (verified). **It is not an npm package** — despite the LinkedIn post mentioning npm,
the skill ships no `package.json`, no Node deps, and no install-time code execution. It shells out
only to local `ffmpeg`/`ffprobe`/`yt-dlp` and makes network calls only to the two declared,
official transcription endpoints.

## What it does (verified against source)
- `download.py` → runs `yt-dlp` to fetch the video + native captions. `subprocess.run` with an
  **argument list** (no `shell=True`), URL passed after `--`, and `is_url()` rejects args starting
  with `-`. No shell-injection surface.
- `frames.py` → `ffmpeg`/`ffprobe` to extract JPEG frames (arg lists; no shell).
- `whisper.py` → only when captions are missing **and** a key is set: extracts mono 16 kHz audio and
  POSTs **only that audio** to exactly one of:
  - `https://api.groq.com/openai/v1/audio/transcriptions` (if `GROQ_API_KEY`)
  - `https://api.openai.com/v1/audio/transcriptions` (if `OPENAI_API_KEY`)
  Bearer key from env or `~/.config/watch/.env`. No third destination, no key cross-sharing, key
  never printed to stdout/stderr/files.
- `setup.py` → preflight + installer. **No sudo.** On Windows it does **not** auto-install
  — it prints `winget`/`pip` hints. Scaffolds `~/.config/watch/.env` with **empty** placeholders at
  `0600`; never writes a key automatically; writes a `SETUP_COMPLETE` marker only.
- `watch.py` → orchestrates the above; prints a markdown report of frame paths + transcript.

## Negative checks (all clean)
- No `eval` / `exec` / `os.system` / `shell=True` anywhere.
- No `curl`/`wget`/remote-script execution; no obfuscation/base64-decode-and-run.
- No telemetry, analytics, or beaconing. No data leaves the machine except: (a) the video request to
  the host the user's URL points at, via yt-dlp; (b) extracted audio to Groq/OpenAI as above.
- No account/login/cookie access, no posting.
- `.github/workflows/release.yml` is a standard tag→GitHub-release build (`checkout@v4`,
  `action-gh-release@v2`); runs in their CI, not on our machine.
- The repo's `hooks/` SessionStart status hook only reads presence of binaries/keys and prints a
  one-line hint — it **never transmits keys**. We deliberately **did not install it** (kept the
  install to `SKILL.md` + `scripts/` + `commands/`) to avoid per-session noise; the preflight still
  runs on each `/watch` invocation.

## Operating caveats (not security issues)
1. **Host deps missing.** `ffmpeg`, `ffprobe`, `yt-dlp` are **not on the Windows host PATH** (project
   is container-first; FFmpeg lives in Docker). The `/watch` gate runs on the host, so install once:
   ```powershell
   winget install Gyan.FFmpeg
   winget install yt-dlp.yt-dlp
   ```
2. **Windows interpreter.** Use `python` (not `python3`, which is the MS Store stub). SKILL.md already
   notes this.
3. **Whisper key is optional.** Without `GROQ_API_KEY`/`OPENAI_API_KEY`, `/watch` still works on
   videos with captions and on our **local MP4s** it returns frames-only (no transcript). For the
   lesson gate we mostly watch our own rendered MP4s — frames alone already catch render/brand/text
   issues; add a Groq key (cheaper) if we want narration verified too. Per the no-paid-services rule,
   a key is opt-in, not required.

## Conclusion
Approved. Installed at `.claude/skills/watch/` (committed snapshot = audited code). Wired into the
lesson Definition of Done as the terminal review gate — see
`.planning/curriculum/LESSON-DEFINITION-OF-DONE.md`.
