import { describe, it, expect, vi } from 'vitest';
import { spawn } from 'node:child_process';
import {
  taskkillArgs,
  killProcessTree,
  pidAlive,
  waitForExit,
} from '@/lib/process-tree';

// #67: cancel must kill the whole process tree. With shell:true the recorded pid is
// the cmd.exe/npx shim; killing only it orphans the real tsx/claude grandchild.

describe('taskkillArgs', () => {
  it('targets the whole tree, forcefully', () => {
    const args = taskkillArgs(1234);
    expect(args).toContain('/T'); // tree (children too)
    expect(args).toContain('/F'); // force
    expect(args).toContain('1234');
  });
});

describe('killProcessTree dispatch', () => {
  it('uses taskkill on win32', () => {
    const runTaskkill = vi.fn();
    killProcessTree(1234, { platform: 'win32', runTaskkill });
    expect(runTaskkill).toHaveBeenCalledWith(1234);
  });

  it('kills the process group (negative pid) on posix', () => {
    const killPosix = vi.fn();
    killProcessTree(1234, { platform: 'linux', killPosix });
    expect(killPosix).toHaveBeenCalledWith(-1234, 'SIGTERM');
  });

  it('falls back to the bare pid when the group kill throws', () => {
    const killPosix = vi.fn((target: number) => {
      if (target < 0) throw new Error('ESRCH');
    });
    killProcessTree(1234, { platform: 'linux', killPosix });
    expect(killPosix).toHaveBeenCalledWith(-1234, 'SIGTERM');
    expect(killPosix).toHaveBeenCalledWith(1234, 'SIGTERM');
  });
});

describe('killProcessTree (real process tree)', () => {
  it('terminates a detached child spawned the way the generate route spawns it', async () => {
    // Same spawn shape as POST /api/generate: detached + shell:true (so on Windows
    // child.pid is the shim and the real node process is a grandchild).
    const child = spawn('node', ['-e', 'setInterval(() => {}, 1e9)'], {
      detached: true,
      stdio: 'ignore',
      shell: true,
    });
    const pid = child.pid!;
    expect(pidAlive(pid)).toBe(true);

    killProcessTree(pid);

    const exited = await waitForExit(pid, 5000);
    expect(exited).toBe(true);
  }, 15000);
});
