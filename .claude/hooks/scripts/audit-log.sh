#!/usr/bin/env bash
# PreToolUse hook: ghi audit trail cho MỌI tool call của Claude Code/subagent
# — ai/khi nào/làm gì, phục vụ truy vết theo rules/backend.md.
#
# Nhận JSON input từ stdin theo schema PreToolUse:
#   { "session_id": "...", "tool_name": "...", "tool_input": {...}, "cwd": "..." }
#
# Luôn exit 0 — hook phụ trợ, không được chặn tool call nếu ghi log lỗi.
# Cố ý KHÔNG dùng `set -e`/`set -u`, có `trap ERR` làm lưới an toàn cuối —
# audit log là best-effort, không đánh đổi bằng việc làm gián đoạn agent.

# ! Bỏ qua nếu project đã có cùng hook (tránh chạy 2 lần với bản user-level).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

# Thiếu helper (bản cài cũ chỉ copy một phần) thì vẫn ghi log, chỉ bỏ xoay vòng.
log_rotate_helper="$(dirname "$0")/_log-rotate.sh"
[ -f "$log_rotate_helper" ] && . "$log_rotate_helper"

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
log_file="$log_dir/logs.jsonl"
mkdir -p "$log_dir" 2>/dev/null || exit 0

timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
session_id="$(printf '%s' "$input" | jq -r '.session_id // "unknown"' 2>/dev/null)"
tool_name="$tool_name_check"
cwd="$(printf '%s' "$input" | jq -r '.cwd // ""' 2>/dev/null)"
# Claude Code chỉ gửi agent_id khi tool chạy trong subagent; phiên chính không có field này.
agent_id="$(printf '%s' "$input" | jq -r '.agent_id // ""' 2>/dev/null)"

# Che secret hay gặp trong Bash command (heuristic, giữ key, thay giá trị bằng ***).
# Chạy TRƯỚC khi cắt 200 ký tự để secret nằm vắt qua vị trí cắt không lộ một phần.
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

# Tóm tắt tool_input theo loại tool — KHÔNG ghi nguyên nội dung file (Write/Edit)
# vào log để tránh log phình to và rò rỉ nội dung nhạy cảm.
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
  --arg tool "$tool_name" \
  --arg cwd "$cwd" \
  --arg agent_id "$agent_id" \
  --argjson input "$summary" \
  '{ts: $ts, session_id: $session, tool: $tool, cwd: $cwd, input: $input}
   + (if $agent_id != "" then {agent_id: $agent_id} else {} end)' 2>/dev/null)"

if [ -n "$entry" ]; then
  command -v lumina_log_rotate >/dev/null 2>&1 && lumina_log_rotate "$log_dir"
  printf '%s\n' "$entry" >> "$log_file" 2>/dev/null
fi

exit 0
