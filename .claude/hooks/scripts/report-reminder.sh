#!/usr/bin/env bash
# Stop hook: nhắc dùng skill `report` nếu phát hiện đã Edit/Write trong
# session này mà CHƯA gọi skill `report` sau đó — enforce rules/delivery.md
# bằng cơ chế thay vì chỉ dựa vào Claude tự giác. CHỈ nhắc qua
# additionalContext, KHÔNG tự chặn gì và KHÔNG dùng decision/reason (những
# field đó sẽ chặn Claude dừng lại).
#
# Nhận JSON input từ stdin theo schema Stop: { "session_id": "...", ... }
#
# Dựa vào .agents/storage/logs/logs-YYYYMMDD.jsonl (ghi bởi hook audit-log) —
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

# Đọc mọi file log theo ngày còn trong cửa sổ giữ (session có thể vắt qua nửa đêm).
# Helper lọc trước theo session bằng grep để jq -s không phải slurp cả log; jq bên dưới vẫn lọc chính xác.
storage_helper="$(dirname "$0")/_hook-storage.sh"
[ -f "$storage_helper" ] || exit 0
. "$storage_helper"
log_root="$(lumina_project_root)"
log_dir="$log_root/.agents/storage/logs"
[ -n "$(lumina_log_files "$log_dir")" ] || exit 0
read_session_lines() { lumina_session_log_lines "$log_dir" "$session_id"; }


# Đếm Edit/Write xảy ra SAU lần gọi skill `report` gần nhất (hoặc từ đầu
# session nếu chưa gọi lần nào) — nếu > 0 nghĩa là có thay đổi chưa báo cáo.
# Chỉ tính entry của phiên chính (không có agent_id): Edit/Write của subagent
# được phiên chính gộp vào một báo cáo tổng sau khi mọi task xong.
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

msg="📊 Đã Edit/Write ${count} lần (${preview}) mà chưa thấy gọi skill \`report\` để xuất báo cáo thay đổi — rules/delivery.md yêu cầu bắt buộc. Dùng Skill tool với \`report\` trước khi báo hoàn thành task; số token sẽ được cung cấp tự động khi gọi skill."

jq -n --arg msg "$msg" '{
  hookSpecificOutput: {
    hookEventName: "Stop",
    additionalContext: $msg
  }
}'
exit 0
