#!/usr/bin/env bash
# PreToolUse hook: trước khi `git push`, chạy Prettier MỘT LẦN trên các file đã thay đổi so với remote tracking
# branch — liên hệ skill git-workflow (mục "Trước khi git push") và
# rules/delivery.md (format thống nhất trước khi đẩy lên,
# không tranh cãi khoảng trắng khi review PR).
#
# Nhận JSON input từ stdin theo schema PreToolUse:
#   { "tool_name": "Bash", "tool_input": { "command": "..." }, ... }
#
# CHỈ chạy `prettier --write` trên đúng các file nằm trong diff so với
# upstream — không tự commit thay đổi đó. Nếu format sinh ra thay đổi,
# dùng permissionDecision "ask" để cảnh báo trước khi push: push hiện tại
# vẫn đẩy đúng commit cũ (chưa gồm phần vừa format), người dùng tự quyết
# commit thêm rồi push lại hay bỏ qua.
#
# Best-effort: thiếu jq/git, không phải lệnh git push, không có remote
# tracking branch, thiếu `prettier`, hoặc không có file nào trong diff cần
# format -> không chặn, không cảnh báo gì.

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0
command -v git >/dev/null 2>&1 || exit 0

input="$(cat)"

tool_name="$(printf '%s' "$input" | jq -r '.tool_name // ""' 2>/dev/null)"
[ "$tool_name" = "Bash" ] || exit 0

command_str="$(printf '%s' "$input" | jq -r '.tool_input.command // ""' 2>/dev/null)"
[ -z "$command_str" ] && exit 0

printf '%s' "$command_str" | grep -qE '(^|[;&|]|[[:space:]])git[[:space:]]+push([[:space:]]|$)' || exit 0

project_root="$(git rev-parse --show-toplevel 2>/dev/null)"
[ -n "$project_root" ] || exit 0
cd "$project_root" || exit 0
prettier_bin="$project_root/node_modules/.bin/prettier"
[ -x "$prettier_bin" ] || exit 0

upstream="$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null)"
[ -z "$upstream" ] && exit 0

formatted=()
while IFS= read -r -d '' f; do
  [ -f "$f" ] || continue
  before_hash="$(git hash-object "$f" 2>/dev/null)"
  "$prettier_bin" --write --ignore-unknown "$f" >/dev/null 2>&1 || true
  after_hash="$(git hash-object "$f" 2>/dev/null)"
  if [ "$before_hash" != "$after_hash" ]; then
    formatted+=("$f")
  fi
done < <(git diff --name-only -z --diff-filter=ACMR "$upstream" -- 2>/dev/null)

[ "${#formatted[@]}" -eq 0 ] && exit 0

reason="Đã chạy Prettier format lại ${#formatted[@]} file (so với remote): $(printf '%s, ' "${formatted[@]}")Các file này CHƯA được commit — push hiện tại vẫn đẩy bản chưa format. Commit lại trước khi push nếu muốn đẩy bản đã format, hoặc bỏ qua nếu chấp nhận push bản hiện tại."
jq -n --arg reason "$reason" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "ask",
    permissionDecisionReason: $reason
  }
}'
exit 0
