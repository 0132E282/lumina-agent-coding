#!/usr/bin/env bash
# Stop hook: đối chiếu dòng `Token:` trong báo cáo cuối với số report-usage.sh đã chèn
# (.agents/storage/state/<session_id>.emitted.json). Lệch thì nhắc sửa qua additionalContext,
# KHÔNG dùng decision/reason (sẽ chặn Stop). Mỗi kiểu lệch chỉ nhắc một lần.
#
# Nhận JSON input từ stdin theo schema Stop:
#   { "session_id": "...", "transcript_path": "...", "stop_hook_active": false, "last_assistant_message": "..." }
#
# Best-effort: thiếu node/parse lỗi thì im lặng. Luôn exit 0 — không bao giờ chặn.

# ! Bỏ qua nếu project đã có cùng hook (tránh chạy 2 lần với bản user-level).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v node >/dev/null 2>&1 || exit 0

helper="$(cd "$(dirname "$0")" 2>/dev/null && pwd)/report-usage-check.mjs"
[ -f "$helper" ] || exit 0

if [ -n "$CLAUDE_PROJECT_DIR" ] && [ -d "$CLAUDE_PROJECT_DIR" ]; then
  log_root="$CLAUDE_PROJECT_DIR"
else
  log_root="$(pwd)"
fi

node "$helper" "$log_root" 2>/dev/null || true
exit 0
