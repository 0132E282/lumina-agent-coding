#!/usr/bin/env bash
# PreToolUse hook: FINAL SAFETY NET against an
# Agent "planner" tool_input.prompt that slipped through and is abnormally long -- NOT
# the main context-shrinking mechanism. Choosing what to keep/drop needs
# semantic understanding (what the architect said, what the planner really needs) --
# bash cannot do that, so that responsibility belongs to the step calling `planner`
# (the orchestrating session has read the full documents and selects the relevant parts
# before putting them in the prompt -- see skills/workflow-plan/SKILL.md). This hook only cuts mechanically
# when the prompt exceeds a very large threshold, in case a long document was pasted verbatim
# without selection.
#
# Reads JSON input from stdin per the PreToolUse schema:
#   { "tool_name": "Agent", "tool_input": { "subagent_type": "planner", "prompt": "..." }, ... }
#
# Edits tool_input via hookSpecificOutput.updatedInput -- this field lets a
# PreToolUse hook replace the content before the tool actually runs.
#
# Cut rule (only when over the very large threshold): keep the head (usually
# containing goals/REQ) and the tail (usually conclusions/risks), cut the
# middle, insert a marker line -- no LLM summarization, cut by length only.
#
# Best-effort: missing jq, not the Agent tool, not subagent_type
# "planner", or prompt under the threshold -> change nothing (no
# hookSpecificOutput in the output).

# ! Skip if the project already has the same hook (avoid running twice with the user-level copy).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

MAX_CHARS=20000
HEAD_CHARS=13000
TAIL_CHARS=6000

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

tool_name="$(printf '%s' "$input" | jq -r '.tool_name // ""' 2>/dev/null)"
[ "$tool_name" = "Agent" ] || exit 0

subagent_type="$(printf '%s' "$input" | jq -r '.tool_input.subagent_type // ""' 2>/dev/null)"
[ "$subagent_type" = "planner" ] || exit 0

prompt="$(printf '%s' "$input" | jq -r '.tool_input.prompt // ""' 2>/dev/null)"
[ -z "$prompt" ] && exit 0

prompt_length=${#prompt}
[ "$prompt_length" -le "$MAX_CHARS" ] && exit 0

head_part="${prompt:0:$HEAD_CHARS}"
tail_part="${prompt: -$TAIL_CHARS}"
marker="

[...shortened ${prompt_length} characters to head+tail only because it exceeded the ${MAX_CHARS} threshold -- if the cut part is needed, reread the source document...]

"
condensed="${head_part}${marker}${tail_part}"

# updatedInput replaces the whole tool_input (not just merging the "prompt" field) --
# the other fields (subagent_type, description...) must be kept intact, only
# "prompt" changes, so the Agent tool call is not broken.
printf '%s' "$input" | jq --arg prompt "$condensed" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    updatedInput: (.tool_input | .prompt = $prompt)
  }
}'
exit 0
