#!/usr/bin/env bash
# Stop hook: play a notification sound when Claude Code finishes a task (turn ends).
#
# No need to read the JSON input (session_id, transcript_path...) since it only plays
# a sound -- but still drain stdin to avoid a broken-pipe warning.
#
# Always exit 0 -- auxiliary (best-effort) hook, must not stop Claude Code from
# stopping. A Stop hook with exit code 2 BLOCKS Claude from stopping -- absolutely avoid, so
# no `set -e`/`set -u` and a `trap ERR` as the last safety net.

# ! Skip if the project already has the same hook (avoid running twice with the user-level copy).
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
