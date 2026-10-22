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
# Helper nằm ở hooks/scripts (skills/ và hooks/ cùng cấp); thiếu thì chỉ đọc file đang ghi.
log_rotate_helper="$(dirname "$0")/../../../hooks/scripts/_log-rotate.sh"
log_files=""
if [ -f "$log_rotate_helper" ]; then
  . "$log_rotate_helper"
  log_files="$(lumina_session_log_files "$log_dir")"
elif [ -f "$log_dir/logs.jsonl" ]; then
  log_files="$log_dir/logs.jsonl"
fi
[ -z "$log_files" ] && exit 0

project_dir="$(pwd)"

# Pattern "có vẻ là tạm": tên file bắt đầu bằng tmp/scratch/debug/draft/sandbox/
# test-output, hoặc đuôi .tmp/.bak/.orig. Chỉ dựa vào tên nên vẫn có thể trùng
# file thật — vì vậy loại trừ thêm thư mục cấu hình/tài liệu bên dưới.
scratch_pattern='(^|/)(tmp|scratch|debug|draft|sandbox|test[_-]?output)[^/]*\.[A-Za-z0-9]+$|\.(tmp|bak|orig)$'
# Thư mục cấu hình/tài liệu của project (tính từ project_dir), ví dụ
# .agents/rules/debug.md là rule chính thức, không phải file tạm.
excluded_pattern='^(\.agents/(rules|skills|agents)|\.claude|\.codex|docs)/'

# Lọc trước theo session bằng grep (log ghi JSON compact); jq bên dưới vẫn lọc chính xác.
session_needle="$(jq -cn --arg sid "$session_id" '{session_id: $sid}')"
session_needle="${session_needle#\{}"
session_needle="${session_needle%\}}"

candidates="$(while IFS= read -r file; do grep -F -- "$session_needle" "$file" || true; done <<< "$log_files" \
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
