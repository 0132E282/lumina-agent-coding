#!/usr/bin/env bash
# PostToolUse hook (matcher Skill): khi skill `report` được gọi, đo token + issue lãng phí
# từ transcript và đưa vào additionalContext để báo cáo thay đổi ghi đúng số thật.
#
# Nhận JSON input từ stdin theo schema PostToolUse:
#   { "session_id": "...", "transcript_path": "...", "tool_name": "Skill", "tool_input": {"skill": "report"} }
#
# Best-effort: thiếu jq/node/script/transcript/usage thì im lặng, không in N/A, không ước lượng.
# Luôn exit 0 — không bao giờ chặn tool call.

# ! Bỏ qua nếu project đã có cùng hook (tránh chạy 2 lần với bản user-level).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0
command -v node >/dev/null 2>&1 || exit 0

input="$(cat)"

[ "$(printf '%s' "$input" | jq -r '.tool_name // ""' 2>/dev/null)" = "Skill" ] || exit 0
skill_name="$(printf '%s' "$input" | jq -r '.tool_input.skill // ""' 2>/dev/null)"
case "$skill_name" in
  report|*:report) ;;
  *) exit 0 ;;
esac

session_id="$(printf '%s' "$input" | jq -r '.session_id // ""' 2>/dev/null)"
transcript_path="$(printf '%s' "$input" | jq -r '.transcript_path // ""' 2>/dev/null)"
[ -z "$session_id" ] && exit 0
[ -f "$transcript_path" ] || exit 0

if [ -n "$CLAUDE_PROJECT_DIR" ] && [ -d "$CLAUDE_PROJECT_DIR" ]; then
  log_root="$CLAUDE_PROJECT_DIR"
else
  log_root="$(pwd)"
fi

usage_script="$log_root/.agents/skills/report/scripts/task-usage.mjs"
if [ ! -f "$usage_script" ]; then
  usage_script="$(cd "$(dirname "$0")/../../skills/report/scripts" 2>/dev/null && pwd)/task-usage.mjs"
fi
[ -f "$usage_script" ] || exit 0

marker_file="$log_root/.agents/storage/state/$session_id.json"
since_line="$(jq -r '.lastLine // 0' "$marker_file" 2>/dev/null || true)"
window_label="từ mốc trước"
if [ -z "$since_line" ] || [ "$since_line" = "0" ]; then
  since_line=0
  window_label="cả phiên"
fi

usage_json="$(node "$usage_script" --transcript "$transcript_path" --since-line "$since_line" 2>/dev/null || true)"
[ -z "$usage_json" ] && exit 0

measured_messages="$(printf '%s' "$usage_json" | jq -r '.usage.messages // 0' 2>/dev/null || true)"
[ "${measured_messages:-0}" -gt 0 ] 2>/dev/null || exit 0

compact_module="$(cd "$(dirname "$0")" 2>/dev/null && pwd)/compact-number.mjs"
[ -f "$compact_module" ] || exit 0
compact_json="$(printf '%s' "$usage_json" | node "$compact_module" 2>/dev/null || true)"
[ -z "$compact_json" ] && exit 0

usage_text="$(printf '%s' "$usage_json" | jq -r --arg label "$window_label" --argjson compact "$compact_json" '
  "📈 Token: input \($compact.input) | output \($compact.output) | cache đọc \($compact.cacheRead) | cache tạo \($compact.cacheCreate) | tổng \($compact.total) (\($label)).",
  (if (.waste | length) > 0 then
    "Issue lãng phí: \(.waste | length) — " + (.waste | map("\(.rule): \(.evidence) (×\(.count))") | join("; "))
  else empty end),
  "Khi báo cáo thêm dòng Token: theo template change (và dòng Issue lãng phí: chỉ khi hook liệt kê vi phạm). Chép nguyên các số rút gọn (k/M) và nhãn phạm vi trên, không dùng số cũ hay tự tính; số liệu tính đến lúc gọi skill, chưa gồm các message của lượt hiện tại."
' 2>/dev/null || true)"
[ -z "$usage_text" ] && exit 0

jq -n --arg msg "$usage_text" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: $msg
  }
}' || exit 0

# * Lưu số đã phát ra để hook Stop report-usage-check.sh đối chiếu dòng Token trong báo cáo.
emitted_file="$log_root/.agents/storage/state/$session_id.emitted.json"
mkdir -p "$(dirname "$emitted_file")" && printf '%s' "$usage_json" | jq -c --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  '{input: .usage.input, output: .usage.output, cacheRead: .usage.cacheRead, cacheCreate: .usage.cacheCreate, total: (.usage.input + .usage.output + .usage.cacheRead + .usage.cacheCreate), ts: $ts}' > "$emitted_file" || true

# * Chỉ dời mốc sau khi đã phát ra số liệu, để lần báo cáo kế tiếp đo từ đây.
mkdir -p "$(dirname "$marker_file")" && printf '%s' "$usage_json" | jq -c '{lastLine}' > "$marker_file" || true
exit 0
