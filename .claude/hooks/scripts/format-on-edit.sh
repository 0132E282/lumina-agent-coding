#!/usr/bin/env bash
# PostToolUse hook: automatically reformat the file with Prettier right after a subagent/Claude Code finishes an Edit or Write.
#
# Reads JSON input from stdin per the Claude Code hook schema (PostToolUse):
#   { "tool_name": "Edit", "tool_input": { "file_path": "..." }, ... }
#
# Always exit 0 -- auxiliary (best-effort) hook, must not block
# (block) the agent's action if formatting fails or `prettier` is missing.
#
# Deliberately NO `set -e`: any command in the script failing unexpectedly
# (jq missing, Prettier crash, etc.) must not interrupt the agent --
# the script must always reach the final `exit 0` line. `trap ERR` is the last
# safety net, in case an error slips past the handling points above.

# ! Skip if the project already has the same hook (avoid running twice with the user-level copy).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

input="$(cat)"

file_path="$(echo "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"

[ -z "$file_path" ] && exit 0
[ -f "$file_path" ] || exit 0

case "$file_path" in
  *.js|*.jsx|*.mjs|*.cjs|*.ts|*.tsx|*.json|*.jsonc|*.css|*.scss|*.less|*.html|*.vue|*.md|*.mdx|*.yaml|*.yml|*.graphql)
    ;;
  *)
    # File types Prettier does not support -> skip, not an error.
    exit 0
    ;;
esac

project_root="$(git -C "$(dirname "$file_path")" rev-parse --show-toplevel 2>/dev/null)"
[ -n "$project_root" ] || exit 0
prettier_bin="$project_root/node_modules/.bin/prettier"
[ -x "$prettier_bin" ] || exit 0
cd "$project_root" || exit 0
"$prettier_bin" --write --ignore-unknown "$file_path" >/dev/null 2>&1 || true
exit 0
