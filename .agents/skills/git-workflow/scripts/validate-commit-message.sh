#!/usr/bin/env bash
# Validate commit message theo rules/git.md:
#   - Tiêu đề (subject) dạng "<type>: <mô tả>"
#   - Tiêu đề không quá 75 ký tự
#
# Dùng được theo 2 cách:
#   1. Làm git commit-msg hook:  ./validate-commit-message.sh "$1"
#      (git truyền path tới file chứa commit message vào $1)
#   2. Đứng riêng, đọc từ stdin: echo "feat: ..." | ./validate-commit-message.sh -
#
# Exit 0 nếu hợp lệ, exit 1 kèm danh sách lỗi (in ra stderr) nếu vi phạm.

set -euo pipefail

MAX_SUBJECT_LENGTH=75
ALLOWED_TYPES="feat|fix|refactor|docs|test|chore|style|perf|build|ci"

input_source="${1:-}"

if [ -z "$input_source" ] || [ "$input_source" = "-" ]; then
  message="$(cat)"
else
  message="$(cat "$input_source")"
fi

# Bỏ qua dòng comment (git commit -v chèn sẵn các dòng "# ...")
subject="$(printf '%s\n' "$message" | sed '/^#/d' | sed -n '1p')"

errors=()

if [ -z "$subject" ]; then
  errors+=("Thiếu tiêu đề commit (subject rỗng).")
fi

if ! printf '%s' "$subject" | grep -qE "^(${ALLOWED_TYPES})(\([a-z0-9_-]+\))?: .+"; then
  errors+=("Tiêu đề phải theo format '<type>: <mô tả>' với type thuộc [${ALLOWED_TYPES//|/, }]. Nhận được: \"${subject}\"")
fi

subject_length=${#subject}
if [ "$subject_length" -gt "$MAX_SUBJECT_LENGTH" ]; then
  errors+=("Tiêu đề dài ${subject_length} ký tự, vượt giới hạn ${MAX_SUBJECT_LENGTH} ký tự.")
fi

if [ "${#errors[@]}" -gt 0 ]; then
  echo "❌ Commit message vi phạm rules/git.md:" >&2
  for e in "${errors[@]}"; do
    echo "  - ${e}" >&2
  done
  echo "" >&2
  echo "Ví dụ hợp lệ: \"feat: thêm hook tự động format code bằng Prettier sau khi edit\"" >&2
  exit 1
fi

echo "✅ Commit message hợp lệ."
exit 0
