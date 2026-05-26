#!/usr/bin/env python3
"""Move a GitHub Projects v2 card by issue number.

Usage:  python scripts/board.py <issue#> <status>
        status: backlog | ready | in-progress | in-review | done

Lets Claude (or anyone) move kanban cards without opening the board. Requires
the gh CLI authenticated with the 'project' scope. IDs are looked up live so
this keeps working if the board changes. UTF-8 is forced for Windows.
"""
import json
import subprocess
import sys

OWNER = "BTECHK"
PROJECT_NUM = "3"
STATUS_ALIASES = {
    "backlog": "Backlog",
    "ready": "Ready",
    "in-progress": "In progress",
    "in-review": "In review",
    "done": "Done",
}


def gh(args):
    return subprocess.run(["gh"] + args, capture_output=True, text=True, encoding="utf-8")


def main():
    if len(sys.argv) != 3:
        sys.exit("usage: board.py <issue#> <backlog|ready|in-progress|in-review|done>")
    num = int(sys.argv[1])
    status = STATUS_ALIASES.get(sys.argv[2].lower())
    if not status:
        sys.exit(f"unknown status: {sys.argv[2]} (use {'/'.join(STATUS_ALIASES)})")

    project_id = json.loads(gh(["project", "view", PROJECT_NUM, "--owner", OWNER, "--format", "json"]).stdout)["id"]
    fields = json.loads(gh(["project", "field-list", PROJECT_NUM, "--owner", OWNER, "--format", "json"]).stdout)["fields"]
    status_field = next(f for f in fields if f["name"] == "Status")
    option = next(o for o in status_field["options"] if o["name"] == status)

    items = json.loads(gh(["project", "item-list", PROJECT_NUM, "--owner", OWNER, "--format", "json", "--limit", "100"]).stdout)["items"]
    item = next((i for i in items if i.get("content", {}).get("number") == num), None)
    if not item:
        sys.exit(f"issue #{num} is not on the board")

    r = gh(["project", "item-edit", "--id", item["id"], "--project-id", project_id,
            "--field-id", status_field["id"], "--single-select-option-id", option["id"]])
    if r.returncode == 0:
        print(f"#{num} -> {status}")
    else:
        sys.exit(f"failed to move #{num}: {r.stderr}")


if __name__ == "__main__":
    main()
