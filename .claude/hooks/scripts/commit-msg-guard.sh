#!/usr/bin/env bash
# PreToolUse hook: block a `git commit` command if the message is not in
# Conventional Commits format -- enforces rules/git.md automatically,
# without relying on Claude Code to follow the rule voluntarily.
#
# Reads JSON input from stdin per the PreToolUse schema:
#   { "tool_name": "Bash", "tool_input": { "command": "..." }, ... }
#
# Block (deny) by printing hookSpecificOutput JSON to stdout + exit 0
# (the PreToolUse protocol of Claude Code -- with exit 0 plus valid JSON,
# the JSON decides, not the exit code).
#
# Best-effort: if the message cannot be extracted (e.g. commit opens an editor,
# uses -F file, or jq/validator is missing) -> do not block, let git handle it.

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

. "$(dirname "$0")/_shell-command.sh"
invocations="$(git_invocations "$command_str" commit)" || true
[ -n "$invocations" ] || exit 0

validator=".claude/skills/git-workflow/scripts/validate-commit-message.sh"
[ -f "$validator" ] || exit 0

# The message is taken only from the arguments of the `git commit` command itself (-m/--message, or
# -F - with heredoc); not from the heredoc/-m of other commands such as `cat`/`git tag`.
reasons=()
while IFS= read -r invocation; do
  [ -z "$invocation" ] && continue
  IFS=$'\037' read -r -a fields <<< "$invocation"
  message="$(git_commit_message "${fields[@]:2}")" || continue
  [ -z "$message" ] && continue
  # Use the output content to decide validity (validator exits 1 when invalid --
  # do not rely on the exit code directly because the `trap ERR` above would exit early).
  validation_output="$(printf '%s' "$message" | bash "$validator" - 2>&1)" || true
  printf '%s' "$validation_output" | grep -q '❌' || continue
  reasons+=("$(printf '%s' "$validation_output" | tr '\n' ' ')")
done <<< "$invocations"

[ "${#reasons[@]}" -eq 0 ] && exit 0

reason="${reasons[*]}"
jq -n --arg reason "$reason" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: $reason
  }
}'
exit 0
