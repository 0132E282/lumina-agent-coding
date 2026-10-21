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

printf '%s' "$command_str" | grep -qE '\bgit[[:space:]]+commit\b' || exit 0

validator=".claude/skills/git-workflow/scripts/validate-commit-message.sh"
[ -f "$validator" ] || exit 0

# Trường hợp phổ biến nhất (git commit -m "$(cat <<'EOF' ... EOF)"): lấy
# nội dung heredoc làm message.
delimiter="$(printf '%s' "$command_str" | grep -oE "<<-?['\"]?[A-Za-z_][A-Za-z0-9_]*['\"]?" | head -1 | sed -E "s/^<<-?//; s/^['\"]//; s/['\"]\$//")" || true

message=""
if [ -n "$delimiter" ]; then
  message="$(printf '%s\n' "$command_str" | awk -v d="$delimiter" '
    found==1 {
      line=$0
      gsub(/^[ \t]+|[ \t]+$/, "", line)
      if (line == d) { found=0; exit }
      print $0
      next
    }
    index($0, "<<") > 0 && index($0, d) > 0 { found=1 }
  ')" || true
fi

# Fallback: git commit -m "..." đơn giản (không heredoc).
if [ -z "$message" ]; then
  message="$(printf '%s' "$command_str" | grep -oE -- '-m[[:space:]]+"[^"]*"' | head -1 | sed -E 's/^-m[[:space:]]+"//; s/"$//')" || true
fi
if [ -z "$message" ]; then
  message="$(printf '%s' "$command_str" | grep -oE -- "-m[[:space:]]+'[^']*'" | head -1 | sed -E "s/^-m[[:space:]]+'//; s/'\$//")" || true
fi

[ -z "$message" ] && exit 0

# Dùng nội dung output để biết hợp lệ hay không (validator exit 1 khi sai —
# không dựa vào exit code trực tiếp vì `trap ERR` phía trên sẽ thoát sớm).
validation_output="$(printf '%s' "$message" | bash "$validator" - 2>&1)" || true

printf '%s' "$validation_output" | grep -q '❌' || exit 0

reason="$(printf '%s' "$validation_output" | tr '\n' ' ')"
jq -n --arg reason "$reason" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: $reason
  }
}'
exit 0
