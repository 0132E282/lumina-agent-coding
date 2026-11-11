#!/usr/bin/env bash
# Stop hook: remind to use skill `report` if it detects an Edit/Write in
# this session with NO `report` skill call afterwards -- enforces rules/delivery.md
# by mechanism instead of relying on Claude's discipline. ONLY reminds via
# additionalContext, does NOT block anything and does NOT use decision/reason (those
# fields would block Claude from stopping).
#
# Reads JSON input from stdin per the Stop schema: { "session_id": "...", ... }
#
# Dựa vào .agents/storage/logs/logs-YYYYMMDD.jsonl (ghi bởi hook audit-log) —
# phải bật hook đó cùng lúc, và audit-log phải ghi field input.skill cho tool Skill.
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

# Đọc mọi file log theo ngày còn trong cửa sổ giữ (session có thể vắt qua nửa đêm).
# Helper lọc trước theo session bằng grep để jq -s không phải slurp cả log; jq bên dưới vẫn lọc chính xác.
storage_helper="$(dirname "$0")/_hook-storage.sh"
[ -f "$storage_helper" ] || exit 0
. "$storage_helper"
log_root="$(lumina_project_root)"
log_dir="$log_root/.agents/storage/logs"
[ -n "$(lumina_log_files "$log_dir")" ] || exit 0
read_session_lines() { lumina_session_log_lines "$log_dir" "$session_id"; }


# Count Edit/Write occurring AFTER the most recent `report` skill call (or from the start of
# the session if never called) -- if > 0 there are unreported changes.
# Only count main-session entries (no agent_id): subagent Edit/Write
# is merged by the main session into one overall report after all tasks finish.
result="$(read_session_lines \
  | jq -s -r --arg sid "$session_id" --arg cwd "$(pwd)" '
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

# ! Nhắc một lần cho mỗi nhóm Edit/Write chưa báo cáo — nhắc lại cùng nhóm sẽ chặn Stop lặp vô hạn.
reminder_marker="$(jq -cn --arg ts "$latest_ts" '$ts')"
[ "$(lumina_state_get "$log_root" "$session_id" reportReminder)" = "$reminder_marker" ] && exit 0
lumina_state_set "$log_root" "$session_id" reportReminder "$reminder_marker"

msg="📊 Edit/Write ${count} time(s) (${preview}) with no skill \`report\` call seen to produce the change report -- required by rules/delivery.md. Use the Skill tool with \`report\` before declaring the task complete; token numbers are supplied automatically when the skill is called."

jq -n --arg msg "$msg" '{
  hookSpecificOutput: {
    hookEventName: "Stop",
    additionalContext: $msg
  }
}'
exit 0
