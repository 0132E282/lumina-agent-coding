#!/usr/bin/env bash
# PostToolUse hook: the browser tool (Claude in Chrome) saves screenshots into the system
# temp directory; this hook copies the image into the project so the evidence survives OS temp cleanup
# and reports the new path via additionalContext.
#
# Reads JSON input from stdin per the PostToolUse schema:
#   { "tool_name": "...", "tool_response": ..., "cwd": "..." }
#
# ! The Chrome tool_response structure is not verified, so scan every string in it
# with an image-file regex, then accept only regular files (no symlinks) under the temp directory.
#
# Copy, not move; on a name clash add a suffix, never overwrite. Always exit 0, never blocks the tool.

# ! Skip if the project already has the same hook (avoid running twice with the user-level copy).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

if [ -n "$CLAUDE_PROJECT_DIR" ] && [ -d "$CLAUDE_PROJECT_DIR" ]; then
  project_dir="$CLAUDE_PROJECT_DIR"
else
  project_dir="$(printf '%s' "$input" | jq -r '.cwd // ""' 2>/dev/null)"
  [ -n "$project_dir" ] && [ -d "$project_dir" ] || project_dir="$(pwd)"
fi
project_dir_real="$(cd "$project_dir" 2>/dev/null && pwd -P)" || exit 0

candidates="$(printf '%s' "$input" \
  | jq -r '[.tool_response | .. | strings] | join("\n")' 2>/dev/null \
  | grep -oiE "/[^\"'[:space:]<>|\\\\]*\\.(png|jpe?g|webp)" \
  | sort -u)"
[ -z "$candidates" ] && exit 0

temp_roots=()
for root in "$TMPDIR" /tmp /private/tmp /var/folders /private/var/folders; do
  [ -n "$root" ] && [ -d "$root" ] || continue
  root_real="$(cd "$root" 2>/dev/null && pwd -P)" || continue
  temp_roots+=("${root_real%/}")
done
[ "${#temp_roots[@]}" -eq 0 ] && exit 0

is_under_temp_root() {
  local directory="$1" root
  for root in "${temp_roots[@]}"; do
    case "$directory/" in
      "$root"/*) return 0 ;;
    esac
  done
  return 1
}

destination_dir="$project_dir/.agents/storage/evidence/browser/$(date +%Y%m%d)"
copied_lines=""

while IFS= read -r source_path; do
  [ -n "$source_path" ] || continue
  [ -f "$source_path" ] && [ ! -L "$source_path" ] || continue
  source_dir_real="$(cd "$(dirname "$source_path")" 2>/dev/null && pwd -P)" || continue
  is_under_temp_root "$source_dir_real" || continue
  # If the project lives under the temp directory, do not copy images already inside the project.
  case "$source_dir_real/" in
    "$project_dir_real"/*) continue ;;
  esac

  mkdir -p "$destination_dir" 2>/dev/null || exit 0
  file_name="$(basename "$source_path")"
  stem="${file_name%.*}"
  extension="${file_name##*.}"
  destination_path="$destination_dir/$file_name"
  suffix=1
  while [ -e "$destination_path" ] || [ -L "$destination_path" ]; do
    destination_path="$destination_dir/$stem-$suffix.$extension"
    suffix=$((suffix + 1))
  done

  cp -p "$source_path" "$destination_path" 2>/dev/null || continue
  copied_lines="${copied_lines}- ${source_path} -> ${destination_path}
"
done <<< "$candidates"

[ -z "$copied_lines" ] && exit 0

context="Browser screenshot in the temp directory was copied into the project:
${copied_lines}
Cite the project path above (not the temp path) when reporting or using it as evidence."

jq -n --arg ctx "$context" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: $ctx
  }
}'
exit 0
