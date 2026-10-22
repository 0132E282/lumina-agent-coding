#!/usr/bin/env bash
# Stop hook: nhắc dùng skill `report` nếu phát hiện đã Edit/Write trong
# session này mà CHƯA gọi skill `report` sau đó — enforce rules/delivery.md
# bằng cơ chế thay vì chỉ dựa vào Claude tự giác. CHỈ nhắc qua
# additionalContext, KHÔNG tự chặn gì và KHÔNG dùng decision/reason (những
# field đó sẽ chặn Claude dừng lại).
#
# Nhận JSON input từ stdin theo schema Stop: { "session_id": "...", ... }
#
# Dựa vào .agents/storage/logs/logs.jsonl và file đã xoay mới nhất (ghi bởi hook audit-log) —
# phải bật hook đó cùng lúc, và audit-log phải ghi field input.skill cho tool Skill.
#
# Luôn exit 0 — hook phụ trợ, không bao giờ chặn việc Claude Code dừng lại.

# ! Bỏ qua nếu project đã có cùng hook (tránh chạy 2 lần với bản user-level).
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

# Đọc file đang ghi + file đã xoay mới nhất (session có thể vắt qua một lần xoay).
# Helper lọc trước theo session bằng grep để jq -s không phải slurp cả log; jq bên dưới vẫn lọc chính xác.
# Thiếu helper thì chỉ đọc file đang ghi.
log_rotate_helper="$(dirname "$0")/_log-rotate.sh"
if [ -f "$log_rotate_helper" ]; then
  . "$log_rotate_helper"
  # Kiểm file đang ghi trước (thường có) để không phải liệt kê thư mục.
  [ -f "$log_dir/logs.jsonl" ] || [ -n "$(lumina_rotated_logs "$log_dir")" ] || exit 0
  read_session_lines() { lumina_session_log_lines "$log_dir" "$session_id"; }
elif [ -f "$log_dir/logs.jsonl" ]; then
  # Vẫn lọc trước theo session như helper để dòng JSON hỏng của session khác không làm jq thất bại.
  session_needle="$(jq -cn --arg sid "$session_id" '{session_id: $sid}')"
  session_needle="${session_needle#\{}"
  session_needle="${session_needle%\}}"
  read_session_lines() { grep -F -- "$session_needle" "$log_dir/logs.jsonl" || true; }
else
  exit 0
fi

project_dir="$(pwd)"

# Đếm Edit/Write xảy ra SAU lần gọi skill `report` gần nhất (hoặc từ đầu
# session nếu chưa gọi lần nào) — nếu > 0 nghĩa là có thay đổi chưa báo cáo.
# Chỉ tính entry của phiên chính (không có agent_id): Edit/Write của subagent
# được phiên chính gộp vào một báo cáo tổng sau khi mọi task xong.
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

# ! Nhắc một lần cho mỗi nhóm Edit/Write chưa báo cáo — nhắc lại cùng nhóm sẽ chặn Stop lặp vô hạn.
state_file="$log_root/.agents/storage/state/report-reminder-$session_id"
[ "$(cat "$state_file" 2>/dev/null)" = "$latest_ts" ] && exit 0
mkdir -p "$(dirname "$state_file")" && printf '%s' "$latest_ts" > "$state_file"

msg="📊 Đã Edit/Write ${count} lần (${preview}) mà chưa thấy gọi skill \`report\` để xuất báo cáo thay đổi — rules/delivery.md yêu cầu bắt buộc. Dùng Skill tool với \`report\` trước khi báo hoàn thành task; số token sẽ được cung cấp tự động khi gọi skill."

jq -n --arg msg "$msg" '{
  hookSpecificOutput: {
    hookEventName: "Stop",
    additionalContext: $msg
  }
}'
exit 0
