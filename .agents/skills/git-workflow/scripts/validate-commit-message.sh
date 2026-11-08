#!/usr/bin/env bash
# Validate a commit message per rules/git.md:
#   - Subject in the form "<type>: <description>"
#   - Subject no longer than 75 characters
#
# Can be used two ways:
#   1. As a git commit-msg hook:  ./validate-commit-message.sh "$1"
#      (git passes the path to the file containing the commit message in $1)
#   2. Standalone, reading stdin: echo "feat: ..." | ./validate-commit-message.sh -
#
# Exit 0 if valid, exit 1 with the list of errors (printed to stderr) if violated.

set -euo pipefail

MAX_SUBJECT_LENGTH=75
ALLOWED_TYPES="feat|fix|refactor|docs|test|chore|style|perf|build|ci"

input_source="${1:-}"

if [ -z "$input_source" ] || [ "$input_source" = "-" ]; then
  message="$(cat)"
else
  message="$(cat "$input_source")"
fi

# Skip comment lines (git commit -v inserts "# ..." lines)
subject="$(printf '%s\n' "$message" | sed '/^#/d' | sed -n '1p')"

errors=()

if [ -z "$subject" ]; then
  errors+=("Missing commit subject (empty subject).")
fi

if ! printf '%s' "$subject" | grep -qE "^(${ALLOWED_TYPES})(\([a-z0-9_-]+\))?: .+"; then
  errors+=("Subject must follow the format '<type>: <description>' with type in [${ALLOWED_TYPES//|/, }]. Got: \"${subject}\"")
fi

subject_length=${#subject}
if [ "$subject_length" -gt "$MAX_SUBJECT_LENGTH" ]; then
  errors+=("Subject is ${subject_length} characters, exceeding the ${MAX_SUBJECT_LENGTH}-character limit.")
fi

if [ "${#errors[@]}" -gt 0 ]; then
  echo "❌ Commit message violates rules/git.md:" >&2
  for e in "${errors[@]}"; do
    echo "  - ${e}" >&2
  done
  echo "" >&2
  echo "Valid example: \"feat: add hook to auto-format code with Prettier after edit\"" >&2
  exit 1
fi

echo "✅ Commit message is valid."
exit 0
