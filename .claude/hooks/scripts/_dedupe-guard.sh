#!/usr/bin/env bash
# Chỉ được `source` ở đầu mỗi hook, không đăng ký trong settings.json.
# ! Bản user-level thoát êm nếu project đã có cùng script, tránh hook chạy 2 lần trên một event.

hook_scripts_dir="$(cd "$(dirname "$0")" 2>/dev/null && pwd -P)"
project_scripts_dir="$(cd "${CLAUDE_PROJECT_DIR:-$PWD}/.claude/hooks/scripts" 2>/dev/null && pwd -P)"

if [ -n "$hook_scripts_dir" ] && [ -n "$project_scripts_dir" ] \
  && [ "$hook_scripts_dir" != "$project_scripts_dir" ] \
  && [ -f "$project_scripts_dir/$(basename "$0")" ]; then
  exit 0
fi

unset hook_scripts_dir project_scripts_dir
