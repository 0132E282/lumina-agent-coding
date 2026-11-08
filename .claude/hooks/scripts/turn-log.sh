#!/usr/bin/env bash
# Stop hook: write ONE summary line per turn (prompt, tool call count, edited files, tokens)
# to .agents/storage/logs/logs.jsonl -- the same file audit-log.sh writes each tool call to.
#
# Reads JSON input from stdin per the Stop schema:
#   { "session_id": "...", "transcript_path": "...", "cwd": "...", "stop_hook_active": false }
#
# Written only once per turn (marker .agents/storage/state/<session_id>.turn.json).
# Best-effort: missing node/script/transcript -> silent. Always exit 0, prints nothing to stdout.

# ! Skip if the project already has the same hook (avoid running twice with the user-level copy).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v node >/dev/null 2>&1 || exit 0

helper="$(cd "$(dirname "$0")" 2>/dev/null && pwd)/turn-log.mjs"
[ -f "$helper" ] || exit 0

usage_script=""
if [ -n "$CLAUDE_PROJECT_DIR" ] && [ -f "$CLAUDE_PROJECT_DIR/.agents/skills/report/scripts/task-usage.mjs" ]; then
  usage_script="$CLAUDE_PROJECT_DIR/.agents/skills/report/scripts/task-usage.mjs"
else
  usage_script="$(cd "$(dirname "$0")/../../skills/report/scripts" 2>/dev/null && pwd)/task-usage.mjs"
fi
[ -f "$usage_script" ] || exit 0

node "$helper" "$usage_script" >/dev/null 2>&1 || true
exit 0
