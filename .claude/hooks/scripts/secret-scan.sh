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

printf '%s' "$command_str" | grep -qE '\bgit[[:space:]]+(add|commit)\b' || exit 0

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

if printf '%s' "$command_str" | grep -qE '\bgit[[:space:]]+add\b'; then
  paths="$(printf '%s' "$command_str" | grep -oE 'git[[:space:]]+add[^&|;]*' | sed -E 's/^git[[:space:]]+add//' | tr ' ' '\n' | grep -vE '^-|^$')" || true
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    if is_env_file "$p"; then
      flagged+=("$p (file .env)")
    fi
    if [ -f "$p" ] && grep -qE "$SECRET_PATTERN" "$p" 2>/dev/null; then
      flagged+=("$p (khớp pattern secret)")
    fi
  done <<< "$paths"
fi

if printf '%s' "$command_str" | grep -qE '\bgit[[:space:]]+commit\b'; then
  staged_diff="$(git diff --cached 2>/dev/null)" || true
  if [ -n "$staged_diff" ] && printf '%s' "$staged_diff" | grep -E '^\+' | grep -qE "$SECRET_PATTERN"; then
    flagged+=("staged changes (khớp pattern secret)")
  fi
fi

[ "${#flagged[@]}" -eq 0 ] && exit 0

reason="Phát hiện nội dung giống secret/credential: $(printf '%s; ' "${flagged[@]}"). Xác nhận lại với người dùng trước khi tiếp tục (rules/backend.md)."
jq -n --arg reason "$reason" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "ask",
    permissionDecisionReason: $reason
  }
}'
exit 0
