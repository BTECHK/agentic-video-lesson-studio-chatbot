#!/usr/bin/env bash
# overnight-supervisor.sh — external watchdog for the autonomous build loop.
#
# Keeps a headless Claude Code session running until the deadline or until the
# job marks itself done. Bounds every run so nothing hangs, restarts on
# crash/timeout/denial-kill, and logs a heartbeat each cycle.
#
# WHY THIS EXISTS: a Claude Code session cannot restart ITSELF if it hangs or is
# killed. This wrapper provides the heartbeat, the wall-clock deadline, and the
# restart-if-stalled behavior. All the actual work + loop/retry/quality logic
# lives in .claude/commands/goal.md and agent-ops/AGENT_PLAYBOOK.md.
#
# SAFETY: this runs Claude Code with --dangerously-skip-permissions so it never
# blocks on a permission prompt overnight. ONLY run it inside an isolated,
# containerized checkout with no production credentials and no push access.
# git history is your undo button. Never run on bare metal or a real working
# copy that can push.

set -uo pipefail

# ----- Config (override via environment) -------------------------------------
REPO_DIR="${REPO_DIR:-$(pwd)}"
GOAL_FILE="${GOAL_FILE:-$REPO_DIR/.claude/commands/goal.md}"
STATE_FILE="${STATE_FILE:-$REPO_DIR/agent-ops/STATE.json}"
DONE_FLAG="${DONE_FLAG:-$REPO_DIR/agent-ops/.DONE}"
LOG_DIR="${LOG_DIR:-$REPO_DIR/agent-ops/logs}"
MODEL="${MODEL:-opus}"                                  # Opus 4.8 stands in for Fable
DEADLINE="${DEADLINE:-2026-06-21 10:00}"               # local time; stop no later than this
RUN_TIMEOUT="${RUN_TIMEOUT:-2h}"                       # watchdog: max length of ONE run; a hang is killed here
MAX_TURNS="${MAX_TURNS:-200}"                          # bound per-run agentic turns (runaway guard)
COOLDOWN_BETWEEN_RUNS="${COOLDOWN_BETWEEN_RUNS:-15}"   # seconds between runs
# -----------------------------------------------------------------------------

ts() { date '+%Y-%m-%dT%H:%M:%S%z'; }
mkdir -p "$LOG_DIR"
log() { echo "$(ts)  [supervisor]  $*" | tee -a "$LOG_DIR/supervisor.log"; }

# ----- Preflight -------------------------------------------------------------
command -v claude >/dev/null 2>&1 || { echo "FATAL: 'claude' not on PATH"; exit 1; }
command -v node   >/dev/null 2>&1 || log "WARN: node not on PATH — ponytail's lifecycle hooks may stay quiet (skills still work)."

TIMEOUT_BIN="$(command -v timeout || command -v gtimeout || true)"
[ -n "$TIMEOUT_BIN" ] || log "WARN: no 'timeout'/'gtimeout' found — runs will NOT be time-bounded. Install coreutils (Linux: built-in; macOS: 'brew install coreutils' for gtimeout) for hang protection."

[ -f "$GOAL_FILE" ] || { echo "FATAL: goal file not found: $GOAL_FILE"; exit 1; }
[ -d "$REPO_DIR/.git" ] || log "WARN: $REPO_DIR has no .git — checkpoint commits will fail."

if [ "$(id -u)" = "0" ]; then
  echo "FATAL: refuse to run as root. --dangerously-skip-permissions rejects root, and root + autonomous agent is unsafe."
  exit 1
fi

# Parse the deadline to epoch (GNU date, then BSD/macOS date fallback).
deadline_epoch="$(date -d "$DEADLINE" +%s 2>/dev/null || true)"
[ -n "$deadline_epoch" ] || deadline_epoch="$(date -j -f '%Y-%m-%d %H:%M' "$DEADLINE" +%s 2>/dev/null || true)"
[ -n "$deadline_epoch" ] || { echo "FATAL: could not parse DEADLINE='$DEADLINE' (need GNU or BSD date)."; exit 1; }

cd "$REPO_DIR" || { echo "FATAL: cannot cd to $REPO_DIR"; exit 1; }
rm -f "$DONE_FLAG"

# Build the prompt from goal.md, stripping a leading YAML frontmatter block if present.
PROMPT="$(awk 'NR==1 && $0=="---"{f=1;next} f && $0=="---"{f=0;next} !f' "$GOAL_FILE")"

log "=== overnight supervisor starting ==="
log "repo=$REPO_DIR  model=$MODEL  deadline=$DEADLINE  run_timeout=$RUN_TIMEOUT  max_turns=$MAX_TURNS"

trap 'log "signal received — exiting after current run"; exit 130' INT TERM
cycle=0

# ----- Main loop -------------------------------------------------------------
while :; do
  now_epoch="$(date +%s)"
  if [ "$now_epoch" -ge "$deadline_epoch" ]; then log "deadline reached ($DEADLINE) — stopping."; break; fi
  if [ -f "$DONE_FLAG" ]; then log "job reported DONE (found $DONE_FLAG) — stopping."; break; fi

  cycle=$((cycle + 1))
  echo "$(ts)  cycle=$cycle  status=launching" > "$LOG_DIR/heartbeat.txt"
  log "--- cycle $cycle: launching headless run (timeout ${RUN_TIMEOUT}) ---"

  rc=0
  if [ -n "$TIMEOUT_BIN" ]; then
    "$TIMEOUT_BIN" --signal=TERM --kill-after=60s "$RUN_TIMEOUT" \
      claude -p "$PROMPT" --model "$MODEL" --max-turns "$MAX_TURNS" \
        --dangerously-skip-permissions --output-format stream-json --verbose \
        >> "$LOG_DIR/run-cycle-$cycle.jsonl" 2>> "$LOG_DIR/run-cycle-$cycle.err" || rc=$?
  else
    claude -p "$PROMPT" --model "$MODEL" --max-turns "$MAX_TURNS" \
      --dangerously-skip-permissions --output-format stream-json --verbose \
      >> "$LOG_DIR/run-cycle-$cycle.jsonl" 2>> "$LOG_DIR/run-cycle-$cycle.err" || rc=$?
  fi

  case "$rc" in
    0)        log "cycle $cycle: clean exit (rc=0)." ;;
    124)      log "cycle $cycle: hit RUN_TIMEOUT — likely stalled; killed and restarting." ;;
    137|143)  log "cycle $cycle: terminated (rc=$rc); restarting." ;;
    *)        log "cycle $cycle: exited rc=$rc (turn cap, denial-kill, or error); restarting. See run-cycle-$cycle.err" ;;
  esac

  echo "$(ts)  cycle=$cycle  status=idle  last_rc=$rc" > "$LOG_DIR/heartbeat.txt"
  sleep "$COOLDOWN_BETWEEN_RUNS"
done

log "=== supervisor finished after $cycle cycle(s) ==="
log "Work is committed locally on the agent branch (not pushed). Review agent-ops/WRAP_UP.md + the visual recap."
