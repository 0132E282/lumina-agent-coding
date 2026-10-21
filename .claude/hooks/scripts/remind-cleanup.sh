#!/usr/bin/env bash
# Stop hook: khi context window của phiên đã dùng >= 80% (đo qua
# remind-cleanup-context.mjs), nhắc dọn file tạm/scratch nếu phát hiện file có
# vẻ là rác đã được Write trong session này, giới hạn đúng phạm vi dự án hiện
# tại — liên hệ skill cleanup-temp-files. CHỈ nhắc qua additionalContext, KHÔNG tự xóa
# gì và KHÔNG dùng decision/reason (những field đó sẽ chặn Claude dừng lại).
#
# Nhận JSON input từ stdin theo schema Stop: { "session_id": "...", "transcript_path": "...", ... }
#
# Mỗi file chỉ nhắc một lần mỗi session: path đã nhắc lưu tại
# .agents/storage/state/<session_id>.cleanup-reminded (một path mỗi dòng).
#
# Luôn exit 0 — hook phụ trợ, không bao giờ chặn việc Claude Code dừng lại.

# ! Bỏ qua nếu project đã có cùng hook (tránh chạy 2 lần với bản user-level).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0
command -v node >/dev/null 2>&1 || exit 0

input="$(cat)"

session_id="$(printf '%s' "$input" | jq -r '.session_id // ""' 2>/dev/null)"
[ -z "$session_id" ] && exit 0

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
context_helper="$script_dir/remind-cleanup-context.mjs"
[ -f "$context_helper" ] || exit 0

context_usage="$(printf '%s' "$input" | node "$context_helper" 2>/dev/null)" || true
[ -z "$context_usage" ] && exit 0

finder="$script_dir/../../skills/cleanup-temp-files/scripts/find-session-scratch-files.sh"
[ -f "$finder" ] || exit 0

found="$(bash "$finder" "$session_id" 2>/dev/null)" || true
[ -z "$found" ] && exit 0

if [ -n "$CLAUDE_PROJECT_DIR" ] && [ -d "$CLAUDE_PROJECT_DIR" ]; then
  log_root="$CLAUDE_PROJECT_DIR"
else
  log_root="$(pwd)"
fi
state_directory="$log_root/.agents/storage/state"
reminded_file="$state_directory/$session_id.cleanup-reminded"

# File rỗng bị bỏ qua: grep BSD coi `-f <file rỗng>` là khớp mọi dòng.
if [ -s "$reminded_file" ]; then
  found="$(printf '%s\n' "$found" | grep -vxF -f "$reminded_file" || true)"
fi
[ -z "$found" ] && exit 0

count="$(printf '%s\n' "$found" | grep -c . || true)"
preview="$(printf '%s\n' "$found" | head -5 | tr '\n' ' ')"

jq -n --arg msg "🧹 Context đã dùng ${context_usage}. Phát hiện ${count} file có vẻ là file tạm được tạo trong session này: ${preview}— chạy skill cleanup-temp-files nếu không cần giữ lại." '{
  hookSpecificOutput: {
    hookEventName: "Stop",
    additionalContext: $msg
  }
}'

# Best-effort: ghi state lỗi thì lần sau nhắc lại, không chặn Stop.
{ mkdir -p "$state_directory" && printf '%s\n' "$found" >> "$reminded_file"; } 2>/dev/null || true
exit 0
