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

is_protected_branch() {
  case "${1#refs/heads/}" in
    main|master) return 0 ;;
    *) return 1 ;;
  esac
}

# Nhánh remote đích của một refspec (`[+]<src>[:<dst>]`); không có `:` thì đích
# trùng nguồn, `HEAD`/`@` là nhánh hiện tại. Với `--delete`, refspec là đích.
refspec_destination() {
  local refspec="${1#+}" deleting="$2" current_branch="$3" source destination
  if [ "$deleting" -eq 1 ] || [[ "$refspec" != *:* ]]; then
    source="$refspec"
    destination="$refspec"
  else
    source="${refspec%%:*}"
    destination="${refspec#*:}"
  fi
  case "$destination" in
    HEAD|@) [ "$source" = "$destination" ] && destination="$current_branch" ;;
  esac
  printf '%s' "$destination"
}

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
  deleting=0
  pushes_every_branch=0
  options_ended=0
  skip_next=0
  positionals=()
  for raw_argument in "${fields[@]:2}"; do
    case "$raw_argument" in $'\035'*) continue ;; esac
    argument="$(decode_shell_token "$raw_argument")"
    if [ "$skip_next" -eq 1 ]; then skip_next=0; continue; fi
    if [ "$options_ended" -eq 1 ]; then positionals+=("$argument"); continue; fi
    case "$argument" in
      --) options_ended=1 ;;
      --force|--force=*|--force-with-lease|--force-with-lease=*|--force-if-includes) force=1 ;;
      --no-verify|--no-gpg-sign) skip_verification=1 ;;
      --delete) deleting=1 ;;
      --mirror|--all|--branches) pushes_every_branch=1 ;;
      --repo|--push-option|--receive-pack|--exec) skip_next=1 ;;
      --*) ;;
      -*)
        [[ "$argument" == *f* ]] && force=1
        [[ "$argument" == *d* ]] && deleting=1
        [[ "$argument" =~ ^-[A-Za-z]*o$ ]] && skip_next=1
        ;;
      *) positionals+=("$argument") ;;
    esac
  done

  [ "$force" -eq 1 ] && reasons+=("force push (có thể ghi đè lịch sử/nhánh remote)")
  [ "$skip_verification" -eq 1 ] && reasons+=("bỏ qua hook/ký commit (--no-verify/--no-gpg-sign)")
  [ "$pushes_every_branch" -eq 1 ] && reasons+=("push mọi nhánh (--mirror/--all), gồm cả main/master")

  current_branch="$(git -C "${directory:-.}" rev-parse --abbrev-ref HEAD 2>/dev/null)" || true
  # Đối số đầu là remote; không có refspec thì đích do cấu hình quyết định,
  # nên dựa vào nhánh hiện tại như trước.
  if [ "${#positionals[@]}" -le 1 ]; then
    if [ "$pushes_every_branch" -eq 0 ] && is_protected_branch "$current_branch"; then
      reasons+=("push trực tiếp lên nhánh ${current_branch}")
    fi
    continue
  fi
  for refspec in "${positionals[@]:1}"; do
    destination="$(refspec_destination "$refspec" "$deleting" "$current_branch")"
    [[ "$refspec" == +* ]] && reasons+=("force push qua refspec '$refspec'")
    if [ -z "$destination" ] || [[ "$destination" == *'*'* ]]; then
      reasons+=("refspec '$refspec' có thể gồm main/master")
    elif [ "$deleting" -eq 1 ] || [[ "$refspec" == :* ]]; then
      if is_protected_branch "$destination"; then reasons+=("xoá nhánh remote ${destination#refs/heads/}"); fi
    elif is_protected_branch "$destination"; then
      reasons+=("push trực tiếp lên nhánh ${destination#refs/heads/}")
    fi
  done
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
