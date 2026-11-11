#!/usr/bin/env bash
# PreToolUse hook: write an audit trail for EVERY tool call of Claude Code/subagents
# -- who/when/what, for traceability per rules/backend.md.
#
# Reads JSON input from stdin per the PreToolUse schema:
#   { "session_id": "...", "tool_name": "...", "tool_input": {...}, "cwd": "..." }
#
# Always exit 0 -- auxiliary hook, must not block a tool call if logging fails.
# Deliberately NO `set -e`/`set -u`, with a `trap ERR` as the last safety net --
# the audit log is best-effort, never traded for interrupting the agent.

# ! Skip if the project already has the same hook (avoid running twice with the user-level copy).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

# Mỗi ngày một file logs-YYYYMMDD.jsonl; thiếu helper (bản cài cũ chỉ copy một phần) thì vẫn ghi vào file cùng tên.
storage_helper="$(dirname "$0")/_hook-storage.sh"
[ -f "$storage_helper" ] && . "$storage_helper"

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

tool_name_check="$(printf '%s' "$input" | jq -r '.tool_name // ""' 2>/dev/null)"
[ -z "$tool_name_check" ] && exit 0

if [ -n "$CLAUDE_PROJECT_DIR" ] && [ -d "$CLAUDE_PROJECT_DIR" ]; then
  project_dir="$CLAUDE_PROJECT_DIR"
else
  project_dir="$(printf '%s' "$input" | jq -r '.cwd // ""' 2>/dev/null)"
  [ -n "$project_dir" ] && [ -d "$project_dir" ] || project_dir="$(pwd)"
fi

log_dir="$project_dir/.agents/storage/logs"
mkdir -p "$log_dir" 2>/dev/null || exit 0
if command -v lumina_log_file >/dev/null 2>&1; then
  log_file="$(lumina_log_file "$log_dir")"
else
  log_file="$log_dir/logs-$(date +%Y%m%d).jsonl"
fi
[ -n "$log_file" ] || exit 0

timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
session_id="$(printf '%s' "$input" | jq -r '.session_id // "unknown"' 2>/dev/null)"
cwd="$(printf '%s' "$input" | jq -r '.cwd // ""' 2>/dev/null)"
# Claude Code only sends agent_id when the tool runs in a subagent; the main session has no such field.
agent_id="$(printf '%s' "$input" | jq -r '.agent_id // ""' 2>/dev/null)"

# Mask common secrets in Bash commands (heuristic, keep the key, replace the value with ***).
# Runs BEFORE the 200-char cut so a secret straddling the cut point is not partly exposed.
redact_secrets_filter="$(cat <<'JQ'
def redact_secrets:
  gsub("(?<k>[a-z][a-z0-9+.-]*://[^/\\s:@]+:)[^/\\s@]+@"; "\(.k)***@"; "gi")
  | gsub("(?<k>\\bbearer\\s+)[^\\s\"']+"; "\(.k)***"; "gi")
  | gsub("(?<k>--(?:password|passwd|token|api-key|secret)(?:=|\\s+))(?:\"[^\"]*\"|'[^']*'|[^\\s\"']+)"; "\(.k)***"; "gi")
  | gsub("(?<k>(?<![A-Za-z0-9_-])(?:[A-Za-z0-9_-]*(?:token|passw(?:or)?d|secret|api[_-]?key|apikey|_key)|pwd)[\"']?\\s*[:=]\\s*)(?:\"[^\"]*\"|'[^']*'|[^\\s\"'&;|]+)"; "\(.k)***"; "gi")
  | gsub("(?<k>gh[pousr]_|github_pat_)[A-Za-z0-9_]+"; "\(.k)***")
  | gsub("(?<k>sk_(?:live|test)_)[A-Za-z0-9]+"; "\(.k)***")
  | gsub("(?<k>xox[baprs]-)[A-Za-z0-9-]+"; "\(.k)***")
  | gsub("(?<k>AKIA)[0-9A-Z]{16}"; "\(.k)***")
  | gsub("(?<k>AIza)[0-9A-Za-z_-]{20,}"; "\(.k)***")
  | gsub("eyJ[A-Za-z0-9_-]+\\.eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+"; "***");
JQ
)"

# Summarize tool_input by tool type -- do NOT log the full file content (Write/Edit)
# to keep the log small and avoid leaking sensitive content.
summary="$(printf '%s' "$input" | jq -c "$redact_secrets_filter"'
  .tool_input as $i
  | if ($i.file_path // "") != "" then {file_path: $i.file_path}
    elif ($i.command // "") != "" then {command: ($i.command | redact_secrets | .[0:200])}
    elif ($i.pattern // "") != "" then {pattern: $i.pattern}
    elif ($i.skill // "") != "" then {skill: $i.skill}
    else {}
    end
' 2>/dev/null)"
[ -z "$summary" ] && summary='{}'

entry="$(jq -nc \
  --arg ts "$timestamp" \
  --arg session "$session_id" \
  --arg tool "$tool_name_check" \
  --arg cwd "$cwd" \
  --arg agent_id "$agent_id" \
  --argjson input "$summary" \
  '{ts: $ts, session_id: $session, tool: $tool, cwd: $cwd, input: $input}
   + (if $agent_id != "" then {agent_id: $agent_id} else {} end)' 2>/dev/null)"

if [ -n "$entry" ]; then
  printf '%s\n' "$entry" >> "$log_file" 2>/dev/null
fi

exit 0
