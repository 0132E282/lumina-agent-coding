---
title: Debug rule/skill, compact Token line and context-threshold remind-cleanup
description: Repository-level testcases for the bug-fix rule, debugs skill, compact Token format with total, and the remind-cleanup hook (80% context threshold, skips config dirs, reminds once per file).
tags:
  - agent-rules
  - skills
  - hooks
  - report
  - regression
---

# Debug rule/skill, compact Token line and context-threshold remind-cleanup

Execution status: **Not Run**. This document only designs testcases from the real configuration and hooks after implementation.

## Test cases

### TC-DBG-001 — bug-fix rule and debugs skill link correctly

- Steps: open `.agents/rules/bug-fix.md`, `.agents/rules/delivery.md` (quality and evidence section), `.agents/skills/debugs/SKILL.md`, `.agents/skills/debugs/references/checklist.md`, `AGENTS.md` (Choosing skills by task); check every relative link.
- Expected: delivery points to `rules/bug-fix`; the rule points to skill `debugs`; the skill points back to the rule and `references/checklist.md`; AGENTS.md has a "Debug / bug fix" line; no link to `rules/debug.md` remains.
- Status: Not Run.

### TC-DBG-002 — Debug criteria content complete

- Steps: compare `checklist.md` against the 10 criteria (Reproduce → Verification), 9 bug types and 9 quality checklist items; compare SKILL.md against the 7-step process.
- Expected: all criteria, bug types and checklist items present; database read-only; no guess-based fix instructions.
- Status: Not Run.

### TC-TOK-001 — report-usage hook emits compact Token line with total

- Precondition: transcript has usage input 18, output 4448, cache read 912046, cache create 13421; a previous report marker exists.
- Steps: invoke skill `report` (PostToolUse) and read `additionalContext`.
- Expected: `📈 Token: input 18 | output 4.4k | cache read 912k | cache create 13.4k | total 930k (since previous marker).`; `emitted.json` stores raw numbers with `total` 929933.
- Status: Not Run.

### TC-TOK-002 — report-usage-check hook compares compact/raw/total numbers

- Steps: Stop with a report whose Token line is (a) correct compact, (b) correct raw numbers, (c) wrong compact `4.5k`, (d) missing `total`, (e) wrong `total`.
- Expected: (a)(b)(d) silent; (c)(e) warn about display mismatch with the hook's compact numbers including total.
- Status: Not Run.

### TC-CLN-001 — remind-cleanup silent below 80% context

- Precondition: session has Written `tmp-notes.md` at root; last assistant message usage < 160k (default limit 200k).
- Steps: run Stop hook `remind-cleanup.sh`.
- Expected: no output.
- Status: Not Run.

### TC-CLN-002 — remind-cleanup reminds at ≥ 80% and only once per file

- Steps: usage ≥ 80% → Stop 1st time; Stop 2nd time same file; Write another `scratch-new.txt` → Stop 3rd time; repeat with `CLAUDE_CONTEXT_LIMIT=100000`.
- Expected: 1st reminds with `% (used/limit)` and 1 file; 2nd no output; 3rd reminds only the new file; limit override changes the percentage accordingly; no file is deleted.
- Status: Not Run.

### TC-CLN-003 — Finder skips config/docs directories

- Steps: session Writes `.agents/rules/debug.md`, `.agents/skills/x/draft-skill.md`, `.claude/hooks/debug-hook.sh`, `docs/draft-x.md`, `tmp-notes.md`; run `find-session-scratch-files.sh <session_id>`.
- Expected: lists only `tmp-notes.md`.
- Status: Not Run.

### TC-DBG-003 — Severity, intermittent bugs, security and Debug report template

- Steps: open `.agents/rules/bug-fix.md`, `.agents/skills/debugs/SKILL.md`, `references/checklist.md` (Severity section), `.agents/skills/report/assets/debug-report-template.md` and the template table in `.agents/skills/report/SKILL.md`.
- Expected: S1–S4 scale present; intermittent-bug process (repeat runs, record rate, try race); security bugs must go through `review-web-security`, payloads forbidden in reports; minimum performance measurements; postmortem for production bugs; regression test must fail again when only the fix is removed; report skill lists the Debug template.
- Status: Not Run.

### TC-REV-001 — Review rule and item C10

- Steps: open `.agents/rules/review.md`, `.agents/skills/workflow-review/references/code-review-checklists.md` (C10), `.claude/agents/reviewer-agent.md`, `.claude/agents/coding-agent.md` (rule 9).
- Expected: review only reports, with evidence, always covers logic/Big O/security; C10 checks origin, root cause, regression test failing on base, UI screenshots, severity, security; reviewer-agent and coding-agent point to the correct rule.
- Status: Not Run.

### TC-HOOK-001 — report-reminder ignores subagent Edit/Write

- Steps: write an audit log with one Edit carrying `agent_id` (subagent) and run Stop hook `report-reminder.sh`; add an Edit without `agent_id` and run again.
- Expected: 1st run no reminder; 2nd run reminds only for main-session files.
- Status: Not Run.

### TC-HOOK-002 — Test reminder for bug-fix commits

- Steps: in a temp repo, stage a source file without tests then invoke the hook with a commit command whose message type is `fix`; repeat with `tests/x.test.mjs` staged; repeat with type `feat`.
- Expected: only fix without a test gets a reminder; the hook does not block the commit.
- Status: Not Run.

### TC-HOOK-003 — commit-msg-guard does not catch non-commit commands

- Steps: run the PreToolUse hook with a Bash command that writes a file (heredoc/`python3 -`) containing a commit command string in its content.
- Expected: hook does not block; checks the message only when the command is really a commit.
- Status: Not Run.

### TC-CFG-001 — Link/anchor checker and docs index

- Steps: run `python3 scripts/check-agent-config.py` on the repo; create a broken link, wrong anchor and a `docs/repo` entry out of sync with `docs/index.json` in a temp copy and rerun.
- Expected: current repo valid; the broken copy reports the correct `file:line` and mismatched entry, exit non-zero.
- Status: Not Run.

### TC-DBG-004 — verify-regression.sh proves the test fails on base

- Steps: in a temp repo with the bug at base and the fix + new test in the working tree, run `bash .agents/skills/debugs/scripts/verify-regression.sh <base> -- node --test <test>`; repeat with a test that passes on both sides, head still failing, and no test file.
- Expected: exit 0 / 1 / 1 / 2 respectively; logs written to `.agents/storage/evidence/<slug>/`; temp worktree cleaned up, working tree/index unchanged.
- Status: Not Run.

### TC-REG-001 — Repository regression checks

- Steps: run `npm test`, `python3 scripts/check-agent-config.py`, `bash -n` on the changed `.sh` hooks, JSON validation of `docs/index.json`/`docs/repo/index.json` and `git diff --check`.
- Expected: all commands succeed.
- Status: Not Run.
