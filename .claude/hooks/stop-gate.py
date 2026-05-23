#!/usr/bin/env python3
"""AUTOMATED QUALITY GATE — Claude Code Stop hook.

Blocks the agent from ending a turn while the changed slice has broken code.
This is the structural enforcement of the project's "never report complete
without tests" rule (moved out of CLAUDE.md prose into an actual gate).

Behaviour:
- Reads the Stop-hook JSON payload from stdin.
- Honours `stop_hook_active` to avoid infinite re-trigger loops.
- Detects which slice changed (root and/or chatbot) from git, then runs that
  slice's fast `check` (typecheck + lint + test). Full builds are intentionally
  left to CI (.github/workflows/ci.yml) to keep the inner loop fast.
- exit 0  -> clean, allow stop.
- exit 2  -> broken, block stop; stderr is shown back to the agent.

Right-sized for the current stage (solo, local-first). See
.planning/PROJECT-PLAN-2026-05-23.md §7.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

# Extensions that mean "code changed" for a slice.
CODE_RE = re.compile(r"\.(ts|tsx|js|jsx|mjs|cjs)$")
# Config files that should also trigger a slice's check.
TRIGGER_FILES = (
    "package.json",
    "tsconfig.json",
    "eslint.config.mjs",
    "vitest.config.ts",
)


def repo_root() -> Path:
    try:
        out = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True, text=True, check=True,
        )
        return Path(out.stdout.strip())
    except Exception:
        return Path.cwd()


def changed_paths(root: Path) -> list[str]:
    """Tracked changes (staged+unstaged vs HEAD) plus untracked files."""
    paths: set[str] = set()
    try:
        diff = subprocess.run(
            ["git", "diff", "--name-only", "HEAD"],
            cwd=root, capture_output=True, text=True, check=True,
        )
        paths.update(p for p in diff.stdout.splitlines() if p)
        untracked = subprocess.run(
            ["git", "ls-files", "--others", "--exclude-standard"],
            cwd=root, capture_output=True, text=True, check=True,
        )
        paths.update(p for p in untracked.stdout.splitlines() if p)
    except Exception:
        return []
    return sorted(paths)


def slice_triggered(paths: list[str], prefix: str) -> bool:
    """prefix='' -> root slice (anything outside chatbot/); 'chatbot/' -> chatbot."""
    for p in paths:
        in_chatbot = p.startswith("chatbot/")
        if prefix == "chatbot/" and not in_chatbot:
            continue
        if prefix == "" and in_chatbot:
            continue
        name = p.split("/")[-1]
        if CODE_RE.search(p) or name in TRIGGER_FILES:
            return True
    return False


def run_check(cwd: Path) -> tuple[int, str]:
    proc = subprocess.run(
        ["npm", "run", "check"],
        cwd=cwd, capture_output=True, text=True, shell=(sys.platform == "win32"),
    )
    return proc.returncode, (proc.stdout + "\n" + proc.stderr)


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        payload = {}

    # Loop guard: if we already blocked once this stop cycle, let it through.
    if payload.get("stop_hook_active"):
        return 0

    root = repo_root()
    paths = changed_paths(root)
    if not paths:
        return 0  # nothing changed (or no git) — nothing to gate.

    targets: list[tuple[str, Path]] = []
    if slice_triggered(paths, ""):
        targets.append(("root", root))
    if slice_triggered(paths, "chatbot/") and (root / "chatbot").is_dir():
        targets.append(("chatbot", root / "chatbot"))

    if not targets:
        return 0  # only docs/planning/assets changed — no code gate needed.

    failures: list[str] = []
    for name, cwd in targets:
        code, output = run_check(cwd)
        if code != 0:
            tail = "\n".join(output.strip().splitlines()[-40:])
            failures.append(f"### {name} `npm run check` FAILED (exit {code})\n{tail}")

    if failures:
        msg = (
            "AUTOMATED QUALITY GATE: blocked.\n\n"
            "The changed slice does not pass typecheck + lint + test. "
            "Fix the failures below before ending the turn (do not claim "
            "completion while these are red):\n\n"
            + "\n\n".join(failures)
            + "\n\n(Builds run in CI, not this gate. To inspect locally: "
            "`npm run check` at root and/or in chatbot/.)"
        )
        print(msg, file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
