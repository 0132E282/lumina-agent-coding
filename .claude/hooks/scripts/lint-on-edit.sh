#!/usr/bin/env bash
# PostToolUse hook: chạy static analysis (linter/type-checker) ngay sau khi
# Edit/Write một file, báo lỗi lại cho Claude Code qua additionalContext —
# liên hệ rules/delivery.md (static analysis trước khi báo
# hoàn thành). Thuần cố vấn (advisory): KHÔNG block, vì tool đã chạy xong.
#
# Nhận JSON input từ stdin theo schema PostToolUse:
#   { "tool_name": "Edit", "tool_input": { "file_path": "..." }, ... }
#
# Best-effort: thiếu jq, không có linter tương ứng, hoặc file không thuộc
# loại được hỗ trợ -> bỏ qua êm.

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

file_path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"
[ -z "$file_path" ] && exit 0
[ -f "$file_path" ] || exit 0

lint_output=""

case "$file_path" in
  *.ts|*.tsx)
    if [ -f "tsconfig.json" ] && npx --no-install tsc --version >/dev/null 2>&1; then
      lint_output="$(npx --no-install tsc --noEmit --pretty false 2>&1)" || true
    fi
    ;;
  *.js|*.jsx)
    if [ -f ".eslintrc" ] || [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ] || [ -f ".eslintrc.cjs" ] || [ -f "eslint.config.js" ] || [ -f "eslint.config.mjs" ]; then
      if npx --no-install eslint --version >/dev/null 2>&1; then
        lint_output="$(npx --no-install eslint "$file_path" 2>&1)" || true
      fi
    fi
    ;;
  *.py)
    if command -v ruff >/dev/null 2>&1; then
      lint_output="$(ruff check "$file_path" 2>&1)" || true
    elif command -v flake8 >/dev/null 2>&1; then
      lint_output="$(flake8 "$file_path" 2>&1)" || true
    fi
    ;;
  *.php)
    if command -v phpstan >/dev/null 2>&1; then
      lint_output="$(phpstan analyse "$file_path" --no-progress 2>&1)" || true
    elif [ -x "vendor/bin/phpstan" ]; then
      lint_output="$(vendor/bin/phpstan analyse "$file_path" --no-progress 2>&1)" || true
    fi
    ;;
  *)
    exit 0
    ;;
esac

[ -z "$lint_output" ] && exit 0
# Một số tool exit 0 kèm output "no error"/"found 0 errors" -> không cần báo lại.
printf '%s' "$lint_output" | grep -qiE 'error|warning' || exit 0

context="Static analysis trên ${file_path} báo vấn đề:
${lint_output}"

jq -n --arg ctx "$context" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: $ctx
  }
}'
exit 0
