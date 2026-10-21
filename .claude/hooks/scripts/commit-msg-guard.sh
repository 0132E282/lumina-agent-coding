#!/usr/bin/env bash
# PreToolUse hook: chặn lệnh `git commit` nếu message không đúng format
# Conventional Commits — enforce rules/git.md tự động,
# không phụ thuộc Claude Code tự giác tuân theo rule.
#
# Nhận JSON input từ stdin theo schema PreToolUse:
#   { "tool_name": "Bash", "tool_input": { "command": "..." }, ... }
#
# Chặn (deny) bằng cách in JSON hookSpecificOutput ra stdout + exit 0
# (đúng protocol PreToolUse của Claude Code — exit 0 kèm JSON hợp lệ thì
# JSON mới là cái quyết định, không phải exit code).
#
# Best-effort: nếu không trích được message (ví dụ commit mở editor,
# dùng -F file, hoặc thiếu jq/validator) -> không chặn, để git tự xử lý.

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

. "$(dirname "$0")/_shell-command.sh"
invocations="$(git_invocations "$command_str" commit)" || true
[ -n "$invocations" ] || exit 0

validator=".claude/skills/git-workflow/scripts/validate-commit-message.sh"
[ -f "$validator" ] || exit 0

# Message chỉ lấy từ đối số của chính lệnh `git commit` (-m/--message, hoặc
# -F - kèm heredoc); không lấy heredoc/-m của lệnh khác như `cat`/`git tag`.
reasons=()
while IFS= read -r invocation; do
  [ -z "$invocation" ] && continue
  IFS=$'\037' read -r -a fields <<< "$invocation"
  message="$(git_commit_message "${fields[@]:2}")" || continue
  [ -z "$message" ] && continue
  # Dùng nội dung output để biết hợp lệ hay không (validator exit 1 khi sai —
  # không dựa vào exit code trực tiếp vì `trap ERR` phía trên sẽ thoát sớm).
  validation_output="$(printf '%s' "$message" | bash "$validator" - 2>&1)" || true
  printf '%s' "$validation_output" | grep -q '❌' || continue
  reasons+=("$(printf '%s' "$validation_output" | tr '\n' ' ')")
done <<< "$invocations"

[ "${#reasons[@]}" -eq 0 ] && exit 0

reason="${reasons[*]}"
jq -n --arg reason "$reason" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: $reason
  }
}'
exit 0
