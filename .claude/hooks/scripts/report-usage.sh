#!/usr/bin/env bash
# PostToolUse hook (matcher Skill): when skill `report` is called, measure tokens + waste issues
# from the transcript and put them in additionalContext so the change report states the real numbers.
#
# Reads JSON input from stdin per the PostToolUse schema:
#   { "session_id": "...", "transcript_path": "...", "tool_name": "Skill", "tool_input": {"skill": "report"} }
#
# Best-effort: missing jq/node/script/transcript/usage -> silent, no N/A, no estimates.
# Always exit 0 -- never blocks a tool call.

# ! Skip if the project already has the same hook (avoid running twice with the user-level copy).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0
command -v node >/dev/null 2>&1 || exit 0

input="$(cat)"

[ "$(printf '%s' "$input" | jq -r '.tool_name // ""' 2>/dev/null)" = "Skill" ] || exit 0
skill_name="$(printf '%s' "$input" | jq -r '.tool_input.skill // ""' 2>/dev/null)"
case "$skill_name" in
  report|*:report) ;;
  *) exit 0 ;;
esac

session_id="$(printf '%s' "$input" | jq -r '.session_id // ""' 2>/dev/null)"
transcript_path="$(printf '%s' "$input" | jq -r '.transcript_path // ""' 2>/dev/null)"
[ -z "$session_id" ] && exit 0
[ -f "$transcript_path" ] || exit 0

if [ -n "$CLAUDE_PROJECT_DIR" ] && [ -d "$CLAUDE_PROJECT_DIR" ]; then
  log_root="$CLAUDE_PROJECT_DIR"
else
  log_root="$(pwd)"
fi

usage_script="$log_root/.agents/skills/report/scripts/task-usage.mjs"
if [ ! -f "$usage_script" ]; then
  usage_script="$(cd "$(dirname "$0")/../../skills/report/scripts" 2>/dev/null && pwd)/task-usage.mjs"
fi
[ -f "$usage_script" ] || exit 0

marker_file="$log_root/.agents/storage/state/$session_id.json"
since_line="$(jq -r '.lastLine // 0' "$marker_file" 2>/dev/null || true)"
window_label="since previous mark"
if [ -z "$since_line" ] || [ "$since_line" = "0" ]; then
  since_line=0
  window_label="whole session"
fi

usage_json="$(node "$usage_script" --transcript "$transcript_path" --since-line "$since_line" 2>/dev/null || true)"
[ -z "$usage_json" ] && exit 0

measured_messages="$(printf '%s' "$usage_json" | jq -r '.usage.messages // 0' 2>/dev/null || true)"
[ "${measured_messages:-0}" -gt 0 ] 2>/dev/null || exit 0

compact_module="$(cd "$(dirname "$0")" 2>/dev/null && pwd)/compact-number.mjs"
[ -f "$compact_module" ] || exit 0
compact_json="$(printf '%s' "$usage_json" | node "$compact_module" 2>/dev/null || true)"
[ -z "$compact_json" ] && exit 0

usage_text="$(printf '%s' "$usage_json" | jq -r --arg label "$window_label" --argjson compact "$compact_json" '
  "📈 Token: input \($compact.input) | output \($compact.output) | cache read \($compact.cacheRead) | cache create \($compact.cacheCreate) | total \($compact.total) (\($label)).",
  (if (.waste | length) > 0 then
    "Waste issue: \(.waste | length) — " + (.waste | map("\(.rule): \(.evidence) (×\(.count))") | join("; "))
  else empty end),
  "When reporting add the Token: line per the change template (and the Waste issue: line only if the hook lists violations). Copy the shortened numbers (k/M) and the scope label above verbatim, do not use old numbers or compute your own; the numbers are counted up to the skill call and do not include messages of the current turn."
' 2>/dev/null || true)"
[ -z "$usage_text" ] && exit 0

jq -n --arg msg "$usage_text" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: $msg
  }
}' || exit 0

# * Save the emitted numbers so the Stop hook report-usage-check.sh can compare the Token line in the report.
emitted_file="$log_root/.agents/storage/state/$session_id.emitted.json"
mkdir -p "$(dirname "$emitted_file")" && printf '%s' "$usage_json" | jq -c --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  '{input: .usage.input, output: .usage.output, cacheRead: .usage.cacheRead, cacheCreate: .usage.cacheCreate, total: (.usage.input + .usage.output + .usage.cacheRead + .usage.cacheCreate), ts: $ts}' > "$emitted_file" || true

# * Only advance the marker after the numbers were emitted, so the next report measures from here.
mkdir -p "$(dirname "$marker_file")" && printf '%s' "$usage_json" | jq -c '{lastLine}' > "$marker_file" || true
exit 0
