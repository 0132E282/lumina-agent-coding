#!/usr/bin/env bash
# Stop hook: nhắc dọn file tạm/scratch nếu phát hiện file có vẻ là rác đã
# được Write trong session này, giới hạn đúng phạm vi dự án hiện tại — liên
# hệ skill cleanup-temp-files. CHỈ nhắc qua additionalContext, KHÔNG tự xóa
# gì và KHÔNG dùng decision/reason (những field đó sẽ chặn Claude dừng lại).
#
# Nhận JSON input từ stdin theo schema Stop: { "session_id": "...", ... }
#
# Luôn exit 0 — hook phụ trợ, không bao giờ chặn việc Claude Code dừng lại.

# ! Bỏ qua nếu project đã có cùng hook (tránh chạy 2 lần với bản user-level).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

session_id="$(printf '%s' "$input" | jq -r '.session_id // ""' 2>/dev/null)"
[ -z "$session_id" ] && exit 0

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
finder="$script_dir/../../skills/cleanup-temp-files/scripts/find-session-scratch-files.sh"
[ -f "$finder" ] || exit 0

found="$(bash "$finder" "$session_id" 2>/dev/null)" || true
[ -z "$found" ] && exit 0

count="$(printf '%s\n' "$found" | grep -c . || true)"
preview="$(printf '%s\n' "$found" | head -5 | tr '\n' ' ')"

jq -n --arg msg "🧹 Phát hiện ${count} file có vẻ là file tạm được tạo trong session này: ${preview}— chạy /cleanup nếu không cần giữ lại." '{
  hookSpecificOutput: {
    hookEventName: "Stop",
    additionalContext: $msg
  }
}'
exit 0
