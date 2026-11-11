#!/usr/bin/env bash
# SessionStart hook: cảnh báo khi thiếu `jq` hoặc `node` trong PATH — phần lớn
# hook guard (cần jq) và các hook .mjs (cần node) sẽ lặng lẽ không chạy.
#
# Đủ cả hai thì im lặng. Không dùng jq để dựng JSON vì chính jq có thể thiếu.
#
# Best-effort: luôn exit 0, không chặn phiên.

# ! Bỏ qua nếu project đã có cùng hook (tránh chạy 2 lần với bản user-level).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

cat >/dev/null 2>&1 || true

missing=""
command -v jq >/dev/null 2>&1 || missing="jq"
command -v node >/dev/null 2>&1 || missing="${missing:+$missing, }node"
[ -z "$missing" ] && exit 0

printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"Thiếu %s trong PATH: các hook guard của repo (chặn secret/branch/commit message/ghi ngoài phạm vi...) không chạy và sẽ cho qua mọi lệnh. Cài thiếu rồi mở lại phiên."}}\n' "$missing"
exit 0
