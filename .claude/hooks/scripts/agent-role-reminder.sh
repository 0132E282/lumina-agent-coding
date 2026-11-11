#!/usr/bin/env bash
# PreToolUse hook: every Agent tool call reports which agent is
# being used (permissionDecision "allow" with a reason -- does not block). Only "heavy"
# roles (analyst, planner, architect,
# reviewer, qa-tester, researcher) with a very short prompt are
# switched to "ask" (confirmation) -- a mechanical signal of possibly
# over-delegating a small task, against Execution discipline (AGENTS.md/CLAUDE.md):
# small/clear tasks go straight to coder, not the full chain by default:
# analyst/planner/reviewer/tester.
#
# The "ask" part is ONLY a mechanical safety net (prompt length), not a semantic judgment
# of the task -- a small text task may genuinely need that role (e.g. reviewing 1
# high-risk file). The orchestrator (main session) decides whether to continue or change course.
#
# Reads JSON input from stdin per the PreToolUse schema:
#   { "tool_name": "Agent", "tool_input": { "subagent_type": "...", "prompt": "..." }, ... }
#
# Best-effort: missing jq or not the Agent tool -> do nothing.

# ! Skip if the project already has the same hook (avoid running twice with the user-level copy).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

MIN_PROMPT_CHARS=150
HEAVY_AGENTS_REGEX='^(analyst|planner|architect|reviewer|qa-tester|researcher)$'

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

tool_name="$(printf '%s' "$input" | jq -r '.tool_name // ""' 2>/dev/null)"
[ "$tool_name" = "Agent" ] || exit 0

subagent_type="$(printf '%s' "$input" | jq -r '.tool_input.subagent_type // "(unknown)"' 2>/dev/null)"
prompt="$(printf '%s' "$input" | jq -r '.tool_input.prompt // ""' 2>/dev/null)"
prompt_length=${#prompt}

decision="allow"
reason="Đang giao task cho agent: ${subagent_type}."

if printf '%s' "$subagent_type" | grep -qE "$HEAVY_AGENTS_REGEX" && [ "$prompt_length" -lt "$MIN_PROMPT_CHARS" ]; then
  decision="ask"
  reason="Delegating task to agent: ${subagent_type} -- prompt is only ${prompt_length} characters. Per Execution discipline, small/clear tasks should go straight to coder instead of this role. If the task truly needs ${subagent_type} (complexity/risk/ambiguous requirements), confirm to continue."
fi

jq -n --arg decision "$decision" --arg reason "$reason" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: $decision,
    permissionDecisionReason: $reason
  }
}'
exit 0
