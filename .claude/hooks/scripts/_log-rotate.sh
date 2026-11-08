#!/usr/bin/env bash
# Rotate .agents/storage/logs/logs.jsonl, shared by the writers (audit-log, turn-log) and the reader.
# Not registered in settings.json. Two ways to use it:
#   . _log-rotate.sh                  # source, then call lumina_log_rotate <log_dir>
#   bash _log-rotate.sh <log_dir>     # run directly (turn-log.mjs calls it before appending)
#
# Env: LUMINA_LOG_MAX_BYTES (default 1 MiB), LUMINA_LOG_KEEP (keep N rotated files, default 5).
# Best-effort: never makes the writer fail; always exits 0 when run directly.

lumina_rotated_log_pattern='^logs-[0-9]{8}-[0-9]{6}(-[0-9]+)?\.jsonl$'

# Print rotated file names in <log_dir>, old -> new. Strip the suffix before sorting so the unsuffixed copy comes before `-1`;
# same-second suffixes compare numerically so `-10` comes after `-2`.
lumina_rotated_logs() {
  local log_dir="$1"
  [ -d "$log_dir" ] || return 0
  ls -1 "$log_dir" 2>/dev/null \
    | grep -E "$lumina_rotated_log_pattern" \
    | sed 's/\.jsonl$//' \
    | sort -t- -k2,2 -k3,3 -k4,4n \
    | sed 's/$/.jsonl/'
  return 0
}

# Print the file paths to read for a session: the newest rotated file (if any), then the active file (if any).
lumina_session_log_files() {
  local log_dir="$1" newest
  newest="$(lumina_rotated_logs "$log_dir" | tail -n 1)"
  [ -n "$newest" ] && [ -f "$log_dir/$newest" ] && printf '%s\n' "$log_dir/$newest"
  [ -f "$log_dir/logs.jsonl" ] && printf '%s\n' "$log_dir/logs.jsonl"
  return 0
}

# Print log lines that may belong to <session_id> from the newest rotated file + the active file; print nothing if no file exists.
# Only a cheap grep prefilter so the reader need not feed the whole log to jq; the reader still filters exactly with jq.
# Writers emit compact JSON (jq -c / JSON.stringify), so the string "session_id":"<id>" matches verbatim. Needs jq.
lumina_session_log_lines() {
  local log_dir="$1" session_id="$2" needle file
  local files=()
  while IFS= read -r file; do
    files+=("$file")
  done < <(lumina_session_log_files "$log_dir")
  [ "${#files[@]}" -gt 0 ] || return 0
  needle="$(jq -cn --arg sid "$session_id" '{session_id: $sid}')" || return 0
  needle="${needle#\{}"
  needle="${needle%\}}"
  # One grep for all files; -h drops file names from the output. No match (exit 1) is not an error.
  grep -hF -- "$needle" "${files[@]}" 2>/dev/null
  return 0
}

lumina_log_rotate() {
  local log_dir="$1"
  local log_file="$log_dir/logs.jsonl"
  local max_bytes="${LUMINA_LOG_MAX_BYTES:-1048576}"
  local keep="${LUMINA_LOG_KEEP:-5}"
  local size stamp target suffix rotated total remove_count

  [[ "$max_bytes" =~ ^[0-9]+$ ]] && [ "$max_bytes" -gt 0 ] || max_bytes=1048576
  [[ "$keep" =~ ^[0-9]+$ ]] || keep=5
  [ -f "$log_file" ] || return 0

  size="$(wc -c < "$log_file" 2>/dev/null | tr -d '[:space:]')"
  [[ "$size" =~ ^[0-9]+$ ]] && [ "$size" -ge "$max_bytes" ] || return 0

  stamp="$(date -u +%Y%m%d-%H%M%S)"
  target="$log_dir/logs-$stamp.jsonl"
  suffix=0
  while [ -e "$target" ]; do
    suffix=$((suffix + 1))
    target="$log_dir/logs-$stamp-$suffix.jsonl"
  done

  # mv within the same directory is an atomic rename; a writer that already opened the file keeps writing to the old inode (the rotated file), so no lines are lost.
  # -n: do not overwrite a rotated file another process picked with the same name. On failure (another process already rotated) skip.
  mv -n "$log_file" "$target" 2>/dev/null || return 0

  rotated="$(lumina_rotated_logs "$log_dir")"
  [ -z "$rotated" ] && return 0
  total="$(printf '%s\n' "$rotated" | grep -c .)"
  remove_count=$((total - keep))
  [ "$remove_count" -gt 0 ] || return 0
  printf '%s\n' "$rotated" | head -n "$remove_count" | while IFS= read -r name; do
    rm -f -- "$log_dir/$name" 2>/dev/null
  done
  return 0
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  [ -n "${1:-}" ] && lumina_log_rotate "$1" 2>/dev/null
  exit 0
fi
