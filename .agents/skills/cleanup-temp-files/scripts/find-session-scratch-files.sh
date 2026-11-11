#!/usr/bin/env bash
# Liệt kê file đã Write trong một session cụ thể, dựa vào .agents/storage/logs/logs-YYYYMMDD.jsonl
# (ghi bởi hook audit-log) — CHỈ trong phạm vi dự án hiện tại (cwd ghi trong
# log phải khớp cwd lúc chạy script này), còn tồn trên đĩa, và khớp pattern
# "có vẻ là file tạm/scratch". Không quét gì ngoài project, không xóa gì.
#
# Used by skill cleanup-temp-files (suggests candidates) and hook remind-cleanup
# (end-of-session reminder). Lists only — Claude/the user still decides
# whether it is junk or a deliverable.
#
# Usage: bash find-session-scratch-files.sh <session_id>
# Output: one path per line (may be empty if nothing is found).

set -o pipefail
trap 'exit 0' ERR

session_id="${1:-}"
[ -z "$session_id" ] && exit 0

command -v jq >/dev/null 2>&1 || exit 0

# Đọc mọi file log theo ngày còn trong cửa sổ giữ để session vắt qua nửa đêm không che ứng viên.
# Helper nằm ở hooks/scripts (skills/ và hooks/ cùng cấp) và lọc trước theo session bằng grep.
# jq bên dưới vẫn lọc chính xác.
storage_helper="$(dirname "$0")/../../../hooks/scripts/_hook-storage.sh"
[ -f "$storage_helper" ] || exit 0
. "$storage_helper"
log_dir="$(lumina_project_root)/.agents/storage/logs"
[ -n "$(lumina_log_files "$log_dir")" ] || exit 0
read_session_lines() { lumina_session_log_lines "$log_dir" "$session_id"; }

project_dir="$(pwd)"

# "Looks temporary" pattern: file name starts with tmp/scratch/debug/draft/sandbox/
# test-output, or extension .tmp/.bak/.orig. Name-based only, so it can still match
# real files — hence the config/docs dirs are excluded below.
scratch_pattern='(^|/)(tmp|scratch|debug|draft|sandbox|test[_-]?output)[^/]*\.[A-Za-z0-9]+$|\.(tmp|bak|orig)$'
# Project config/docs dirs (relative to project_dir), e.g.
# .agents/rules/debug.md is an official rule, not a temp file.
excluded_pattern='^(\.agents/(rules|skills|agents)|\.claude|\.codex|docs)/'

candidates="$(read_session_lines \
  | jq -r --arg sid "$session_id" --arg cwd "$project_dir" '
  select(.session_id == $sid and .tool == "Write" and .cwd == $cwd)
  | .input.file_path // empty
' 2>/dev/null)" || true

[ -z "$candidates" ] && exit 0

printf '%s\n' "$candidates" | sort -u | while IFS= read -r path; do
  [ -z "$path" ] && continue
  [ -f "$path" ] || continue
  relative_path="${path#"$project_dir"/}"
  printf '%s' "$relative_path" | grep -qE "$excluded_pattern" && continue
  printf '%s' "$path" | grep -qE "$scratch_pattern" && printf '%s\n' "$path"
done

exit 0
