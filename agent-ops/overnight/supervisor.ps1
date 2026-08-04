# Overnight supervisor - watchdog for the GOAL.md loop (Windows PowerShell 5.1).
#
#   powershell -ExecutionPolicy Bypass -File agent-ops\overnight\supervisor.ps1
#
# Launches headless Claude (Opus 4.8) on GOAL.md and babysits it:
#   - HEARTBEAT stale > $StaleMin  -> kill + relaunch (fresh context; GOAL.md re-derives
#     all state from STATE.json + corpus:ledger, so a context reset loses nothing)
#   - .DONE file                   -> clean exit
#   - $Deadline reached            -> stop relaunching; kill at deadline + 15 min grace
#   - relaunch cap                 -> stop burning tokens on a crash loop
# ponytail: mtime watchdog, no cloud checker - deterministic and free. Add a haiku
# "is the ledger progressing?" probe between relaunches only if this proves too blunt.

param(
  [string]$Model = 'claude-opus-4-8',
  [int]$StaleMin = 45,
  [int]$MaxRelaunches = 6,
  [string]$Deadline = '06:30'
)

$ErrorActionPreference = 'Continue'
$repo = 'C:\Users\dev\OneDrive\Desktop\github\agentic-video-lesson-studio-chatbot'
$dir  = Join-Path $repo 'agent-ops\overnight'
$goal = Join-Path $dir 'GOAL.md'
$hb   = Join-Path $dir 'HEARTBEAT'
$done = Join-Path $dir '.DONE'
$log  = Join-Path $dir ("supervisor-{0}.log" -f (Get-Date -Format 'yyyyMMdd-HHmm'))
$deadlineAt = Get-Date $Deadline
if ($deadlineAt -lt (Get-Date)) { $deadlineAt = $deadlineAt.AddDays(1) }

function Log([string]$msg) {
  $line = "{0}  {1}" -f (Get-Date -Format 'HH:mm:ss'), $msg
  $line | Tee-Object -FilePath $log -Append
}

function Launch-Loop([int]$attempt) {
  New-Item -ItemType File -Path $hb -Force | Out-Null   # fresh heartbeat baseline
  $out = Join-Path $dir ("run-{0}.log" -f $attempt)
  Log "launch #$attempt -> $out"
  # -p reads the goal from stdin-free arg; fresh context every launch by design.
  $p = Start-Process -FilePath 'claude' -WorkingDirectory $repo -PassThru `
        -WindowStyle Hidden -RedirectStandardOutput $out `
        -RedirectStandardError (Join-Path $dir ("run-{0}.err.log" -f $attempt)) `
        -ArgumentList @('-p', ('"' + "Read and execute agent-ops/overnight/GOAL.md. You are the overnight orchestrator; follow it exactly." + '"'),
                        '--model', $Model, '--dangerously-skip-permissions')
  return $p
}

Log "supervisor up. model=$Model stale=${StaleMin}m cap=$MaxRelaunches deadline=$deadlineAt"
$attempt = 1
$proc = Launch-Loop $attempt

while ($true) {
  Start-Sleep -Seconds 300
  if (Test-Path $done) { Log "DONE flag found - clean exit."; break }

  $now = Get-Date
  $procAlive = ($proc -and -not $proc.HasExited)
  $hbAge = if (Test-Path $hb) { ($now - (Get-Item $hb).LastWriteTime).TotalMinutes } else { [double]::MaxValue }

  if ($now -gt $deadlineAt) {
    Log "deadline reached."
    if ($procAlive) {
      Log "grace 15m for wrap-up..."
      $proc.WaitForExit(900000) | Out-Null
      if (-not $proc.HasExited) { Log "killing at deadline+grace."; Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
    }
    break
  }

  if ($procAlive -and $hbAge -lt $StaleMin) { continue }   # healthy

  # Dead or stale -> relaunch (unless capped). A long render is fine: the loop is
  # instructed to touch HEARTBEAT while waiting; silence means a wedged/reset session.
  if ($procAlive) { Log ("heartbeat stale ({0:n0}m) - killing wedged session." -f $hbAge); Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
  else { Log "session exited without .DONE (exit=$($proc.ExitCode))." }

  if ($attempt -ge $MaxRelaunches) { Log "relaunch cap hit - stopping. Check REPORT/RESUME + logs."; break }
  $attempt++
  $proc = Launch-Loop $attempt
}

Log "supervisor down. Final ledger:"
Push-Location $repo
npm run corpus:ledger 2>&1 | Select-String 'CORPUS:' | ForEach-Object { Log $_.Line }
Pop-Location
