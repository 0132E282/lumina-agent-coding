#!/usr/bin/env bash
# PreToolUse hook: cảnh báo (ask) trước khi `git push` rủi ro cao — push
# trực tiếp lên main/master, force push, hoặc bỏ qua hook/ký commit —
# lớp phòng vệ thứ hai cho Git Safety Protocol, phòng khi agent lỡ chạy
# lệnh này mà chưa hỏi người dùng trước.
#
# Nhận JSON input từ stdin theo schema PreToolUse:
#   { "tool_name": "Bash", "tool_input": { "command": "..." }, ... }
#
# Dùng permissionDecision "ask" (không "deny"): đây là cảnh báo cho người
# dùng xác nhận, không phải cấm tuyệt đối — có tình huống hợp lệ cần push
# thẳng main hoặc force push mà người dùng đã đồng ý trước.
#
# Best-effort: thiếu jq/git -> không chặn.

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

printf '%s' "$command_str" | grep -qE '\bgit[[:space:]]+push\b' || exit 0

reasons=()

if printf '%s' "$command_str" | grep -qE -- '--force\b|--force-with-lease|([[:space:]]|^)-f([[:space:]]|$)'; then
  reasons+=("force push (có thể ghi đè lịch sử/nhánh remote)")
fi

if printf '%s' "$command_str" | grep -qE -- '--no-verify|--no-gpg-sign'; then
  reasons+=("bỏ qua hook/ký commit (--no-verify/--no-gpg-sign)")
fi

current_branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" || true
if printf '%s' "$current_branch" | grep -qE '^(main|master)$'; then
  if ! printf '%s' "$command_str" | grep -qE 'HEAD:[^[:space:]]+'; then
    reasons+=("push trực tiếp lên nhánh ${current_branch}")
  fi
fi

[ "${#reasons[@]}" -eq 0 ] && exit 0

reason_text="Hành động rủi ro cao trước khi push: $(printf '%s; ' "${reasons[@]}"). Xác nhận với người dùng trước khi tiếp tục."
jq -n --arg reason "$reason_text" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "ask",
    permissionDecisionReason: $reason
  }
}'
exit 0
