#!/usr/bin/env bash
# Only `source`d at the top of each hook; not registered in settings.json.
# ! The user-level copy exits quietly if the project already has the same script, so a hook never runs twice per event.

hook_scripts_dir="$(cd "$(dirname "$0")" 2>/dev/null && pwd -P)"
project_scripts_dir="$(cd "${CLAUDE_PROJECT_DIR:-$PWD}/.claude/hooks/scripts" 2>/dev/null && pwd -P)"

if [ -n "$hook_scripts_dir" ] && [ -n "$project_scripts_dir" ] \
  && [ "$hook_scripts_dir" != "$project_scripts_dir" ] \
  && [ -f "$project_scripts_dir/$(basename "$0")" ]; then
  exit 0
fi

unset hook_scripts_dir project_scripts_dir
