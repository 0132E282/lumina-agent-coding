#!/usr/bin/env bash
# PostToolUse hook: sau khi Edit/Write một file nguồn, nếu KHÔNG tìm thấy
# file test tương ứng (ngược lại với test-reminder.sh — hook đó xử lý
# trường hợp tìm thấy), nhắc cân nhắc viết test qua additionalContext —
# liên hệ skill testing và rules/delivery.md.
#
# Nhận JSON input từ stdin theo schema PostToolUse:
#   { "tool_name": "Edit", "tool_input": { "file_path": "..." }, ... }
#
# Chỉ hỗ trợ JS/TS và Python (cùng phạm vi với test-reminder.sh). Chỉ nhắc
# (advisory), không chặn gì — im lặng nếu: file đã là test, nằm trong thư
# mục build/vendor/migration, hoặc test tương ứng đã tồn tại.

# ! Bỏ qua nếu project đã có cùng hook (tránh chạy 2 lần với bản user-level).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

file_path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"
[ -z "$file_path" ] && exit 0
[ -f "$file_path" ] || exit 0

# Thư mục/loại file không cần test kỹ thuật riêng -> bỏ qua êm.
case "$file_path" in
  */node_modules/*|*/vendor/*|*/dist/*|*/build/*|*/migrations/*|*/__tests__/*|*/tests/*|*.d.ts)
    exit 0
    ;;
esac

dir="$(dirname "$file_path")"
base="$(basename "$file_path")"
ext="${base##*.}"
name="${base%.*}"

# File vừa sửa đã là test file, hoặc file config/entry point không mang
# logic cần test riêng -> bỏ qua êm.
case "$base" in
  *.test.*|*.spec.*|test_*.py|*_test.py|index.*|main.*|config.*|settings.*)
    exit 0
    ;;
esac

candidates=()
case "$ext" in
  ts|tsx|js|jsx)
    candidates=("$dir/$name.test.$ext" "$dir/$name.spec.$ext" "$dir/__tests__/$name.test.$ext")
    ;;
  py)
    candidates=("$dir/test_$name.py" "$dir/${name}_test.py" "$dir/tests/test_$name.py")
    ;;
  *)
    exit 0
    ;;
esac

for c in "${candidates[@]}"; do
  [ -f "$c" ] && exit 0
done

context="Chưa thấy test tương ứng cho ${file_path}. Nếu file này chứa business logic cần test kỹ thuật, dùng skill testing để viết (chọn test double đúng loại, cấu trúc Arrange-Act-Assert)."

jq -n --arg ctx "$context" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: $ctx
  }
}'
exit 0
