import { spawnSync } from 'node:child_process';

// #67: reliable cross-platform process-tree termination. The generate job is
// spawned detached + shell:true, so the recorded pid is the cmd.exe/npx shim and
// the real tsx/claude process is a grandchild. process.kill(pid) leaves it orphaned.

/** taskkill args that kill the entire tree, forcefully (Windows). */
export function taskkillArgs(pid: number): string[] {
  return ['/PID', String(pid), '/T', '/F'];
}

export interface KillDeps {
  platform?: NodeJS.Platform;
  /** win32 path — defaults to spawning taskkill. */
  runTaskkill?: (pid: number) => void;
  /** posix path — defaults to process.kill. */
  killPosix?: (target: number, signal: NodeJS.Signals) => void;
}

/** Kill a process and all of its descendants. */
export function killProcessTree(pid: number, deps: KillDeps = {}): void {
  const platform = deps.platform ?? process.platform;

  if (platform === 'win32') {
    const run =
      deps.runTaskkill ??
      ((p: number) => {
        spawnSync('taskkill', taskkillArgs(p), { stdio: 'ignore' });
      });
    run(pid);
    return;
  }

  // POSIX: a detached child is its own process-group leader, so a negative pid
  // signals the whole group. Fall back to the bare pid if the group is already gone.
  const kill = deps.killPosix ?? ((t: number, s: NodeJS.Signals) => process.kill(t, s));
  try {
    kill(-pid, 'SIGTERM');
  } catch {
    try {
      kill(pid, 'SIGTERM');
    } catch {
      /* already dead */
    }
  }
}

/** True if a process with this pid is currently alive. */
export function pidAlive(pid: number | undefined): boolean {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Poll until the pid is gone or the timeout elapses. Returns true if it exited. */
export async function waitForExit(pid: number, timeoutMs: number, intervalMs = 100): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!pidAlive(pid)) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return !pidAlive(pid);
}
