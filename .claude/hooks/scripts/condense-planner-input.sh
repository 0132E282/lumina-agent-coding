#!/usr/bin/env bash
# PreToolUse hook: LƯỚI AN TOÀN CUỐI (safety net) chặn trường hợp
# tool_input.prompt gọi Agent "planner-agent" lọt lưới, dài bất thường — KHÔNG
# phải cơ chế rút gọn context chính. Việc chọn giữ phần nào/bỏ phần nào cần
# hiểu ngữ nghĩa (system-design-agent nói gì, phần nào planner-agent thật sự cần) —
# bash không làm được, nên trách nhiệm đó thuộc về bước gọi `planner-agent`
# (session điều phối đã đọc toàn văn tài liệu, tự chọn lọc phần liên quan
# trước khi đưa vào prompt — xem skills/workflow-plan/SKILL.md). Hook này chỉ cắt cơ học
# khi prompt vượt ngưỡng rất lớn, phòng trường hợp dán nhầm nguyên văn tài
# liệu dài mà quên chọn lọc.
#
# Nhận JSON input từ stdin theo schema PreToolUse:
#   { "tool_name": "Agent", "tool_input": { "subagent_type": "planner-agent", "prompt": "..." }, ... }
#
# Sửa tool_input qua hookSpecificOutput.updatedInput — field này cho phép
# PreToolUse hook thay nội dung trước khi tool thực sự chạy.
#
# Quy tắc cắt (chỉ áp dụng khi vượt ngưỡng rất lớn): giữ phần đầu (thường
# chứa mục tiêu/REQ) và phần cuối (thường chứa kết luận/rủi ro), cắt bỏ phần
# giữa, chèn dòng đánh dấu — không gọi LLM tóm tắt, chỉ cắt theo độ dài.
#
# Best-effort: thiếu jq, không phải tool Agent, không phải subagent_type
# "planner-agent", hoặc prompt chưa vượt ngưỡng -> không sửa gì (không có
# hookSpecificOutput trong output).

# ! Bỏ qua nếu project đã có cùng hook (tránh chạy 2 lần với bản user-level).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

MAX_CHARS=20000
HEAD_CHARS=13000
TAIL_CHARS=6000

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

tool_name="$(printf '%s' "$input" | jq -r '.tool_name // ""' 2>/dev/null)"
[ "$tool_name" = "Agent" ] || exit 0

subagent_type="$(printf '%s' "$input" | jq -r '.tool_input.subagent_type // ""' 2>/dev/null)"
[ "$subagent_type" = "planner-agent" ] || exit 0

prompt="$(printf '%s' "$input" | jq -r '.tool_input.prompt // ""' 2>/dev/null)"
[ -z "$prompt" ] && exit 0

prompt_length=${#prompt}
[ "$prompt_length" -le "$MAX_CHARS" ] && exit 0

head_part="${prompt:0:$HEAD_CHARS}"
tail_part="${prompt: -$TAIL_CHARS}"
marker="

[...đã rút gọn ${prompt_length} ký tự xuống còn phần đầu+cuối do vượt ngưỡng ${MAX_CHARS} — nếu cần chi tiết phần bị cắt, đọc lại tài liệu gốc...]

"
condensed="${head_part}${marker}${tail_part}"

# updatedInput thay toàn bộ tool_input (không chỉ merge field "prompt") —
# phải giữ lại nguyên các field khác (subagent_type, description...), chỉ
# đổi "prompt", để không làm hỏng lời gọi Agent tool.
printf '%s' "$input" | jq --arg prompt "$condensed" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    updatedInput: (.tool_input | .prompt = $prompt)
  }
}'
exit 0
