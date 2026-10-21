#!/usr/bin/env bash
# PreToolUse hook: quét `git add`/`git commit` để phát hiện nội dung giống
# secret/credential (API key, private key, file .env) trước khi được stage
# hoặc commit — liên hệ rules/backend.md.
#
# Nhận JSON input từ stdin theo schema PreToolUse:
#   { "tool_name": "Bash", "tool_input": { "command": "..." }, ... }
#
# Chỉ dùng permissionDecision "ask" (không "deny"): heuristic regex có thể
# false positive (ví dụ file test chứa chuỗi mẫu), nên để người dùng tự xác
# nhận thay vì chặn cứng.
#
# Best-effort: thiếu jq/git, hoặc không trích được path/diff -> không chặn.

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
add_invocations="$(git_invocations "$command_str" add)" || true
commit_invocations="$(git_invocations "$command_str" commit)" || true
[ -n "$add_invocations$commit_invocations" ] || exit 0

SECRET_PATTERN='-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|(api[_-]?key|secret|token|password)[[:space:]]*[:=][[:space:]]*["'"'"'][A-Za-z0-9/+_=-]{16,}["'"'"']'

flagged=()

is_env_file() {
  case "$1" in
    *.env|*.env.*)
      case "$1" in
        *.example|*.sample|*.template) return 1 ;;
        *) return 0 ;;
      esac
      ;;
    *) return 1 ;;
  esac
}

# Thư mục `git -C` không vào được thì không kiểm được -> hỏi lại thay vì bỏ qua.
directory_is_usable() {
  [ -z "$1" ] || [ -d "$1" ] && return 0
  flagged+=("không vào được thư mục git -C '$1' để kiểm tra")
  return 1
}

while IFS= read -r invocation; do
  [ -z "$invocation" ] && continue
  IFS=$'\037' read -r -a fields <<< "$invocation"
  add_directory="${fields[1]}"
  directory_is_usable "$add_directory" || continue
  for raw_argument in "${fields[@]:2}"; do
    case "$raw_argument" in $'\035'*|-*) continue ;; esac
    p="$(decode_shell_token "$raw_argument")"
    [ -z "$p" ] && continue
    if is_env_file "$p"; then
      flagged+=("$p (file .env)")
    fi
    path_on_disk="$p"
    case "$p" in
      /*) ;;
      *) [ -n "$add_directory" ] && path_on_disk="$add_directory/$p" ;;
    esac
    if [ -f "$path_on_disk" ] && grep -qE -- "$SECRET_PATTERN" "$path_on_disk" 2>/dev/null; then
      flagged+=("$p (khớp pattern secret)")
    fi
  done
done <<< "$add_invocations"

while IFS= read -r invocation; do
  [ -z "$invocation" ] && continue
  IFS=$'\037' read -r -a fields <<< "$invocation"
  directory_is_usable "${fields[1]}" || continue
  staged_diff="$(git -C "${fields[1]:-.}" diff --cached 2>/dev/null)" || true
  if [ -n "$staged_diff" ] && printf '%s' "$staged_diff" | grep -E '^\+' | grep -qE -- "$SECRET_PATTERN"; then
    flagged+=("staged changes (khớp pattern secret)")
  fi
done <<< "$commit_invocations"

[ "${#flagged[@]}" -eq 0 ] && exit 0

flagged_list="$(printf '%s; ' "${flagged[@]}")"
reason="Phát hiện nội dung giống secret/credential hoặc không kiểm tra được: ${flagged_list%; }. Xác nhận lại với người dùng trước khi tiếp tục (rules/backend.md)."
jq -n --arg reason "$reason" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "ask",
    permissionDecisionReason: $reason
  }
}'
exit 0
