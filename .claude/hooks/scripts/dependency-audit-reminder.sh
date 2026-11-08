#!/usr/bin/env bash
# PostToolUse hook: after a command that installs/adds dependencies (npm/yarn/pnpm,
# composer, pip) via the Bash tool, run the matching READ-ONLY audit of the
# package manager itself and report back to Claude via additionalContext --
# see skill dependency-audit and rules/backend.md (similar
# spirit: free to audit, never upgrade/install more on its own).
#
# Reads JSON input from stdin per the PostToolUse schema:
#   { "tool_name": "Bash", "tool_input": { "command": "..." }, ... }
#
# ONLY runs the audit command (no --fix/--force, no extra install/update
# of anything). Best-effort: missing jq, no dependency-install command matched, or
# missing matching audit tool -> skip quietly.

# ! Skip if the project already has the same hook (avoid running twice with the user-level copy).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

tool_name="$(printf '%s' "$input" | jq -r '.tool_name // ""' 2>/dev/null)"
[ "$tool_name" = "Bash" ] || exit 0

command_str="$(printf '%s' "$input" | jq -r '.tool_input.command // ""' 2>/dev/null)"
[ -z "$command_str" ] && exit 0

# ! Only consider commands that truly execute (shared helper), never mistaking text such as
# "pnpm install"/"yarn add"... in heredoc bodies, quoted strings or commit messages.
. "$(dirname "$0")/_shell-command.sh"

audit_cmd=""
ecosystem=""

while IFS= read -r invocation; do
  IFS=$'\037' read -r -a words <<< "$invocation"
  program="${words[0]:-}"
  subcommand="${words[1]:-}"
  case "$program" in
    python|python3)
      [ "${words[1]:-}" = "-m" ] && [ "${words[2]:-}" = "pip" ] || continue
      program="pip"; subcommand="${words[3]:-}"
      ;;
  esac
  case "$program $subcommand" in
    "npm install"|"npm i"|"npm add") ecosystem="npm"; audit_cmd="npm audit" ;;
    "yarn add"|"yarn install") ecosystem="yarn"; audit_cmd="yarn audit" ;;
    "pnpm add"|"pnpm install"|"pnpm i") ecosystem="pnpm"; audit_cmd="pnpm audit" ;;
    "composer require"|"composer update") ecosystem="composer"; audit_cmd="composer audit" ;;
    "pip install"|"pip3 install") ecosystem="pip"; audit_cmd="pip-audit" ;;
    *) continue ;;
  esac
  break
done < <(command_invocations "$command_str")

[ -n "$audit_cmd" ] || exit 0

# Check that the executing tool exists before trying to run it.
case "$ecosystem" in
  npm) command -v npm >/dev/null 2>&1 || exit 0 ;;
  yarn) command -v yarn >/dev/null 2>&1 || exit 0 ;;
  pnpm) command -v pnpm >/dev/null 2>&1 || exit 0 ;;
  composer) command -v composer >/dev/null 2>&1 || exit 0 ;;
  pip) command -v pip-audit >/dev/null 2>&1 || exit 0 ;;
esac

audit_output="$(eval "$audit_cmd" 2>&1)" || true
[ -z "$audit_output" ] && exit 0

# Skip when the tool itself reports no vulnerabilities -> do not bloat the context.
printf '%s' "$audit_output" | grep -qiE '0 vulnerabilit|no known vulnerabilit|no security vulnerability advisories found|found 0 vulnerabilit' && exit 0

context="After the dependency install command, ${audit_cmd} reported:
${audit_output}

Use skill dependency-audit to classify severity and suggest fix versions -- never upgrade/install more on your own unless asked."

jq -n --arg ctx "$context" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: $ctx
  }
}'
exit 0
