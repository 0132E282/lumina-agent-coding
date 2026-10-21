#!/usr/bin/env bash
# PostToolUse hook: sau khi Edit/Write một file nguồn, tự tìm và chạy file
# test tương ứng (nếu có), báo kết quả lại cho Claude qua additionalContext
# — liên hệ rules/delivery.md (regression test ngay sau khi sửa).
#
# Nhận JSON input từ stdin theo schema PostToolUse:
#   { "tool_name": "Edit", "tool_input": { "file_path": "..." }, ... }
#
# Chỉ hỗ trợ JS/TS (jest/vitest) và Python (pytest) — hai stack phổ biến
# nhất. Không tìm thấy test tương ứng, hoặc thiếu test runner -> bỏ qua êm.

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

# File vừa sửa đã là test file -> không cần tìm test khác để chạy lại.
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

[ -z "$test_file" ] && exit 0

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

context="Đã tự chạy test tương ứng (${test_file}) sau khi sửa ${file_path}:
${result}"

jq -n --arg ctx "$context" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: $ctx
  }
}'
exit 0
