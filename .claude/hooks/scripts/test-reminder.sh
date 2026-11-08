#!/usr/bin/env bash
# PostToolUse hook: after Edit/Write on a source file, find the matching test file
# by naming convention and report to Claude via additionalContext:
#   - Test exists -> run that test automatically and report the result (regression test right
#                  after the edit -- see rules/delivery.md).
#   - No test     -> remind to consider writing a test with skill testing.
# Merge both branches into one script so each Edit/Write spawns only one bash process.
#
# Reads JSON input from stdin per the PostToolUse schema:
#   { "tool_name": "Edit", "tool_input": { "file_path": "..." }, ... }
#
# Only supports JS/TS (jest/vitest) and Python (pytest) -- the two most
# common stacks. Missing test runner -> skip quietly. The reminder branch is advisory only, silent if
# the file is in a build/vendor/migration/tests directory or is a config/entry
# point. Blocks nothing, always exit 0.

# ! Skip if the project already has the same hook (avoid running twice with the user-level copy).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

file_path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"
[ -z "$file_path" ] && exit 0
[ -f "$file_path" ] || exit 0

dir="$(dirname "$file_path")"
base="$(basename "$file_path")"
ext="${base##*.}"
name="${base%.*}"

# The just-edited file is already a test file -> no need to rerun other tests or remind to write tests.
case "$base" in
  *.test.*|*.spec.*|test_*.py|*_test.py) exit 0 ;;
esac

candidates=()
case "$ext" in
  ts|tsx|js|jsx)
    candidates=("$dir/$name.test.$ext" "$dir/$name.spec.$ext" "$dir/__tests__/$name.test.$ext")
    ;;
  py)
    candidates=("$dir/test_$name.py" "$dir/${name}_test.py" "$dir/tests/test_$name.py")
    ;;
  *)
    exit 0
    ;;
esac

test_file=""
for c in "${candidates[@]}"; do
  if [ -f "$c" ]; then
    test_file="$c"
    break
  fi
done

emit_context() {
  jq -n --arg ctx "$1" '{
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: $ctx
    }
  }'
}

if [ -z "$test_file" ]; then
  # Directory/file type that needs no dedicated technical test -> skip quietly.
  case "$file_path" in
    */node_modules/*|*/vendor/*|*/dist/*|*/build/*|*/migrations/*|*/__tests__/*|*/tests/*|*.d.ts)
      exit 0
      ;;
  esac

  # Config/entry point files carry no logic needing their own test -> skip quietly.
  case "$base" in
    index.*|main.*|config.*|settings.*) exit 0 ;;
  esac

  emit_context "No matching test found for ${file_path}. If this file contains business logic needing a technical test, use skill testing to write one (pick the right test double type, Arrange-Act-Assert structure)."
  exit 0
fi

result=""
case "$ext" in
  ts|tsx|js|jsx)
    if npx --no-install jest --version >/dev/null 2>&1; then
      result="$(npx --no-install jest "$test_file" --silent 2>&1)" || true
    elif npx --no-install vitest --version >/dev/null 2>&1; then
      result="$(npx --no-install vitest run "$test_file" 2>&1)" || true
    fi
    ;;
  py)
    if command -v pytest >/dev/null 2>&1; then
      result="$(pytest "$test_file" -q 2>&1)" || true
    fi
    ;;
esac

[ -z "$result" ] && exit 0

emit_context "Ran the matching test automatically (${test_file}) after editing ${file_path}:
${result}"
exit 0
