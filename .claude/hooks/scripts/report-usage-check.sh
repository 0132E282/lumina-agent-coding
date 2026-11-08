#!/usr/bin/env bash
# Stop hook: compare the `Token:` line in the final report with the numbers report-usage.sh inserted
# (.agents/storage/state/<session_id>.emitted.json). On mismatch remind to fix via additionalContext,
# do NOT use decision/reason (would block Stop). Each kind of mismatch is reminded only once.
#
# Reads JSON input from stdin per the Stop schema:
#   { "session_id": "...", "transcript_path": "...", "stop_hook_active": false, "last_assistant_message": "..." }
#
# Best-effort: missing node/parse error -> silent. Always exit 0 -- never blocks.

# ! Skip if the project already has the same hook (avoid running twice with the user-level copy).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v node >/dev/null 2>&1 || exit 0

helper="$(cd "$(dirname "$0")" 2>/dev/null && pwd)/report-usage-check.mjs"
[ -f "$helper" ] || exit 0

if [ -n "$CLAUDE_PROJECT_DIR" ] && [ -d "$CLAUDE_PROJECT_DIR" ]; then
  log_root="$CLAUDE_PROJECT_DIR"
else
  log_root="$(pwd)"
fi

node "$helper" "$log_root" 2>/dev/null || true
exit 0
