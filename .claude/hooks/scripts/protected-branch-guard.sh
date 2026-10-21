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

. "$(dirname "$0")/_shell-command.sh"
invocations="$(git_invocations "$command_str" push)" || true
[ -n "$invocations" ] || exit 0

reasons=()

# Chỉ đọc cờ/refspec của chính lệnh `git push` thực thi, không đọc dữ liệu
# heredoc/chuỗi; subcommand động (`git "$x"`) được kiểm như push thật.
while IFS= read -r invocation; do
  [ -z "$invocation" ] && continue
  IFS=$'\037' read -r -a fields <<< "$invocation"
  directory="${fields[1]}"
  if [ -n "$directory" ] && [ ! -d "$directory" ]; then
    reasons+=("không vào được thư mục git -C '$directory' để xác định nhánh")
    continue
  fi

  force=0
  skip_verification=0
  pushes_head_refspec=0
  for raw_argument in "${fields[@]:2}"; do
    argument="$(decode_shell_token "$raw_argument")"
    case "$argument" in
      --force|--force=*|--force-with-lease|--force-with-lease=*|--force-if-includes) force=1 ;;
      --no-verify|--no-gpg-sign) skip_verification=1 ;;
      --*) ;;
      -*f*) force=1 ;;
      HEAD:?*) pushes_head_refspec=1 ;;
    esac
  done

  [ "$force" -eq 1 ] && reasons+=("force push (có thể ghi đè lịch sử/nhánh remote)")
  [ "$skip_verification" -eq 1 ] && reasons+=("bỏ qua hook/ký commit (--no-verify/--no-gpg-sign)")

  current_branch="$(git -C "${directory:-.}" rev-parse --abbrev-ref HEAD 2>/dev/null)" || true
  case "$current_branch" in
    main|master) [ "$pushes_head_refspec" -eq 0 ] && reasons+=("push trực tiếp lên nhánh ${current_branch}") ;;
  esac
done <<< "$invocations"

[ "${#reasons[@]}" -eq 0 ] && exit 0

reason_list="$(printf '%s; ' "${reasons[@]}")"
reason_text="Hành động rủi ro cao trước khi push: ${reason_list%; }. Xác nhận với người dùng trước khi tiếp tục."
jq -n --arg reason "$reason_text" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "ask",
    permissionDecisionReason: $reason
  }
}'
exit 0
