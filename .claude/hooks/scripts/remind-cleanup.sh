#!/usr/bin/env bash
# Stop hook: when the session's context window has used >= 80% (measured via
# remind-cleanup-context.mjs), remind to clean up temp/scratch files if it detects files that
# look like junk Written in this session, limited to the current project
# scope -- see skill cleanup-temp-files. ONLY reminds via additionalContext, does NOT delete
# anything and does NOT use decision/reason (those fields would block Claude from stopping).
#
# Reads JSON input from stdin per the Stop schema: { "session_id": "...", "transcript_path": "...", ... }
#
# Mỗi file chỉ nhắc một lần mỗi session: path đã nhắc lưu tại
# state theo ngày .agents/storage/state/state-YYYYMMDD.json (khoá cleanupReminded của session).
#
# Always exit 0 -- auxiliary hook, never blocks Claude Code from stopping.

# ! Skip if the project already has the same hook (avoid running twice with the user-level copy).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0
command -v node >/dev/null 2>&1 || exit 0

input="$(cat)"

session_id="$(printf '%s' "$input" | jq -r '.session_id // ""' 2>/dev/null)"
[ -z "$session_id" ] && exit 0

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
context_helper="$script_dir/remind-cleanup-context.mjs"
[ -f "$context_helper" ] || exit 0

context_usage="$(printf '%s' "$input" | node "$context_helper" 2>/dev/null)" || true
[ -z "$context_usage" ] && exit 0

finder="$script_dir/../../skills/cleanup-temp-files/scripts/find-session-scratch-files.sh"
[ -f "$finder" ] || exit 0

found="$(bash "$finder" "$session_id" 2>/dev/null)" || true
[ -z "$found" ] && exit 0

. "$script_dir/_hook-storage.sh"
log_root="$(lumina_project_root)"

reminded="$(lumina_state_get "$log_root" "$session_id" cleanupReminded | jq -r '.[]?' 2>/dev/null || true)"
if [ -n "$reminded" ]; then
  found="$(printf '%s\n' "$found" | grep -vxF -f <(printf '%s\n' "$reminded") || true)"
fi
[ -z "$found" ] && exit 0

count="$(printf '%s\n' "$found" | grep -c . || true)"
preview="$(printf '%s\n' "$found" | head -5 | tr '\n' ' ')"

jq -n --arg msg "🧹 Context used ${context_usage}. Detected ${count} file(s) that look like temp files created in this session: ${preview}-- run skill cleanup-temp-files if they need not be kept." '{
  hookSpecificOutput: {
    hookEventName: "Stop",
    additionalContext: $msg
  }
}'

# Best-effort: ghi state lỗi thì lần sau nhắc lại, không chặn Stop.
printf '%s\n' "$found" | lumina_state_push "$log_root" "$session_id" cleanupReminded
exit 0
