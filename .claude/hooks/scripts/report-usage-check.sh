#!/usr/bin/env bash
# Stop hook: đối chiếu dòng `Token:` trong báo cáo cuối với số report-usage.sh đã chèn
# (khoá `emitted` trong .agents/storage/state/state-YYYYMMDD.json). Lệch thì nhắc sửa qua additionalContext,
# KHÔNG dùng decision/reason (sẽ chặn Stop). Mỗi kiểu lệch chỉ nhắc một lần.
#
# Reads JSON input from stdin per the Stop schema:
#   { "session_id": "...", "transcript_path": "...", "stop_hook_active": false, "last_assistant_message": "..." }
#
# Best-effort: missing node/parse error -> silent. Always exit 0 -- never blocks.

# ! Skip if the project already has the same hook (avoid running twice with the user-level copy).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v node >/dev/null 2>&1 || exit 0

helper="$(cd "$(dirname "$0")" 2>/dev/null && pwd)/report-usage-check.mjs"
[ -f "$helper" ] || exit 0

. "$(dirname "$0")/_hook-storage.sh"
node "$helper" "$(lumina_project_root)" 2>/dev/null || true
exit 0
