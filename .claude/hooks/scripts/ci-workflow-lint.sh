#!/usr/bin/env bash
# PostToolUse hook: sau khi Edit/Write một file workflow CI (GitHub Actions,
# GitLab CI, Azure Pipelines), chạy linter YAML tương ứng và báo lỗi lại
# cho Claude qua additionalContext — liên hệ skill ci-pipeline và
# rules/delivery.md. Thuần cố vấn, không block.
#
# Nhận JSON input từ stdin theo schema PostToolUse:
#   { "tool_name": "Edit", "tool_input": { "file_path": "..." }, ... }
#
# Best-effort: thiếu jq, file không phải workflow CI, hoặc thiếu linter
# tương ứng (actionlint/yamllint) -> bỏ qua êm.

# ! Bỏ qua nếu project đã có cùng hook (tránh chạy 2 lần với bản user-level).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

file_path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"
[ -z "$file_path" ] && exit 0
[ -f "$file_path" ] || exit 0

lint_output=""

case "$file_path" in
  */.github/workflows/*.yml|*/.github/workflows/*.yaml)
    if command -v actionlint >/dev/null 2>&1; then
      lint_output="$(actionlint "$file_path" 2>&1)" || true
    elif command -v yamllint >/dev/null 2>&1; then
      lint_output="$(yamllint "$file_path" 2>&1)" || true
    fi
    ;;
  */.gitlab-ci.yml|*/azure-pipelines.yml|*/azure-pipelines.yaml)
    if command -v yamllint >/dev/null 2>&1; then
      lint_output="$(yamllint "$file_path" 2>&1)" || true
    fi
    ;;
  *)
    exit 0
    ;;
esac

[ -z "$lint_output" ] && exit 0

context="Lint workflow CI trên ${file_path} báo vấn đề (dùng skill ci-pipeline để review/sửa):
${lint_output}"

jq -n --arg ctx "$context" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: $ctx
  }
}'
exit 0
