#!/usr/bin/env bash
# Stop hook: ghi MỘT dòng tóm tắt mỗi lượt (prompt, số lần gọi tool, file đã sửa, token)
# vào .agents/storage/logs/logs-YYYYMMDD.jsonl — cùng file audit-log.sh ghi từng tool call.
#
# Reads JSON input from stdin per the Stop schema:
#   { "session_id": "...", "transcript_path": "...", "cwd": "...", "stop_hook_active": false }
#
# Mỗi lượt chỉ ghi một lần (marker khoá `turn` của session trong .agents/storage/state/state-YYYYMMDD.json).
# Best-effort: thiếu node/script/transcript thì im lặng. Luôn exit 0, không in gì ra stdout.

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
