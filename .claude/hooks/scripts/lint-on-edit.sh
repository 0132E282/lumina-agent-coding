#!/usr/bin/env bash
# PostToolUse hook: run static analysis (linter/type-checker) right after
# Edit/Write on a file, report errors back to Claude Code via additionalContext --
# see rules/delivery.md (static analysis before reporting
# completion). Advisory only: does NOT block, because the tool already finished.
#
# Reads JSON input from stdin per the PostToolUse schema:
#   { "tool_name": "Edit", "tool_input": { "file_path": "..." }, ... }
#
# Best-effort: missing jq, no matching linter, or file not of a
# supported type -> skip quietly.

# ! Skip if the project already has the same hook (avoid running twice with the user-level copy).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

file_path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"
[ -z "$file_path" ] && exit 0
[ -f "$file_path" ] || exit 0

lint_output=""

case "$file_path" in
  *.ts|*.tsx)
    if [ -f "tsconfig.json" ] && npx --no-install tsc --version >/dev/null 2>&1; then
      lint_output="$(npx --no-install tsc --noEmit --pretty false 2>&1)" || true
    fi
    ;;
  *.js|*.jsx)
    if [ -f ".eslintrc" ] || [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ] || [ -f ".eslintrc.cjs" ] || [ -f "eslint.config.js" ] || [ -f "eslint.config.mjs" ]; then
      if npx --no-install eslint --version >/dev/null 2>&1; then
        lint_output="$(npx --no-install eslint "$file_path" 2>&1)" || true
      fi
    fi
    ;;
  *.py)
    if command -v ruff >/dev/null 2>&1; then
      lint_output="$(ruff check "$file_path" 2>&1)" || true
    elif command -v flake8 >/dev/null 2>&1; then
      lint_output="$(flake8 "$file_path" 2>&1)" || true
    fi
    ;;
  *.php)
    if command -v phpstan >/dev/null 2>&1; then
      lint_output="$(phpstan analyse "$file_path" --no-progress 2>&1)" || true
    elif [ -x "vendor/bin/phpstan" ]; then
      lint_output="$(vendor/bin/phpstan analyse "$file_path" --no-progress 2>&1)" || true
    fi
    ;;
  *)
    exit 0
    ;;
esac

[ -z "$lint_output" ] && exit 0
# Some tools exit 0 with output "no errors"/"found 0 errors" -> strip those zero-count phrases
# before looking for error|warning, so we only report when real diagnostics remain.
diagnostic_output="$(printf '%s' "$lint_output" | tr '[:upper:]' '[:lower:]' | sed -E 's/(^|[^0-9])0 (errors?|warnings?|problems?)/\1/g; s/no (errors?|warnings?)/ /g')"
printf '%s' "$diagnostic_output" | grep -qE 'error|warning' || exit 0

context="Static analysis on ${file_path} reported issues:
${lint_output}"

jq -n --arg ctx "$context" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: $ctx
  }
}'
exit 0
