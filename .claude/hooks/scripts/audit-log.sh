#!/usr/bin/env bash
# PreToolUse hook: ghi audit trail cho MỌI tool call của Claude Code/subagent
# — ai/khi nào/làm gì, phục vụ truy vết theo rules/backend.md.
#
# Nhận JSON input từ stdin theo schema PreToolUse:
#   { "session_id": "...", "tool_name": "...", "tool_input": {...}, "cwd": "..." }
#
# Luôn exit 0 — hook phụ trợ, không được chặn tool call nếu ghi log lỗi.
# Cố ý KHÔNG dùng `set -e`/`set -u`, có `trap ERR` làm lưới an toàn cuối —
# audit log là best-effort, không đánh đổi bằng việc làm gián đoạn agent.

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

tool_name_check="$(printf '%s' "$input" | jq -r '.tool_name // ""' 2>/dev/null)"
[ -z "$tool_name_check" ] && exit 0

if [ -n "$CLAUDE_PROJECT_DIR" ] && [ -d "$CLAUDE_PROJECT_DIR" ]; then
  project_dir="$CLAUDE_PROJECT_DIR"
else
  project_dir="$(printf '%s' "$input" | jq -r '.cwd // ""' 2>/dev/null)"
  [ -n "$project_dir" ] && [ -d "$project_dir" ] || project_dir="$(pwd)"
fi

log_dir="$project_dir/.agents/storage/logs"
log_file="$log_dir/logs.jsonl"
mkdir -p "$log_dir" 2>/dev/null || exit 0

timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
session_id="$(printf '%s' "$input" | jq -r '.session_id // "unknown"' 2>/dev/null)"
tool_name="$tool_name_check"
cwd="$(printf '%s' "$input" | jq -r '.cwd // ""' 2>/dev/null)"

# Tóm tắt tool_input theo loại tool — KHÔNG ghi nguyên nội dung file (Write/Edit)
# vào log để tránh log phình to và rò rỉ nội dung nhạy cảm.
summary="$(printf '%s' "$input" | jq -c '
  .tool_input as $i
  | if ($i.file_path // "") != "" then {file_path: $i.file_path}
    elif ($i.command // "") != "" then {command: ($i.command | .[0:200])}
    elif ($i.pattern // "") != "" then {pattern: $i.pattern}
    elif ($i.skill // "") != "" then {skill: $i.skill}
    else {}
    end
' 2>/dev/null)"
[ -z "$summary" ] && summary='{}'

entry="$(jq -nc \
  --arg ts "$timestamp" \
  --arg session "$session_id" \
  --arg tool "$tool_name" \
  --arg cwd "$cwd" \
  --argjson input "$summary" \
  '{ts: $ts, session_id: $session, tool: $tool, cwd: $cwd, input: $input}' 2>/dev/null)"

[ -n "$entry" ] && printf '%s\n' "$entry" >> "$log_file" 2>/dev/null

exit 0
