#!/usr/bin/env bash
# PreToolUse hook: nhắc (advisory) khi `git commit` sửa bug (type
# Conventional Commit `fix`, hoặc message có `Fixes|Closes|Resolves #<số>`)
# mà danh sách file sẽ commit không có file test nào — liên hệ
# rules/bug-fix.md (regression test tái hiện lỗi trước khi sửa).
#
# Nhận JSON input từ stdin theo schema PreToolUse:
#   { "tool_name": "Bash", "tool_input": { "command": "..." }, "cwd": "..." }
#
# Chỉ trả additionalContext, không deny/ask. Không phải commit fix, không
# trích được message, thiếu jq/git hoặc không ở trong repo git -> im lặng.
# Luôn exit 0.

# ! Bỏ qua nếu project đã có cùng hook (tránh chạy 2 lần với bản user-level).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0
command -v git >/dev/null 2>&1 || exit 0

input="$(cat)"

tool_name="$(printf '%s' "$input" | jq -r '.tool_name // ""' 2>/dev/null)"
[ "$tool_name" = "Bash" ] || exit 0

command_str="$(printf '%s' "$input" | jq -r '.tool_input.command // ""' 2>/dev/null)"
[ -z "$command_str" ] && exit 0

. "$(dirname "$0")/_shell-command.sh"
invocation="$(git_invocations "$command_str" commit | grep -m1 '^known')" || exit 0
IFS=$'\037' read -r -a fields <<< "$invocation"
commit_arguments=("${fields[@]:2}")

working_dir="$(printf '%s' "$input" | jq -r '.cwd // ""' 2>/dev/null)"
[ -n "$working_dir" ] && [ -d "$working_dir" ] && cd "$working_dir"
base_directory="$PWD"

# Thư mục `cd`/`-C` tương đối tính từ cwd của lệnh; rỗng = cwd.
resolve_directory() {
  case "$1" in
    "") printf '%s' "$base_directory" ;;
    /*) printf '%s' "$1" ;;
    *) printf '%s/%s' "$base_directory" "$1" ;;
  esac
}

# Advisory: không vào được thư mục thì im lặng (cố ý, xem README).
cd "$(resolve_directory "${fields[1]}")" 2>/dev/null || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

# Message chỉ lấy từ đối số của chính lệnh `git commit`.
message="$(git_commit_message "${commit_arguments[@]}")" || exit 0
[ -z "$message" ] && exit 0

subject="$(printf '%s\n' "$message" | sed -E 's/^[[:space:]]+//' | grep -m1 -v '^$')" || true
if ! printf '%s' "$subject" | grep -qE '^fix(\([^)]*\))?!?:'; then
  printf '%s\n' "$message" | grep -qiE '\b(fixes|closes|resolves)[[:space:]]+#[0-9]+' || exit 0
fi

# File sẽ commit: staged + (commit -a/--all) tracked đã sửa + file mà `git add`
# trong cùng lệnh sẽ stage (PreToolUse chạy trước khi `git add` kịp stage).
# Pathspec (thư mục, glob) được git resolve thật, không đoán theo chuỗi.
files="$(git diff --cached --name-only 2>/dev/null)" || true

for raw_argument in "${commit_arguments[@]}"; do
  if [ "$raw_argument" = "--all" ] || [[ "$raw_argument" =~ ^-[A-Za-z]*a[A-Za-z]*$ ]]; then
    files="$files"$'\n'"$(git diff --name-only 2>/dev/null)" || true
    break
  fi
done

add_invocations="$(git_invocations "$command_str" add | grep '^known')" || true
while IFS= read -r add_invocation; do
  [ -z "$add_invocation" ] && continue
  IFS=$'\037' read -r -a add_fields <<< "$add_invocation"
  add_directory="$(resolve_directory "${add_fields[1]}")"
  pathspecs=()
  adds_everything=0
  for raw_argument in "${add_fields[@]:2}"; do
    argument="$(decode_shell_token "$raw_argument")"
    case "$argument" in
      -A|--all|-u|--update) adds_everything=1 ;;
      -*|$'\035'*) ;;
      *) pathspecs+=("$argument") ;;
    esac
  done
  if [ "$adds_everything" -eq 1 ]; then
    files="$files"$'\n'"$(git -C "$add_directory" ls-files --modified --others --exclude-standard 2>/dev/null)" || true
  fi
  if [ "${#pathspecs[@]}" -gt 0 ]; then
    files="$files"$'\n'"$(git -C "$add_directory" ls-files --modified --others --exclude-standard -- "${pathspecs[@]}" 2>/dev/null)" || true
  fi
done <<< "$add_invocations"

test_pattern='(^|/)(tests?|__tests__)/|\.test\.|\.spec\.|_test\.|(^|/)test_'
printf '%s\n' "$files" | grep -qE -- "$test_pattern" && exit 0

context="Commit fix không kèm file test nào. Theo rules/bug-fix.md, sửa bug cần regression test tái hiện và fail vì đúng lỗi trước khi sửa — thêm test vào commit này. Nếu không tự động hóa được, ghi rõ cách kiểm tra trước/sau khi sửa (bước tái hiện, expected vs actual) trong báo cáo."

jq -n --arg ctx "$context" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    additionalContext: $ctx
  }
}'
exit 0
