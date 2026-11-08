---
title: Codex handoff - CLI for Claude coding token usage stats
description: Handoff to Codex to build the `lumina-agent usage` command, reading Claude Code transcripts and logs.jsonl to report token usage by session, turn, subagent and day; use when implementing or reviewing the token CLI.
tags:
  - handoff
  - codex
  - cli
  - token-usage
  - claude-code
---

# Codex handoff: CLI for Claude coding token usage stats

## Goal

Add a `lumina-agent usage` command to the existing CLI [`bin/lumina-agent.mjs`](../../bin/lumina-agent.mjs) so users can see how many tokens Claude Code spent coding: per session, per turn (user request), per subagent and per day. Read local data only; no network calls; never modify transcripts/logs.

## Before starting

- Read `AGENTS.md`, `CONTRACT.md`, all of `.agents/rules/`; follow the `coder` role ([`.claude/agents/coder.md`](../../.claude/agents/coder.md)) via `$workflow-implement`.
- No commit/push. No new dependencies (Node >= 20, standard library only).
- Do not touch `~/.claude`, `~/.codex` except to **read** transcripts.

## Data sources (existing, reuse)

| Source | Location | Notes |
|---|---|---|
| Main session transcript | `~/.claude/projects/<project-slug>/<session-id>.jsonl` | `<project-slug>` = project path with `/` replaced by `-`. Each assistant message has `message.usage` (`input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`) and `message.id`. |
| Subagent transcript | `<transcript without .jsonl>/subagents/agent-<agentId>.jsonl` (+ `.meta.json`) | All entries `isSidechain: true`. This is the correct source for subagent tokens; `totalTokens` in the tool result is only the last call's context, **not** the total. |
| Per-turn records | `<project>/.agents/storage/logs/logs.jsonl` and rotated `logs-<UTC>.jsonl` | `"type":"turn"` lines written by the `turn-log` hook: `request`, `tools`, `files`, `tokens`, `subagentTokens`, `subagentsPending`. Log rotation is being implemented in parallel; the CLI must read rotated files too. |
| Existing measure function | [`.agents/skills/report/scripts/task-usage.mjs`](../../.agents/skills/report/scripts/task-usage.mjs) | `export function measure(lines, sinceLine, criteria, { includeSidechain })`: keeps latest usage per `message.id`, skips subagent entries. Reuse; do not rewrite the dedupe logic. |
| Compact number format | [`.claude/hooks/scripts/compact-number.mjs`](../../.claude/hooks/scripts/compact-number.mjs) | `formatCompactNumber`, `formatUsageTotals` (18, 4.4k, 1.2M). |

## Requirements (REQ)

- **REQ-1 Scope selection**: default is the current project (`cwd`). Options `--project <dir>`, `--session <id>`, `--since <YYYY-MM-DD>`, `--until <YYYY-MM-DD>`, `--all-projects`.
- **REQ-2 Grouping**: `--by session|turn|agent|day` (default `session`). `agent` separates the main session and each subagent by `subagent_type` (role name such as `coder`, `planner`), taken from the `Agent` tool_use matching `agentId` in the result.
- **REQ-3 Metrics**: each row has `input`, `output`, `cacheRead`, `cacheCreate`, `total`, message count; dedupe by `message.id` like `measure`. Main session and subagents are computed separately, then summed in the total row.
- **REQ-4 Output**: readable text table (compact k/M numbers) by default; `--json` prints raw JSON (integers) for machines. Sort by `total` descending, `--limit N`.
- **REQ-5 Safety**: never print prompt/tool output content; the `request` column (with `--by turn`) is cut to 80 characters and secrets masked as `turn-log.mjs` does. Read files only.
- **REQ-6 Errors**: transcript not found -> clear message, exit 1, no stack trace. Corrupt JSONL line -> skip and count skipped lines at the end of the report.
- **REQ-7 Cost (optional)**: compute cost only when the user passes `--rates <file.json>` (price per million tokens per model). Do not hardcode prices since they change.

## Technical constraints

- Put logic in a separate module (e.g. `bin/usage.mjs`); `bin/lumina-agent.mjs` only adds the `usage` command branch and a help line; do not change `install` behavior.
- Every CLI entry guard compares using `realpathSync(process.argv[1])` (lesson from the symlink bug in `compact-number.mjs`).
- Read files line by line (stream/`readline`) so large transcripts are not loaded into RAM; complexity O(total lines).
- Update `package.json` `files` if adding new files under `bin/`.

## Testing (required)

Add `tests/usage-cli.test.mjs` (node:test, JSONL fixtures in a temp dir, fake `HOME` so real transcripts are not read):

- Session total correct, including repeated `message.id` (take the latest).
- `--by agent` separates main session and each subagent by role name; unfinished subagents (no transcript/`finished`) are reported separately, not summed.
- `--by turn` reads `type:"turn"` lines from both `logs.jsonl` and `logs-*.jsonl`; `request` has secrets masked.
- `--since/--until`, `--session`, `--limit`, `--json` (valid JSON, integers).
- Missing transcript -> exit 1, clear stderr, empty stdout; corrupt lines are counted.
- Invocation via a symlink path still works.
- Full `npm test` passes; `npm run check`, `python3 scripts/check-agent-config.py`, `git diff --check`.

## Done criteria

- `lumina-agent usage` runs on this repo's real transcripts and prints a sensible table (do not claim numbers before running).
- Update the command section in `README.md` and `AGENTS.md` if they list CLI commands.
- Report via the `report` skill (Change template): files/lines changed, commands actually run with real results, remaining limits.

## Out of scope

- Do not modify the `turn-log`, `report-usage`, `audit-log` hooks or log rotation logic.
- Do not send data outside; no web dashboard.
