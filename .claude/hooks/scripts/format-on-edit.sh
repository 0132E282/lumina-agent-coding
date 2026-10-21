#!/usr/bin/env bash
# PostToolUse hook: tự động format lại file bằng Prettier ngay sau khi subagent/Claude Code vừa Edit hoặc Write xong.
#
# Nhận JSON input từ stdin theo schema của Claude Code hook (PostToolUse):
#   { "tool_name": "Edit", "tool_input": { "file_path": "..." }, ... }
#
# Luôn exit 0 — đây là hook phụ trợ (best-effort), không được phép chặn
# (block) hành động của agent nếu format lỗi hoặc thiếu `prettier`.
#
# Cố ý KHÔNG dùng `set -e`: bất kỳ lệnh nào trong script lỗi bất ngờ
# (jq thiếu, Prettier crash, v.v.) cũng không được làm gián đoạn agent —
# script phải luôn chạy tới dòng `exit 0` cuối cùng. `trap ERR` là lưới an
# toàn cuối, phòng khi có lỗi lọt qua các điểm xử lý ở trên.

# ! Bỏ qua nếu project đã có cùng hook (tránh chạy 2 lần với bản user-level).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

input="$(cat)"

file_path="$(echo "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"

[ -z "$file_path" ] && exit 0
[ -f "$file_path" ] || exit 0

case "$file_path" in
  *.js|*.jsx|*.mjs|*.cjs|*.ts|*.tsx|*.json|*.jsonc|*.css|*.scss|*.less|*.html|*.vue|*.md|*.mdx|*.yaml|*.yml|*.graphql)
    ;;
  *)
    # Loại file Prettier không hỗ trợ -> bỏ qua, không phải lỗi.
    exit 0
    ;;
esac

project_root="$(git -C "$(dirname "$file_path")" rev-parse --show-toplevel 2>/dev/null)"
[ -n "$project_root" ] || exit 0
prettier_bin="$project_root/node_modules/.bin/prettier"
[ -x "$prettier_bin" ] || exit 0
cd "$project_root" || exit 0
"$prettier_bin" --write --ignore-unknown "$file_path" >/dev/null 2>&1 || true
exit 0
