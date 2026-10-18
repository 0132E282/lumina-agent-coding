#!/usr/bin/env bash
# Liệt kê file đã Write trong một session cụ thể, dựa vào .agents/storage/logs/logs.jsonl
# (ghi bởi hook audit-log) — CHỈ trong phạm vi dự án hiện tại (cwd ghi trong
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
log_file="$log_root/.agents/storage/logs/logs.jsonl"
[ -f "$log_file" ] || exit 0
command -v jq >/dev/null 2>&1 || exit 0

project_dir="$(pwd)"

# Pattern "có vẻ là tạm": tên chứa tmp/scratch/debug/draft/sandbox/test-output,
# hoặc đuôi .tmp/.bak/.orig — cố ý hẹp để tránh báo nhầm file thật.
scratch_pattern='(^|/)(tmp|scratch|debug|draft|sandbox|test[_-]?output)[^/]*\.[A-Za-z0-9]+$|\.(tmp|bak|orig)$'

candidates="$(jq -r --arg sid "$session_id" --arg cwd "$project_dir" '
  select(.session_id == $sid and .tool == "Write" and .cwd == $cwd)
  | .input.file_path // empty
' "$log_file" 2>/dev/null)" || true

[ -z "$candidates" ] && exit 0

printf '%s\n' "$candidates" | sort -u | while IFS= read -r path; do
  [ -z "$path" ] && continue
  [ -f "$path" ] || continue
  printf '%s' "$path" | grep -qE "$scratch_pattern" && printf '%s\n' "$path"
done

exit 0
