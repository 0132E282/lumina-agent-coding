#!/usr/bin/env bash
# Liệt kê file đã Write trong một session cụ thể, dựa vào .agents/storage/logs/logs.jsonl
# và file đã xoay mới nhất (ghi bởi hook audit-log) — CHỈ trong phạm vi dự án hiện tại (cwd ghi trong
# log phải khớp cwd lúc chạy script này), còn tồn trên đĩa, và khớp pattern
# "có vẻ là file tạm/scratch". Không quét gì ngoài project, không xóa gì.
#
# Dùng bởi skill cleanup-temp-files (gợi ý ứng viên) và hook remind-cleanup
# (nhắc nhở cuối session). Chỉ liệt kê — việc xác nhận là rác hay deliverable
# vẫn do Claude/người dùng quyết định.
#
# Usage: bash find-session-scratch-files.sh <session_id>
# Output: mỗi dòng một đường dẫn (có thể rỗng nếu không tìm thấy).

set -o pipefail
trap 'exit 0' ERR

session_id="${1:-}"
[ -z "$session_id" ] && exit 0

if [ -n "$CLAUDE_PROJECT_DIR" ] && [ -d "$CLAUDE_PROJECT_DIR" ]; then
  log_root="$CLAUDE_PROJECT_DIR"
else
  log_root="$(pwd)"
fi
log_dir="$log_root/.agents/storage/logs"
command -v jq >/dev/null 2>&1 || exit 0

# Đọc file đang ghi + file đã xoay mới nhất để lần xoay giữa session không che ứng viên.
# Helper nằm ở hooks/scripts (skills/ và hooks/ cùng cấp) và lọc trước theo session bằng grep;
# thiếu helper thì chỉ đọc file đang ghi. jq bên dưới vẫn lọc chính xác.
log_rotate_helper="$(dirname "$0")/../../../hooks/scripts/_log-rotate.sh"
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

# Pattern "có vẻ là tạm": tên file bắt đầu bằng tmp/scratch/debug/draft/sandbox/
# test-output, hoặc đuôi .tmp/.bak/.orig. Chỉ dựa vào tên nên vẫn có thể trùng
# file thật — vì vậy loại trừ thêm thư mục cấu hình/tài liệu bên dưới.
scratch_pattern='(^|/)(tmp|scratch|debug|draft|sandbox|test[_-]?output)[^/]*\.[A-Za-z0-9]+$|\.(tmp|bak|orig)$'
# Thư mục cấu hình/tài liệu của project (tính từ project_dir), ví dụ
# .agents/rules/debug.md là rule chính thức, không phải file tạm.
excluded_pattern='^(\.agents/(rules|skills|agents)|\.claude|\.codex|docs)/'

candidates="$(read_session_lines \
  | jq -r --arg sid "$session_id" --arg cwd "$project_dir" '
  select(.session_id == $sid and .tool == "Write" and .cwd == $cwd)
  | .input.file_path // empty
' 2>/dev/null)" || true

[ -z "$candidates" ] && exit 0

printf '%s\n' "$candidates" | sort -u | while IFS= read -r path; do
  [ -z "$path" ] && continue
  [ -f "$path" ] || continue
  relative_path="${path#"$project_dir"/}"
  printf '%s' "$relative_path" | grep -qE "$excluded_pattern" && continue
  printf '%s' "$path" | grep -qE "$scratch_pattern" && printf '%s\n' "$path"
done

exit 0
