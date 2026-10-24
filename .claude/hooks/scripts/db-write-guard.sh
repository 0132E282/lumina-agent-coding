#!/usr/bin/env bash
# PreToolUse hook (Bash): hỏi (ask) trước lệnh có thể ghi/đổi database thật —
# SQL ghi qua client CLI hoặc migrate/seed — CONTRACT #2, rules/backend.md.
#
# Nhận JSON input từ stdin theo schema PreToolUse:
#   { "tool_name": "Bash", "tool_input": { "command": "..." }, ... }
#
# Chỉ dùng "ask" (không "deny"): người dùng có thể đã yêu cầu rõ migrate/seed
# hoặc đang làm việc trên DB test/sandbox mà hook không phân biệt được.
#
# Best-effort: thiếu jq -> không chặn; không đọc được file `-f script.sql`,
# lệnh qua alias/script/biến, hay `npm run migrate`.

# ! Bỏ qua nếu project đã có cùng hook (tránh chạy 2 lần với bản user-level).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

tool_name="$(printf '%s' "$input" | jq -r '.tool_name // ""' 2>/dev/null)"
[ "$tool_name" = "Bash" ] || exit 0

command_str="$(printf '%s' "$input" | jq -r '.tool_input.command // ""' 2>/dev/null)"
[ -z "$command_str" ] && exit 0

. "$(dirname "$0")/_shell-command.sh"
invocations="$(command_invocations "$command_str")" || true
[ -n "$invocations" ] || exit 0

write_statement='(^|[^[:alnum:]_])(insert|update|delete|drop|alter|truncate|create|flushall|flushdb)([^[:alnum:]_]|$)'
migration_command='(^|[ /])(artisan[ ]+(migrate|db:seed)|prisma[ ]+(migrate|db[ ]+push|db[ ]+seed)|rails[ ]+db:(migrate|seed)|knex[ ]+(migrate|seed)|alembic[ ]+upgrade|sequelize(-cli)?[ ]+db:(migrate|seed)|typeorm[ ]+migration:run)'

reasons=()
while IFS= read -r invocation; do
  [ -z "$invocation" ] && continue
  IFS=$'\037' read -r -a fields <<< "$invocation"
  program="${fields[0]}"
  # Gồm cả thân heredoc (\035...) vì SQL thường được đưa vào client qua stdin.
  arguments="$(printf '%s ' "${fields[@]:1}" | tr '\036\035' '  ')"
  case "$program" in
    psql|mysql|mariadb|sqlite3|mongosh|redis-cli)
      if printf '%s' "$arguments" | grep -qiE -- "$write_statement"; then
        reasons+=("lệnh ghi qua client '$program'")
      fi
      ;;
    php|sail|artisan|npx|pnpx|bunx|yarn|pnpm|npm|bundle|bundler|rails|prisma|knex|alembic|sequelize|sequelize-cli|typeorm|python|python3|poetry|uv|node|dotenv)
      if printf '%s %s' "$program" "$arguments" | grep -qE -- "$migration_command"; then
        reasons+=("migrate/seed qua '$program'")
      fi
      ;;
  esac
done <<< "$invocations"

[ "${#reasons[@]}" -eq 0 ] && exit 0

reason_list="$(printf '%s; ' "${reasons[@]}")"
reason_text="Có thể ghi/đổi database: ${reason_list%; }. CONTRACT #2: chỉ chạy khi người dùng đã yêu cầu rõ cả thiết kế và thực thi, trên đúng database."
jq -n --arg reason "$reason_text" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "ask",
    permissionDecisionReason: $reason
  }
}'
exit 0
