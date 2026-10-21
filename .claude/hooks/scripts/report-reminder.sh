#!/usr/bin/env bash
# Stop hook: nhắc dùng skill `report` nếu phát hiện đã Edit/Write trong
# session này mà CHƯA gọi skill `report` sau đó — enforce rules/delivery.md
# bằng cơ chế thay vì chỉ dựa vào Claude tự giác. CHỈ nhắc qua
# additionalContext, KHÔNG tự chặn gì và KHÔNG dùng decision/reason (những
# field đó sẽ chặn Claude dừng lại).
#
# Nhận JSON input từ stdin theo schema Stop: { "session_id": "...", ... }
#
# Dựa vào .agents/storage/logs/logs.jsonl (ghi bởi hook audit-log) — phải bật hook
# đó cùng lúc, và audit-log phải ghi field input.skill cho tool Skill.
#
# Luôn exit 0 — hook phụ trợ, không bao giờ chặn việc Claude Code dừng lại.

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
log_file="$log_root/.agents/storage/logs/logs.jsonl"
[ -f "$log_file" ] || exit 0

project_dir="$(pwd)"

# Đếm Edit/Write xảy ra SAU lần gọi skill `report` gần nhất (hoặc từ đầu
# session nếu chưa gọi lần nào) — nếu > 0 nghĩa là có thay đổi chưa báo cáo.
result="$(jq -s -r --arg sid "$session_id" --arg cwd "$project_dir" '
  map(select(.session_id == $sid and .cwd == $cwd)) as $entries
  | ($entries | map(select(.tool == "Skill" and .input.skill == "report") | .ts) | sort | last) as $last_report
  | ($entries | map(select(.tool == "Edit" or .tool == "Write"))
      | map(select($last_report == null or .ts > $last_report))) as $pending
  | "\($pending | length)|\($pending | map(.ts) | max // "")|\($pending | map(.input.file_path // empty) | unique | .[0:5] | join(", "))"
' "$log_file" 2>/dev/null)"

[ -z "$result" ] && exit 0

count="${result%%|*}"
rest="${result#*|}"
latest_ts="${rest%%|*}"
preview="${rest#*|}"

[ -z "$count" ] && exit 0
[ "$count" = "0" ] && exit 0

# ! Nhắc một lần cho mỗi nhóm Edit/Write chưa báo cáo — nhắc lại cùng nhóm sẽ chặn Stop lặp vô hạn.
state_file="$log_root/.agents/storage/state/report-reminder-$session_id"
[ "$(cat "$state_file" 2>/dev/null)" = "$latest_ts" ] && exit 0
mkdir -p "$(dirname "$state_file")" && printf '%s' "$latest_ts" > "$state_file"

msg="📊 Đã Edit/Write ${count} lần (${preview}) mà chưa thấy gọi skill \`report\` để xuất báo cáo thay đổi — rules/delivery.md yêu cầu bắt buộc. Dùng Skill tool với \`report\` trước khi báo hoàn thành task."

jq -n --arg msg "$msg" '{
  hookSpecificOutput: {
    hookEventName: "Stop",
    additionalContext: $msg
  }
}'
exit 0
