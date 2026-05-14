import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'node:child_process';
import {
  sanitizeVendorName,
  checkGitRemote,
  checkExistingPR,
  createVendorPR,
} from '../scripts/ingest/pr-workflow';

const mockExecSync = vi.mocked(execSync);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sanitizeVendorName', () => {
  it('accepts valid lowercase vendor name', () => {
    expect(sanitizeVendorName('anthropic')).toBe('anthropic');
  });

  it('accepts vendor name with hyphens', () => {
    expect(sanitizeVendorName('openai-codex')).toBe('openai-codex');
  });

  it('throws on semicolon injection', () => {
    expect(() => sanitizeVendorName(';rm -rf')).toThrow(
      'shell metacharacters',
    );
  });

  it('throws on pipe injection', () => {
    expect(() => sanitizeVendorName('|malicious')).toThrow(
      'shell metacharacters',
    );
  });

  it('throws on backtick injection', () => {
    expect(() => sanitizeVendorName('vendor`cmd`')).toThrow(
      'shell metacharacters',
    );
  });

  it('throws on ampersand injection', () => {
    expect(() => sanitizeVendorName('vendor&cmd')).toThrow(
      'shell metacharacters',
    );
  });

  it('throws on dollar sign injection', () => {
    expect(() => sanitizeVendorName('vendor$HOME')).toThrow(
      'shell metacharacters',
    );
  });

  it('throws on uppercase characters', () => {
    expect(() => sanitizeVendorName('OpenAI')).toThrow(
      'lowercase alphanumeric',
    );
  });
});

describe('checkGitRemote', () => {
  it('returns configured true with URL when remote exists', () => {
    mockExecSync.mockReturnValue(
      'https://github.com/user/repo.git\n' as any,
    );
    const result = checkGitRemote();
    expect(result.configured).toBe(true);
    expect(result.url).toBe('https://github.com/user/repo.git');
  });

  it('returns configured false when execSync throws', () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('exit code 1');
    });
    const result = checkGitRemote();
    expect(result.configured).toBe(false);
    expect(result.url).toBeUndefined();
  });
});

describe('checkExistingPR', () => {
  it('returns true when open PR exists', () => {
    mockExecSync.mockReturnValue('[{"number": 42}]' as any);
    expect(checkExistingPR('anthropic')).toBe(true);
  });

  it('returns false when no open PRs', () => {
    mockExecSync.mockReturnValue('[]' as any);
    expect(checkExistingPR('anthropic')).toBe(false);
  });

  it('returns false when gh CLI throws', () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('gh: not found');
    });
    expect(checkExistingPR('anthropic')).toBe(false);
  });
});

describe('createVendorPR', () => {
  it('throws with setup instructions when no remote', () => {
    // First call: checkGitRemote -> no remote
    mockExecSync.mockImplementation(() => {
      throw new Error('exit code 1');
    });

    expect(() =>
      createVendorPR('anthropic', ['content/tools/claude.json']),
    ).toThrow('No git remote configured');
  });

  it('skips when existing PR found', () => {
    // First call: checkGitRemote -> has remote
    // Second call: checkExistingPR -> has PR
    let callCount = 0;
    mockExecSync.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return 'https://github.com/user/repo.git\n' as any;
      if (callCount === 2) return '[{"number": 42}]' as any;
      return '' as any;
    });

    const result = createVendorPR('anthropic', ['content/tools/claude.json']);
    expect(result.skipped).toContain('Open PR already exists');
    expect(result.branch).toBe('');
  });

  it('in dryRun returns branch name without push/PR', () => {
    let callCount = 0;
    mockExecSync.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return 'https://github.com/user/repo.git\n' as any;
      if (callCount === 2) return '[]' as any;
      return '' as any;
    });

    const result = createVendorPR(
      'anthropic',
      ['content/tools/claude.json'],
      'main',
      true,
    );
    expect(result.branch).toMatch(/^content\/update-anthropic-\d+$/);
    expect(result.prUrl).toBeUndefined();
    // Only 2 execSync calls: checkGitRemote + checkExistingPR
    expect(callCount).toBe(2);
  });

  it('creates branch, commits, pushes, and creates PR', () => {
    let callCount = 0;
    mockExecSync.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return 'https://github.com/user/repo.git\n' as any;
      if (callCount === 2) return '[]' as any;
      // git checkout -b, git add, git commit, git push, gh pr create
      if (callCount === 7) return 'https://github.com/user/repo/pull/1\n' as any;
      return '' as any;
    });

    const result = createVendorPR('openai', ['content/tools/chatgpt.json']);
    expect(result.branch).toMatch(/^content\/update-openai-\d+$/);
    expect(result.prUrl).toBe('https://github.com/user/repo/pull/1');
    // 7 calls: remote check, PR check, checkout, add, commit, push, gh pr create
    expect(callCount).toBe(7);
  });
});
