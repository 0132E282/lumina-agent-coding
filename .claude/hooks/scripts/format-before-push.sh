#!/usr/bin/env bash
# PreToolUse hook: before `git push`, run Prettier ONCE on files changed versus the remote tracking
# branch -- see skill git-workflow (section "Before git push") and
# rules/delivery.md (uniform formatting before pushing,
# no whitespace arguments when reviewing the PR).
#
# Reads JSON input from stdin per the PreToolUse schema:
#   { "tool_name": "Bash", "tool_input": { "command": "..." }, ... }
#
# ONLY runs `prettier --write` on exactly the files in the diff against
# upstream -- never commits that change. If formatting produces changes,
# use permissionDecision "ask" to warn before pushing: the current push
# still pushes the old commit (without the just-formatted part); the user decides whether to
# commit more and push again or ignore.
#
# Best-effort: missing jq/git, not a git push command, no remote
# tracking branch, missing `prettier`, or no file in the diff needing
# format -> do not block, do not warn.

# ! Skip if the project already has the same hook (avoid running twice with the user-level copy).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0
command -v git >/dev/null 2>&1 || exit 0

input="$(cat)"

tool_name="$(printf '%s' "$input" | jq -r '.tool_name // ""' 2>/dev/null)"
[ "$tool_name" = "Bash" ] || exit 0

command_str="$(printf '%s' "$input" | jq -r '.tool_input.command // ""' 2>/dev/null)"
[ -z "$command_str" ] && exit 0

. "$(dirname "$0")/_shell-command.sh"
invocation="$(git_invocations "$command_str" push | grep -m1 '^known')" || exit 0
IFS=$'\037' read -r -a fields <<< "$invocation"
if [ -n "${fields[1]}" ]; then
  cd "${fields[1]}" 2>/dev/null || exit 0
fi

project_root="$(git rev-parse --show-toplevel 2>/dev/null)"
[ -n "$project_root" ] || exit 0
cd "$project_root" || exit 0
prettier_bin="$project_root/node_modules/.bin/prettier"
[ -x "$prettier_bin" ] || exit 0

upstream="$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null)"
[ -z "$upstream" ] && exit 0

formatted=()
while IFS= read -r -d '' f; do
  [ -f "$f" ] || continue
  before_hash="$(git hash-object "$f" 2>/dev/null)"
  "$prettier_bin" --write --ignore-unknown "$f" >/dev/null 2>&1 || true
  after_hash="$(git hash-object "$f" 2>/dev/null)"
  if [ "$before_hash" != "$after_hash" ]; then
    formatted+=("$f")
  fi
done < <(git diff --name-only -z --diff-filter=ACMR "$upstream" -- 2>/dev/null)

[ "${#formatted[@]}" -eq 0 ] && exit 0

reason="Ran Prettier and reformatted ${#formatted[@]} file(s) (vs remote): $(printf '%s, ' "${formatted[@]}")These files are NOT committed yet -- the current push still pushes the unformatted version. Commit again before pushing to push the formatted version, or ignore if you accept pushing the current version."
jq -n --arg reason "$reason" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "ask",
    permissionDecisionReason: $reason
  }
}'
exit 0
