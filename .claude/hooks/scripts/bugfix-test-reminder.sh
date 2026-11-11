#!/usr/bin/env bash
# PreToolUse hook: remind (advisory) when `git commit` fixes a bug (Conventional Commit
# type `fix`, or message has `Fixes|Closes|Resolves #<number>`)
# and the list of files to commit has no test file -- see
# rules/bug-fix.md (a regression test reproducing the bug before the fix).
#
# Reads JSON input from stdin per the PreToolUse schema:
#   { "tool_name": "Bash", "tool_input": { "command": "..." }, "cwd": "..." }
#
# Only returns additionalContext, never deny/ask. Not a fix commit, cannot
# extract the message, missing jq/git or not in a git repo -> silent.
# Always exit 0.

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
invocation="$(git_invocations "$command_str" commit | grep -m1 '^known')" || exit 0
IFS=$'\037' read -r -a fields <<< "$invocation"
commit_arguments=("${fields[@]:2}")

working_dir="$(printf '%s' "$input" | jq -r '.cwd // ""' 2>/dev/null)"
[ -n "$working_dir" ] && [ -d "$working_dir" ] && cd "$working_dir"
base_directory="$PWD"

# `cd`/`-C` directories are relative to the command's cwd; empty = cwd.
resolve_directory() {
  case "$1" in
    "") printf '%s' "$base_directory" ;;
    /*) printf '%s' "$1" ;;
    *) printf '%s/%s' "$base_directory" "$1" ;;
  esac
}

# Advisory: if the directory cannot be entered, stay silent (deliberate, see README).
cd "$(resolve_directory "${fields[1]}")" 2>/dev/null || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

# The message is taken only from the arguments of the `git commit` command itself.
message="$(git_commit_message "${commit_arguments[@]}")" || exit 0
[ -z "$message" ] && exit 0

subject="$(printf '%s\n' "$message" | sed -E 's/^[[:space:]]+//' | grep -m1 -v '^$')" || true
if ! printf '%s' "$subject" | grep -qE '^fix(\([^)]*\))?!?:'; then
  printf '%s\n' "$message" | grep -qiE '\b(fixes|closes|resolves)[[:space:]]+#[0-9]+' || exit 0
fi

# Files to commit: staged + (commit -a/--all) modified tracked + files that `git add`
# in the same command will stage (PreToolUse runs before `git add` stages them).
# Pathspecs (directories, globs) are resolved by git itself, not guessed from strings.
files="$(git diff --cached --name-only 2>/dev/null)" || true

for raw_argument in "${commit_arguments[@]}"; do
  if [ "$raw_argument" = "--all" ] || [[ "$raw_argument" =~ ^-[A-Za-z]*a[A-Za-z]*$ ]]; then
    files="$files"$'\n'"$(git diff --name-only 2>/dev/null)" || true
    break
  fi
done

add_invocations="$(git_invocations "$command_str" add | grep '^known')" || true
while IFS= read -r add_invocation; do
  [ -z "$add_invocation" ] && continue
  IFS=$'\037' read -r -a add_fields <<< "$add_invocation"
  add_directory="$(resolve_directory "${add_fields[1]}")"
  pathspecs=()
  adds_everything=0
  for raw_argument in "${add_fields[@]:2}"; do
    argument="$(decode_shell_token "$raw_argument")"
    case "$argument" in
      -A|--all|-u|--update) adds_everything=1 ;;
      -*|$'\035'*) ;;
      *) pathspecs+=("$argument") ;;
    esac
  done
  if [ "$adds_everything" -eq 1 ]; then
    files="$files"$'\n'"$(git -C "$add_directory" ls-files --modified --others --exclude-standard 2>/dev/null)" || true
  fi
  if [ "${#pathspecs[@]}" -gt 0 ]; then
    files="$files"$'\n'"$(git -C "$add_directory" ls-files --modified --others --exclude-standard -- "${pathspecs[@]}" 2>/dev/null)" || true
  fi
done <<< "$add_invocations"

test_pattern='(^|/)(tests?|__tests__)/|\.test\.|\.spec\.|_test\.|(^|/)test_'
printf '%s\n' "$files" | grep -qE -- "$test_pattern" && exit 0

context="Fix commit contains no test file. Per rules/bug-fix.md, a bug fix needs a regression test that reproduces and fails for the exact bug before the fix -- add the test to this commit. If it cannot be automated, state how to check before/after the fix (reproduction steps, expected vs actual) in the report."

jq -n --arg ctx "$context" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    additionalContext: $ctx
  }
}'
exit 0
