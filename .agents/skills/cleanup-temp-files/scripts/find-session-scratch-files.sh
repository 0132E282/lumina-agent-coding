#!/usr/bin/env bash
# Lists files Written in a given session, based on .agents/storage/logs/logs.jsonl
# and the latest rotated file (written by the audit-log hook) — ONLY within the current project (cwd in the
# log must match cwd when running this script), still on disk, and matching the
# "looks like temp/scratch" pattern. Scans nothing outside the project, deletes nothing.
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

if [ -n "$CLAUDE_PROJECT_DIR" ] && [ -d "$CLAUDE_PROJECT_DIR" ]; then
  log_root="$CLAUDE_PROJECT_DIR"
else
  log_root="$(pwd)"
fi
log_dir="$log_root/.agents/storage/logs"
command -v jq >/dev/null 2>&1 || exit 0

# Read the active file + the latest rotated file so a rotation mid-session does not hide candidates.
# The helper lives in hooks/scripts (skills/ and hooks/ are siblings) and pre-filters by session with grep;
# without the helper only the active file is read. jq below still filters exactly.
log_rotate_helper="$(dirname "$0")/../../../hooks/scripts/_log-rotate.sh"
if [ -f "$log_rotate_helper" ]; then
  . "$log_rotate_helper"
  # Check the active file first (usually present) to avoid listing the directory.
  [ -f "$log_dir/logs.jsonl" ] || [ -n "$(lumina_rotated_logs "$log_dir")" ] || exit 0
  read_session_lines() { lumina_session_log_lines "$log_dir" "$session_id"; }
elif [ -f "$log_dir/logs.jsonl" ]; then
  # Pre-filter by session like the helper so a broken JSON line from another session does not make jq fail.
  session_needle="$(jq -cn --arg sid "$session_id" '{session_id: $sid}')"
  session_needle="${session_needle#\{}"
  session_needle="${session_needle%\}}"
  read_session_lines() { grep -F -- "$session_needle" "$log_dir/logs.jsonl" || true; }
else
  exit 0
fi

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
