#!/usr/bin/env bash
# Stop hook: remind to use skill `report` if it detects an Edit/Write in
# this session with NO `report` skill call afterwards -- enforces rules/delivery.md
# by mechanism instead of relying on Claude's discipline. ONLY reminds via
# additionalContext, does NOT block anything and does NOT use decision/reason (those
# fields would block Claude from stopping).
#
# Reads JSON input from stdin per the Stop schema: { "session_id": "...", ... }
#
# Relies on .agents/storage/logs/logs.jsonl and the newest rotated file (written by the audit-log hook) --
# that hook must be enabled too, and audit-log must record the input.skill field for the Skill tool.
#
# Always exit 0 -- auxiliary hook, never blocks Claude Code from stopping.

# ! Skip if the project already has the same hook (avoid running twice with the user-level copy).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

session_id="$(printf '%s' "$input" | jq -r '.session_id // ""' 2>/dev/null)"
[ -z "$session_id" ] && exit 0

if [ -n "$CLAUDE_PROJECT_DIR" ] && [ -d "$CLAUDE_PROJECT_DIR" ]; then
  log_root="$CLAUDE_PROJECT_DIR"
else
  log_root="$(pwd)"
fi
log_dir="$log_root/.agents/storage/logs"

# Read the active file + the newest rotated file (a session may span one rotation).
# The helper prefilters by session with grep so jq -s does not slurp the whole log; the jq below still filters exactly.
# Without the helper only the active file is read.
log_rotate_helper="$(dirname "$0")/_log-rotate.sh"
if [ -f "$log_rotate_helper" ]; then
  . "$log_rotate_helper"
  # Check the active file first (usually present) to avoid listing the directory.
  [ -f "$log_dir/logs.jsonl" ] || [ -n "$(lumina_rotated_logs "$log_dir")" ] || exit 0
  read_session_lines() { lumina_session_log_lines "$log_dir" "$session_id"; }
elif [ -f "$log_dir/logs.jsonl" ]; then
  # Still prefilter by session like the helper so a broken JSON line from another session does not make jq fail.
  session_needle="$(jq -cn --arg sid "$session_id" '{session_id: $sid}')"
  session_needle="${session_needle#\{}"
  session_needle="${session_needle%\}}"
  read_session_lines() { grep -F -- "$session_needle" "$log_dir/logs.jsonl" || true; }
else
  exit 0
fi

project_dir="$(pwd)"

# Count Edit/Write occurring AFTER the most recent `report` skill call (or from the start of
# the session if never called) -- if > 0 there are unreported changes.
# Only count main-session entries (no agent_id): subagent Edit/Write
# is merged by the main session into one overall report after all tasks finish.
result="$(read_session_lines \
  | jq -s -r --arg sid "$session_id" --arg cwd "$project_dir" '
  map(select(.session_id == $sid and .cwd == $cwd and ((.agent_id // "") == ""))) as $entries
  | ($entries | map(select(.tool == "Skill" and .input.skill == "report") | .ts) | sort | last) as $last_report
  | ($entries | map(select(.tool == "Edit" or .tool == "Write"))
      | map(select($last_report == null or .ts > $last_report))) as $pending
  | "\($pending | length)|\($pending | map(.ts) | max // "")|\($pending | map(.input.file_path // empty) | unique | .[0:5] | join(", "))"
' 2>/dev/null)"

[ -z "$result" ] && exit 0

count="${result%%|*}"
rest="${result#*|}"
latest_ts="${rest%%|*}"
preview="${rest#*|}"

[ -z "$count" ] && exit 0
[ "$count" = "0" ] && exit 0

# ! Remind once per group of unreported Edit/Write -- reminding the same group again would block Stop in an infinite loop.
state_file="$log_root/.agents/storage/state/report-reminder-$session_id"
[ "$(cat "$state_file" 2>/dev/null)" = "$latest_ts" ] && exit 0
mkdir -p "$(dirname "$state_file")" && printf '%s' "$latest_ts" > "$state_file"

msg="📊 Edit/Write ${count} time(s) (${preview}) with no skill \`report\` call seen to produce the change report -- required by rules/delivery.md. Use the Skill tool with \`report\` before declaring the task complete; token numbers are supplied automatically when the skill is called."

jq -n --arg msg "$msg" '{
  hookSpecificOutput: {
    hookEventName: "Stop",
    additionalContext: $msg
  }
}'
exit 0
