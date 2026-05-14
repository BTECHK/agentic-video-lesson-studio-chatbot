import { execSync } from 'node:child_process';

// --- Command injection prevention (T-04-02) ---

const SHELL_METACHAR_PATTERN = /[;|&$`]/;

export function sanitizeVendorName(vendor: string): string {
  if (SHELL_METACHAR_PATTERN.test(vendor)) {
    throw new Error(
      `Invalid vendor name "${vendor}": contains shell metacharacters`,
    );
  }
  if (!/^[a-z0-9-]+$/.test(vendor)) {
    throw new Error(
      `Invalid vendor name "${vendor}": must be lowercase alphanumeric with hyphens only`,
    );
  }
  return vendor;
}

// --- Git remote validation ---

export function checkGitRemote(): { configured: boolean; url?: string } {
  try {
    const url = execSync('git config --get remote.origin.url', {
      encoding: 'utf-8',
    }).trim();
    return { configured: true, url };
  } catch {
    // No remote configured — return gracefully with setup instructions
    return { configured: false };
  }
}

// --- Existing PR detection (Pitfall 3) ---

export function checkExistingPR(vendor: string): boolean {
  const safe = sanitizeVendorName(vendor);
  try {
    const output = execSync(
      `gh pr list --search "content(${safe})" --state open --json number --limit 1`,
      { encoding: 'utf-8' },
    ).trim();
    const prs = JSON.parse(output);
    return Array.isArray(prs) && prs.length > 0;
  } catch {
    // gh CLI not available or error — assume no existing PR
    return false;
  }
}

// --- Per-vendor PR workflow (D-05, D-06) ---

export interface PRResult {
  branch: string;
  prUrl?: string;
  skipped?: string;
}

export function createVendorPR(
  vendor: string,
  changedFiles: string[],
  baseBranch: string = 'main',
  dryRun: boolean = false,
): PRResult {
  const safe = sanitizeVendorName(vendor);

  // Check remote first — throw with setup instructions if missing
  const remote = checkGitRemote();
  if (!remote.configured) {
    throw new Error(
      'No git remote configured. Run: git remote add origin <your-repo-url>',
    );
  }

  // Check for existing PR — skip if found
  if (checkExistingPR(safe)) {
    return {
      branch: '',
      skipped: `Open PR already exists for vendor "${safe}"`,
    };
  }

  const branch = `content/update-${safe}-${Date.now()}`;

  if (dryRun) {
    return { branch };
  }

  try {
    // Create branch, stage, commit, push, create PR
    execSync(`git checkout -b "${branch}"`, { encoding: 'utf-8' });

    for (const file of changedFiles) {
      execSync(`git add "${file}"`, { encoding: 'utf-8' });
    }

    execSync(
      `git commit -m "content(${safe}): update tool data"`,
      { encoding: 'utf-8' },
    );

    execSync(`git push -u origin "${branch}"`, { encoding: 'utf-8' });

    const prOutput = execSync(
      `gh pr create --base "${baseBranch}" --title "content(${safe}): update tool data" --body "Automated content update for ${safe}"`,
      { encoding: 'utf-8' },
    ).trim();

    // T-04-04: Only log PR URL, never full gh CLI output
    const prUrl = prOutput.split('\n').pop() ?? prOutput;

    return { branch, prUrl };
  } catch (err) {
    // Switch back to base branch on failure
    try {
      execSync(`git checkout "${baseBranch}"`, { encoding: 'utf-8' });
    } catch {
      // Best effort
    }
    throw err;
  }
}
