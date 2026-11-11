#!/usr/bin/env bash
# PostToolUse hook: after Edit/Write on a CI workflow file (GitHub Actions,
# GitLab CI, Azure Pipelines), run the matching YAML linter and report problems back
# to Claude via additionalContext -- see skill ci-pipeline and
# rules/delivery.md. Advisory only, never blocks.
#
# Reads JSON input from stdin per the PostToolUse schema:
#   { "tool_name": "Edit", "tool_input": { "file_path": "..." }, ... }
#
# Best-effort: missing jq, file is not a CI workflow, or missing matching
# linter (actionlint/yamllint) -> skip quietly.

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
  */.github/workflows/*.yml|*/.github/workflows/*.yaml)
    if command -v actionlint >/dev/null 2>&1; then
      lint_output="$(actionlint "$file_path" 2>&1)" || true
    elif command -v yamllint >/dev/null 2>&1; then
      lint_output="$(yamllint "$file_path" 2>&1)" || true
    fi
    ;;
  */.gitlab-ci.yml|*/azure-pipelines.yml|*/azure-pipelines.yaml)
    if command -v yamllint >/dev/null 2>&1; then
      lint_output="$(yamllint "$file_path" 2>&1)" || true
    fi
    ;;
  *)
    exit 0
    ;;
esac

[ -z "$lint_output" ] && exit 0

context="CI workflow lint on ${file_path} reported issues (use skill ci-pipeline to review/fix):
${lint_output}"

jq -n --arg ctx "$context" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: $ctx
  }
}'
exit 0
