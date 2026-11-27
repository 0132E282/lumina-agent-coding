---
name: debugs
description: Diagnose and fix bugs based on spec and evidence — reproduce, localize, root cause, minimal fix, regression verification. Use when debugging wrong behavior, exceptions, HTTP 4xx/5xx, failing tests, production-only bugs, performance bugs, or when the user says to fix a bug.
license: MIT
metadata:
  version: "1.3"
---

# Debugs

Enforce [`rules/bug-fix`](../../rules/bug-fix.md): never fix bugs by guessing; evidence, root cause and post-fix verification are required. Use the agent's available read, search and command tools. Checks by bug type and quality checklist: [references/checklist.md](references/checklist.md).

## Process

1. **Identify the bug and its basis**: read the applicable guidance (`AGENTS.md`, `CLAUDE.md` or equivalent), then the spec in README, `docs/`, issues or the user's request. Record the error message, time, environment, triggering action and **expected vs actual**. If missing or contradictory in a way that affects the fix, ask for the part needing confirmation.
2. **Reproduce and collect evidence**: run the smallest case causing the bug; capture UI and non-image evidence in `.agents/storage/<task-slug>/` per [`artifacts`](../../rules/artifacts.md). Mask secrets/PII before saving or citing; collect relevant logs, traces, HAR, HTTP status, request/response and queries. If the issue cannot be reproduced, state known conditions. For intermittent bugs, repeat runs and record frequency; vary shared resources only when relevant. Real databases remain read-only per [`backend`](../../rules/backend.md#database-read-only-by-default).
3. **Localize and find the origin**: identify the bug layer (frontend, API, service, database, queue, network, external system) and the origin: code, data, config/environment, user input/action outside the spec, dependency. Bad input that the system does not validate/clearly reject still counts as a code bug. Narrow by bisecting: disable/replace components one at a time, call the lower layer directly (API instead of UI, query instead of API) to know whether the bug is above or below the cut. For regressions, compare recent changes (`git log`/`git bisect`).
4. **Find the root cause**: form hypotheses, test each one, changing one factor at a time; distinguish root cause from symptom. Trace the cause back with successive "why" questions to a point fixable in code/config. Assign a **severity S1–S4** by impact ([checklist](references/checklist.md#severity)); if **security** is involved (authorization, data exposure, injection, XSS, authentication), switch to the [`review-web-security`](../review-web-security/SKILL.md) flow, never write exploit payloads into reports/logs.
5. **Minimal fix within scope**: create a regression test and confirm it fails because of the bug under study before fixing (assert the exact symptom, not just "an exception occurs"); if it cannot be automated, record how to check before/after. Fix the cause, no arbitrary workaround, no refactor outside scope, never disable tests or change expectations against the spec. If only asked to diagnose, report the cause and propose a fix.
6. **Verify**: rerun the failing case, normal and edge cases; for UI bugs capture an after screenshot at the same route/viewport to compare with the before one; regression test, related tests and appropriate lint/type check. Prove the test fails on base and passes on the fix with `bash .agents/skills/debugs/scripts/verify-regression.sh <base-ref> -- <test command>` (only exit 0 counts; read the log to be sure base fails on the right assertion, not an environment error). Prove the fix targets the real cause: temporarily remove only the bug-fix change and the regression test fails again; restore and it passes. Measuring (not only static review) is mandatory when the bug is reported as slow/resource-heavy, the fix changes queries/loops/cache on a hot path, or S1–S2 is load-related; otherwise every fix on a data-dependent flow checks N+1/loops per [`complexity-performance`](../complexity-performance/SKILL.md). Performance bugs are measured before/after under the same conditions and record at minimum: latency p50/p95, queries/request, CPU/RAM when measurable, with the measuring command/tool; if unmeasurable, state only static review was done. If it cannot be verified on the target environment, state it.
7. **Post-fix assessment**: confirm no new bugs arise; for production bugs, give a logs/monitoring plan and concise postmortem (timeline, origin, impact, prevention). Remove task-created temporary output after placing needed evidence in the task folder; keep user changes and update affected docs.

## Report

Use the `report` skill, [Debug](../report/assets/debug-report-template.md) template. Distinguish facts from hypotheses; unmet checklist items are recorded as limits; never report pass for checks not run.
