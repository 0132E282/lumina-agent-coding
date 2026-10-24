#!/usr/bin/env bash
# PreToolUse hook (Write|Edit): chặn (deny) ghi file secret và ghi plan/config
# agent ra ngoài project — enforce CONTRACT #6 và rules/docs.md (plan chỉ lưu
# ở docs/plans/).
#
# Nhận JSON input từ stdin theo schema PreToolUse:
#   { "tool_name": "Write", "tool_input": { "file_path": "...", "content": "..." }, "cwd": "..." }
#
# deny vì đây là ràng buộc cứng, không phải heuristic cần người dùng cân nhắc.
# Thông báo chỉ nêu lý do/đường dẫn, không in nội dung ghi.
# Chỉ chặn ghi ngoài project khi khớp */.claude/plans/*, */.codex/*,
# */.gemini/* hoặc */plans/*; memory, backup, scratchpad, evidence vẫn được ghi.
#
# Best-effort: thiếu jq, hoặc không chuẩn hoá được path -> không chặn.

# ! Bỏ qua nếu project đã có cùng hook (tránh chạy 2 lần với bản user-level).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

tool_name="$(printf '%s' "$input" | jq -r '.tool_name // ""' 2>/dev/null)"
case "$tool_name" in Write|Edit) ;; *) exit 0 ;; esac

file_path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // ""' 2>/dev/null)"
[ -z "$file_path" ] && exit 0

. "$(dirname "$0")/_resolve-path.sh"

project_dir="${CLAUDE_PROJECT_DIR:-}"
[ -n "$project_dir" ] || project_dir="$(printf '%s' "$input" | jq -r '.cwd // ""' 2>/dev/null)"
[ -d "$project_dir" ] || project_dir="$PWD"
project_dir="$(cd "$project_dir" && pwd -P)"
resolved="$(resolve_path "$file_path" "$project_dir")" || exit 0

deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

case "$(basename "$resolved")" in
  .env.example|.env.sample|.env.template|.env.dist) ;;
  .env|.env.*) deny "Không ghi file secret '$(basename "$resolved")' bằng Write/Edit (CONTRACT #6); người dùng tự tạo/sửa file .env." ;;
esac

# Chỉ xét phần ghi mới: `content` (Write) hoặc `new_string` (Edit).
written_text="$(printf '%s' "$input" | jq -r '[.tool_input.content, .tool_input.new_string] | map(select(type == "string")) | join("\n")' 2>/dev/null)"
if printf '%s' "$written_text" | grep -qE -- '-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----'; then
  deny "Nội dung ghi chứa private key (CONTRACT #6); không ghi key vào file bằng Write/Edit."
fi

# Trong project luôn cho qua; chỉ còn xét đường dẫn ngoài project.
case "$resolved" in
  "$project_dir"|"$project_dir"/*) exit 0 ;;
esac
case "$resolved" in
  */.claude/plans/*|*/.codex/*|*/.gemini/*|*/plans/*)
    deny "Plan/config agent chỉ lưu trong repo tại docs/plans/, không ghi ra '$resolved' (rules/docs.md)."
    ;;
esac
exit 0
