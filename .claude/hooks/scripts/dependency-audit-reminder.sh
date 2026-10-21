#!/usr/bin/env bash
# PostToolUse hook: sau khi chạy lệnh cài/thêm dependency (npm/yarn/pnpm,
# composer, pip) qua tool Bash, tự chạy audit READ-ONLY tương ứng của
# chính package manager và báo lại cho Claude qua additionalContext —
# liên hệ skill dependency-audit và rules/backend.md (tinh
# thần tương tự: audit tự do, không tự ý upgrade/install thêm).
#
# Nhận JSON input từ stdin theo schema PostToolUse:
#   { "tool_name": "Bash", "tool_input": { "command": "..." }, ... }
#
# CHỈ chạy lệnh audit (không --fix/--force, không tự install/update gì
# thêm). Best-effort: thiếu jq, không khớp lệnh cài dependency nào, hoặc
# thiếu audit tool tương ứng -> bỏ qua êm.

# ! Bỏ qua nếu project đã có cùng hook (tránh chạy 2 lần với bản user-level).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

tool_name="$(printf '%s' "$input" | jq -r '.tool_name // ""' 2>/dev/null)"
[ "$tool_name" = "Bash" ] || exit 0

command_str="$(printf '%s' "$input" | jq -r '.tool_input.command // ""' 2>/dev/null)"
[ -z "$command_str" ] && exit 0

audit_cmd=""
ecosystem=""

case "$command_str" in
  *"npm install"*|*"npm i "*|*"npm add"*)
    ecosystem="npm"; audit_cmd="npm audit"
    ;;
  *"yarn add"*|*"yarn install"*)
    ecosystem="yarn"; audit_cmd="yarn audit"
    ;;
  *"pnpm add"*|*"pnpm install"*)
    ecosystem="pnpm"; audit_cmd="pnpm audit"
    ;;
  *"composer require"*|*"composer update"*)
    ecosystem="composer"; audit_cmd="composer audit"
    ;;
  *"pip install"*)
    ecosystem="pip"; audit_cmd="pip-audit"
    ;;
  *)
    exit 0
    ;;
esac

# Kiểm tra tool thực thi có sẵn trước khi chạy thử.
case "$ecosystem" in
  npm) command -v npm >/dev/null 2>&1 || exit 0 ;;
  yarn) command -v yarn >/dev/null 2>&1 || exit 0 ;;
  pnpm) command -v pnpm >/dev/null 2>&1 || exit 0 ;;
  composer) command -v composer >/dev/null 2>&1 || exit 0 ;;
  pip) command -v pip-audit >/dev/null 2>&1 || exit 0 ;;
esac

audit_output="$(eval "$audit_cmd" 2>&1)" || true
[ -z "$audit_output" ] && exit 0

# Bỏ qua khi tool tự báo không có lỗ hổng -> không cần làm phình context.
printf '%s' "$audit_output" | grep -qiE '0 vulnerabilit|no known vulnerabilit|no security vulnerability advisories found|found 0 vulnerabilit' && exit 0

context="Sau khi chạy lệnh cài dependency, ${audit_cmd} báo:
${audit_output}

Dùng skill dependency-audit để phân loại severity và đề xuất version fix — không tự ý upgrade/install thêm khi chưa được yêu cầu."

jq -n --arg ctx "$context" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: $ctx
  }
}'
exit 0
