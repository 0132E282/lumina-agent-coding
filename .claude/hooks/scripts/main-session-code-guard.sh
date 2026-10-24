#!/usr/bin/env bash
# PreToolUse hook (Edit|Write): hỏi (ask) khi phiên chính tự sửa file code —
# CONTRACT #3: code triển khai giao cho `coder`, phiên chính chỉ sửa config/docs.
#
# Nhận JSON input từ stdin theo schema PreToolUse:
#   { "tool_name": "Edit", "tool_input": { "file_path": "..." }, "cwd": "...", "agent_id": "..." }
#
# Claude Code chỉ gửi `agent_id` khi tool chạy trong subagent (xem audit-log.sh);
# phiên chính không có field này. Subagent luôn được cho qua.
# Dùng "ask" (không "deny"): người dùng có thể chủ động bảo phiên chính sửa thẳng.
# Config/docs (md/json/toml/yml/yaml và .agents/ .claude/ .codex/ docs/ .github/)
# và file ngoài project không bị hỏi.
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

agent_id="$(printf '%s' "$input" | jq -r '.agent_id // ""' 2>/dev/null)"
[ -z "$agent_id" ] || exit 0

file_path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // ""' 2>/dev/null)"
[ -z "$file_path" ] && exit 0

. "$(dirname "$0")/_resolve-path.sh"

project_dir="${CLAUDE_PROJECT_DIR:-}"
[ -n "$project_dir" ] || project_dir="$(printf '%s' "$input" | jq -r '.cwd // ""' 2>/dev/null)"
[ -d "$project_dir" ] || project_dir="$PWD"
project_dir="$(cd "$project_dir" && pwd -P)"
resolved="$(resolve_path "$file_path" "$project_dir")" || exit 0

case "$resolved" in
  "$project_dir"/*) relative="${resolved#"$project_dir"/}" ;;
  *) exit 0 ;;
esac

case "$relative" in
  .agents/*|.claude/*|.codex/*|docs/*|.github/*) exit 0 ;;
  *.md|*.json|*.toml|*.yml|*.yaml) exit 0 ;;
esac

jq -n --arg reason "Phiên chính đang sửa file code '$relative'. CONTRACT #3: giao việc này cho coder (Agent), trừ khi người dùng muốn phiên chính sửa trực tiếp." '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "ask",
    permissionDecisionReason: $reason
  }
}'
exit 0
