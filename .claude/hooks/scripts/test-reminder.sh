#!/usr/bin/env bash
# PostToolUse hook: sau khi Edit/Write một file nguồn, tìm file test tương ứng
# theo convention đặt tên rồi báo cho Claude qua additionalContext:
#   - Có test   -> tự chạy test đó và báo kết quả (regression test ngay sau
#                  khi sửa — liên hệ rules/delivery.md).
#   - Chưa có   -> nhắc cân nhắc viết test bằng skill testing.
# Gộp hai nhánh vào một script để mỗi Edit/Write chỉ sinh một process bash.
#
# Nhận JSON input từ stdin theo schema PostToolUse:
#   { "tool_name": "Edit", "tool_input": { "file_path": "..." }, ... }
#
# Chỉ hỗ trợ JS/TS (jest/vitest) và Python (pytest) — hai stack phổ biến
# nhất. Thiếu test runner -> bỏ qua êm. Nhánh nhắc chỉ advisory, im lặng nếu
# file nằm trong thư mục build/vendor/migration/tests hoặc là config/entry
# point. Không chặn gì, luôn exit 0.

# ! Bỏ qua nếu project đã có cùng hook (tránh chạy 2 lần với bản user-level).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

file_path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"
[ -z "$file_path" ] && exit 0
[ -f "$file_path" ] || exit 0

dir="$(dirname "$file_path")"
base="$(basename "$file_path")"
ext="${base##*.}"
name="${base%.*}"

# File vừa sửa đã là test file -> không cần chạy lại test khác hay nhắc viết test.
case "$base" in
  *.test.*|*.spec.*|test_*.py|*_test.py) exit 0 ;;
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

test_file=""
for c in "${candidates[@]}"; do
  if [ -f "$c" ]; then
    test_file="$c"
    break
  fi
done

emit_context() {
  jq -n --arg ctx "$1" '{
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: $ctx
    }
  }'
}

if [ -z "$test_file" ]; then
  # Thư mục/loại file không cần test kỹ thuật riêng -> bỏ qua êm.
  case "$file_path" in
    */node_modules/*|*/vendor/*|*/dist/*|*/build/*|*/migrations/*|*/__tests__/*|*/tests/*|*.d.ts)
      exit 0
      ;;
  esac

  # File config/entry point không mang logic cần test riêng -> bỏ qua êm.
  case "$base" in
    index.*|main.*|config.*|settings.*) exit 0 ;;
  esac

  emit_context "Chưa thấy test tương ứng cho ${file_path}. Nếu file này chứa business logic cần test kỹ thuật, dùng skill testing để viết (chọn test double đúng loại, cấu trúc Arrange-Act-Assert)."
  exit 0
fi

result=""
case "$ext" in
  ts|tsx|js|jsx)
    if npx --no-install jest --version >/dev/null 2>&1; then
      result="$(npx --no-install jest "$test_file" --silent 2>&1)" || true
    elif npx --no-install vitest --version >/dev/null 2>&1; then
      result="$(npx --no-install vitest run "$test_file" 2>&1)" || true
    fi
    ;;
  py)
    if command -v pytest >/dev/null 2>&1; then
      result="$(pytest "$test_file" -q 2>&1)" || true
    fi
    ;;
esac

[ -z "$result" ] && exit 0

emit_context "Đã tự chạy test tương ứng (${test_file}) sau khi sửa ${file_path}:
${result}"
exit 0
