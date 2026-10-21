#!/usr/bin/env bash
# Stop hook: phát âm thanh thông báo khi Claude Code làm xong task (turn kết thúc).
#
# Không cần đọc input JSON (session_id, transcript_path...) vì chỉ cần phát
# âm thanh — nhưng vẫn drain stdin để tránh broken-pipe warning.
#
# Luôn exit 0 — hook phụ trợ (best-effort), không được chặn Claude Code dừng
# lại. Stop hook mà exit code 2 sẽ CHẶN Claude dừng — tuyệt đối tránh, nên
# không dùng `set -e`/`set -u` và có `trap ERR` làm lưới an toàn cuối.

# ! Bỏ qua nếu project đã có cùng hook (tránh chạy 2 lần với bản user-level).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

cat >/dev/null 2>&1 || true

play_sound() {
  if command -v afplay >/dev/null 2>&1; then
    afplay /System/Library/Sounds/Glass.aiff >/dev/null 2>&1 &
  elif command -v paplay >/dev/null 2>&1; then
    paplay /usr/share/sounds/freedesktop/stereo/complete.oga >/dev/null 2>&1 &
  elif command -v aplay >/dev/null 2>&1; then
    aplay /usr/share/sounds/alsa/Front_Center.wav >/dev/null 2>&1 &
  elif command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -c "[console]::beep(800,200)" >/dev/null 2>&1 &
  fi
}

play_sound

exit 0
