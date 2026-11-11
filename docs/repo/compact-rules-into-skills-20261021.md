---
title: Compact all rules and move details into skills
description: Repository-level testcases to verify thin rules, semantic owners, references and runtime configuration after the refactor.
tags:
  - agent-rules
  - skills
  - configuration
  - regression
---

# Compact all rules and move details into skills

Execution status: **Not Run**. This document only designs testcases from the real configuration and flows after implementation.

## Test cases

### TC-RULE-001 — Inventory and thin rule structure

- Precondition: repository is in the post-implementation state of the plan.
- Steps: list `.agents/rules/*.md`, count files and read each rule.
- Expected: all 18 rules present; each rule keeps only trigger/scope, core invariant/policy and a pointer to its owner; no long examples or operational checklists remain.
- Status: Not Run.

### TC-RULE-002 — Semantics preserved at skill/role owner

- Precondition: a semantic mapping exists in the implementation plan.
- Steps: trace each pointer from rule to skill/role, look for these invariants: Git authorization/conflict, scope authorization, report gate, plan schema, `any`, Rule of Three, comment label/length, UI evidence, database read-only, transaction, case accounting, docs registry, no-fabrication and response format.
- Expected: every pre-refactor semantic exists in exactly one primary owner or a clear pointer; no new policy appears and no constraint is lost.
- Status: Not Run.

### TC-RULE-003 — Runtime adapter and reference

- Steps: run `python3 scripts/check-agent-config.py`, scan relative links and the old rule names `commit-discipline`/`pull-request-conflict`.
- Expected: checker succeeds; symlinks/adapters valid; no stale references outside intentional plan history descriptions.
- Status: Not Run.

### TC-RULE-004 — Repository regression checks

- Steps: run `npm run check`, `npm test`, JSON validation, final-newline checker on changed text files and `git diff --check`.
- Expected: all commands succeed; JSON parses; no whitespace/newline errors.
- Status: Not Run.

### TC-RULE-005 — Scope and dirty-work preservation

- Steps: compare `git status --short`, `git diff` and `git diff --cached` against the pre-implementation baseline.
- Expected: no commit/push; deleted Git rules remain deleted; existing hunks in `bin/lumina-agent.mjs`, `tests/lumina-agent.test.mjs`, Git/database/dependency/hook are kept; no new product-code diff outside scope.
- Status: Not Run.
