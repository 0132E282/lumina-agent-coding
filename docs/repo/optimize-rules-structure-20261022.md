---
title: Optimize rules and review repo structure
description: Repository-level testcases verifying rules consolidated to a single owner, no lost constraints, live anchors and unchanged structure/symlinks.
tags:
  - agent-rules
  - configuration
  - regression
  - token-optimization
---

# Optimize rules and review repo structure

Execution status: **Pass 5/5** (run 2026-10-22, see [Results](#execution-results)). Plan: [`optimize-rules-structure-20261022.json`](../plans/optimize-rules-structure-20261022.json).

## Test cases

### TC-001 — Removed constraints still exist at their owner

- Steps: for each sentence removed from `AGENTS.md`, `CLAUDE.md` and rules, `grep` the corresponding idea at its owner: `CONTRACT.md` (#1 commit/push, #2 DB, #5 no fabrication, #8 report), `coding.md#kiss-yagni-và-phạm-vi` (change authorization gate), `frontend.md` (UI gate, baseline/final screenshots), `delivery.md#chất-lượng-và-bằng-chứng` (N+1/loop before handoff), `docs.md#đồng-bộ-tài-liệu` (testcase when plan done), `git.md` (deploy), skill `debugs` (S1–S4, flaky), `git-workflow` (conflict), `report` (`Token:`/`Waste issue:`).
- Expected: every constraint is found at exactly one owner.

### TC-002 — Internal links and anchors

- Steps: `python3 scripts/check-agent-config.py`.
- Expected: exit 0, no broken link/anchor reported.

### TC-003 — Size of rules loaded each session

- Steps: `wc -c .agents/rules/*.md CONTRACT.md AGENTS.md CLAUDE.md`.
- Expected: total below the pre-refactor mark of 33366 bytes.

### TC-004 — Structure, symlinks and paths unchanged

- Steps: `find . -type l -not -path './node_modules/*' -not -path './.git/*'`; `git diff --stat -- bin .claude/settings.json .codex/hooks.json`; `npm test`.
- Expected: same 7 symlinks (`.agents/{agents,commands,hooks}` → `.claude/`, `.claude|.codex/{rules,skills}` → `.agents/`); empty diff for `bin/`, `.claude/settings.json`, `.codex/hooks.json`; `npm test` passes.

### TC-005 — M1 commit all and O1 drop settings.snippet.json

- Steps: read `.agents/rules/git.md` and `.claude/commands/git.md:10`; `test ! -e .claude/hooks/settings.snippet.json`; `grep -rn "settings.snippet" .claude bin tests`.
- Expected: `git.md` defines commit all as all valid changes except forbidden files and `commit change` only when the user chooses it, matching the command; snippet file gone; no references in `.claude/`, `bin/`, `tests/`; hooks README points to `.claude/settings.json`/installer.

## Execution results

Run 2026-10-22 on an uncommitted working tree.

- TC-001 — Pass: 16/16 constraints found at their owner via `grep -F`.
- TC-002 — Pass: `python3 scripts/check-agent-config.py` exit 0.
- TC-003 — Pass: total 29421 bytes < 33366.
- TC-004 — Pass: all 7 symlinks with correct targets; `git diff --stat` empty for `bin/`, `.claude/settings.json`, `.codex/hooks.json`; `node --test tests/*.test.mjs` 267/267 pass.
- TC-005 — Pass: `git.md` has `commit change`, matching "commit all valid changes" in `.claude/commands/git.md`; snippet gone; 0 `settings.snippet` references in `.claude/`, `bin/`, `tests/`.
