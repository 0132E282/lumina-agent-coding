#!/usr/bin/env bash
# Xoay vòng .agents/storage/logs/logs.jsonl, dùng chung cho writer (audit-log, turn-log) và reader.
# Không đăng ký trong settings.json. Hai cách dùng:
#   . _log-rotate.sh                  # source, rồi gọi lumina_log_rotate <log_dir>
#   bash _log-rotate.sh <log_dir>     # chạy trực tiếp (turn-log.mjs gọi trước khi append)
#
# Env: LUMINA_LOG_MAX_BYTES (mặc định 1 MiB), LUMINA_LOG_KEEP (giữ N file đã xoay, mặc định 5).
# Best-effort: không bao giờ làm writer thất bại, chạy trực tiếp luôn exit 0.

lumina_rotated_log_pattern='^logs-[0-9]{8}-[0-9]{6}(-[0-9]+)?\.jsonl$'

# In tên file đã xoay trong <log_dir>, cũ → mới. Bỏ đuôi trước khi sort để bản không hậu tố đứng trước `-1`;
# hậu tố trùng giây so theo số để `-10` đứng sau `-2`.
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

# In đường dẫn file cần đọc cho một session: file đã xoay mới nhất (nếu có) rồi file đang ghi (nếu có).
lumina_session_log_files() {
  local log_dir="$1" newest
  newest="$(lumina_rotated_logs "$log_dir" | tail -n 1)"
  [ -n "$newest" ] && [ -f "$log_dir/$newest" ] && printf '%s\n' "$log_dir/$newest"
  [ -f "$log_dir/logs.jsonl" ] && printf '%s\n' "$log_dir/logs.jsonl"
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

  # mv cùng thư mục là rename nguyên tử; writer đã mở file trước đó vẫn ghi vào inode cũ (file đã xoay), không mất dòng.
  # -n: không ghi đè file xoay của tiến trình khác chọn trùng tên. Thất bại (tiến trình khác đã xoay) thì bỏ qua.
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
