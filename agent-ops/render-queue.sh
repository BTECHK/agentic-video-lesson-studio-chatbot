#!/usr/bin/env bash
# Serial render queue for the overnight build. RENDERS OWN THE MACHINE:
# exactly ONE lesson is processed at a time, and the heavy compute (render) never
# overlaps another render. Per lesson: tts -> align -> render -> volumedetect(audible).
# Gates run as a SEPARATE batched pass afterward (agent-ops/gate-pass.sh) so no gate
# (ffmpeg+sharp) ever runs while a render is live.
#
# Robustness: per-lesson try/continue (one failure never aborts the batch), structured
# timestamped log, incremental status json, and a batch.done marker keyed to real
# completion (NOT a wall-clock guess). Resumable: skips a lesson whose MP4 is already
# newer than its lesson.json.
#
# Usage: bash agent-ops/render-queue.sh <id> [<id> ...]
set -u
cd "$(dirname "$0")/.."

LOG="agent-ops/logs/render-queue-2026-06-25.log"
STATUS="agent-ops/render-queue.status.json"
DONEMARK="agent-ops/render-queue.done"
rm -f "$DONEMARK"

# Headroom for a possibly-loaded box (learnings: starved Chrome misses frame deadlines).
export RENDER_FRAME_TIMEOUT_MS="${RENDER_FRAME_TIMEOUT_MS:-180000}"
export RENDER_TIMEOUT_MIN="${RENDER_TIMEOUT_MIN:-60}"
export RENDER_CONCURRENCY="${RENDER_CONCURRENCY:-4}"
export TTS_IMPL="${TTS_IMPL:-kokoro}"

ts(){ date '+%Y-%m-%dT%H:%M:%S'; }
logq(){ echo "[$(ts)] $*" | tee -a "$LOG"; }

IDS="$*"
logq "render-queue START ids=[$IDS]  TTS_IMPL=$TTS_IMPL frameTO=$RENDER_FRAME_TIMEOUT_MS"
DONE=""; FAILED=""
write_status(){ printf '{"updated":"%s","running":"%s","done":"%s","failed":"%s"}\n' "$(ts)" "$1" "$DONE" "$FAILED" > "$STATUS"; }

for id in $IDS; do
  write_status "$id"
  lj="content/lessons/$id/lesson.json"
  mp4="out/$id.mp4"
  if [ ! -f "$lj" ]; then logq "$id SKIP (no lesson.json)"; FAILED="$FAILED $id:nolesson"; continue; fi
  if [ -f "$mp4" ] && [ "$mp4" -nt "$lj" ]; then logq "$id SKIP (mp4 already newer than lesson.json)"; DONE="$DONE $id"; continue; fi

  logq "=== $id : tts (kokoro) ==="
  if ! npm run -s tts:lesson -- "$id" >>"$LOG" 2>&1; then logq "$id TTS FAILED"; FAILED="$FAILED $id:tts"; continue; fi
  logq "=== $id : align ==="
  if ! npm run -s align:lesson -- "$id" >>"$LOG" 2>&1; then logq "$id ALIGN FAILED"; FAILED="$FAILED $id:align"; continue; fi
  logq "=== $id : render (owns the machine) ==="
  if ! npx tsx scripts/render-lesson.ts "$id" >>"$LOG" 2>&1; then logq "$id RENDER FAILED"; FAILED="$FAILED $id:render"; continue; fi
  if [ ! -f "$mp4" ]; then logq "$id RENDER produced no mp4"; FAILED="$FAILED $id:nomp4"; continue; fi
  vol=$(ffmpeg -i "$mp4" -af volumedetect -f null - 2>&1 | grep -oE 'mean_volume: [-0-9.]+ dB' | head -1)
  sz=$(stat -c%s "$mp4" 2>/dev/null)
  logq "$id RENDERED ok  size=${sz}B  $vol"
  case "$vol" in
    *"-9"[0-9]*) logq "$id !! SILENT audio ($vol) — align-staleness? needs clean rebuild"; FAILED="$FAILED $id:silent" ;;
    "") logq "$id !! no volume reading"; FAILED="$FAILED $id:novol" ;;
    *) DONE="$DONE $id" ;;
  esac
  write_status ""
done

write_status ""
logq "render-queue batch.done  DONE=[$DONE]  FAILED=[$FAILED]"
touch "$DONEMARK"
