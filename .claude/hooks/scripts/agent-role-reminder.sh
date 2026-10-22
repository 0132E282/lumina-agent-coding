#!/usr/bin/env bash
# PreToolUse hook: mọi lần gọi Agent tool đều báo rõ tên agent đang được
# dùng (permissionDecision "allow" kèm reason — không chặn). Riêng vai trò
# "nặng" (analyst, planner, architect,
# reviewer, qa-tester, researcher) kèm prompt quá ngắn thì
# đổi sang "ask" (hỏi xác nhận) — tín hiệu cơ học cho khả năng đang
# over-delegate một task nhỏ, trái Execution discipline (AGENTS.md/CLAUDE.md):
# task nhỏ/rõ nên giao thẳng coder, không mặc định chạy đủ chuỗi
# planner/reviewer/tester.
#
# Phần "ask" CHỈ là lưới an toàn cơ học (độ dài prompt), không hiểu ngữ nghĩa
# task — có task nhỏ về chữ nhưng thật sự cần vai trò đó (ví dụ review 1 file
# rủi ro cao). Người điều phối (phiên chính) tự quyết tiếp tục hay đổi hướng.
#
# Nhận JSON input từ stdin theo schema PreToolUse:
#   { "tool_name": "Agent", "tool_input": { "subagent_type": "...", "prompt": "..." }, ... }
#
# Best-effort: thiếu jq hoặc không phải tool Agent -> không làm gì.

# ! Bỏ qua nếu project đã có cùng hook (tránh chạy 2 lần với bản user-level).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

MIN_PROMPT_CHARS=150
HEAVY_AGENTS_REGEX='^(analyst|planner|architect|reviewer|qa-tester|researcher)$'

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

tool_name="$(printf '%s' "$input" | jq -r '.tool_name // ""' 2>/dev/null)"
[ "$tool_name" = "Agent" ] || exit 0

subagent_type="$(printf '%s' "$input" | jq -r '.tool_input.subagent_type // "(không rõ)"' 2>/dev/null)"
prompt="$(printf '%s' "$input" | jq -r '.tool_input.prompt // ""' 2>/dev/null)"
prompt_length=${#prompt}

decision="allow"
reason="Đang giao task cho agent: ${subagent_type}."

if printf '%s' "$subagent_type" | grep -qE "$HEAVY_AGENTS_REGEX" && [ "$prompt_length" -lt "$MIN_PROMPT_CHARS" ]; then
  decision="ask"
  reason="Đang giao task cho agent: ${subagent_type} — prompt chỉ ${prompt_length} ký tự. Theo Execution discipline, task nhỏ/rõ nên giao thẳng coder thay vì qua vai trò này. Nếu task thật sự cần ${subagent_type} (độ phức tạp/rủi ro/yêu cầu còn mơ hồ), xác nhận để tiếp tục."
fi

jq -n --arg decision "$decision" --arg reason "$reason" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: $decision,
    permissionDecisionReason: $reason
  }
}'
exit 0
