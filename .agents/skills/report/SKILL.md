---
name: report
description: "Report existing results when a task completes or on /report, $workflow-report. Does not review or analyze code itself."
license: MIT
metadata:
  version: "1.7"
---

# Report

When scope is a whole plan or group of coding tasks, merge internal handoffs, plan changes and verification into **one final report after all assigned tasks complete**. Before that, only short progress updates; no report between tasks. The final report merges changes by file, task/AC status, real checks, limits (Big O goes in each file's section); do not repeat per-agent reports. Not finished due to a blocker needing the user: report the blocker and the remainder, never a DONE conclusion. `/report` before completion outputs only the incomplete status, never a fake completion report.

Present only existing results/diffs; do not hunt bugs, review, test or assess code. Default to concise, follow the template; keep required fields. Applies per [mandatory-report](../../rules/delivery.md#mandatory-reporting) and [quality-assurance](../../rules/delivery.md#quality-and-evidence).

## Choose template

| Type | Input and timing | Template |
|---|---|---|
| Change/commit | Diff after Edit/Write or before drafting a commit | [Change](./assets/change-report-template.md) |
| Plan | Plan JSON just completed, before awaiting approval | [Plan](./assets/plan-summary-report-template.md) |
| Review | Existing findings from code, plan or testcase review | [Review](./assets/review-report-template.md) |
| Security | review-web-security result | [Security](./assets/security-review-report-template.md) |
| Dependency | dependency-audit result | [Dependency](./assets/dependency-audit-report-template.md) |
| Test | QA result designed/executed | [QA digest](./assets/qa-test-report-template.md) |
| Debug | Diagnosis/fix per skill debugs | [Debug](./assets/debug-report-template.md) |
| Bug/Feedback | Found during work | [Feedback](./assets/bug-feedback-report-template.md) |
| Internal handoff | Subagent returns result to orchestrator (not sent to user) | [Handoff](./assets/subagent-handoff-template.md) |

## Requirements by type

- **Change**: the template is the format source of truth; state only actual changes and the problem solved, do not re-describe files. Data-dependent code uses [complexity-performance](../complexity-performance/SKILL.md); query/database combine with [database](../database/SKILL.md). Keep verification, limits, assessment; `Big O:` in a file section only for data-dependent code, drop the line for rule/skill/docs/config. UI/frontend changes add `URL`/`Evidence image` per [`rules/frontend`](../../rules/frontend.md); API changes add `API:` (real request + response, matching expectation). Add old/new code only when requested. Final results only; no process narration (test-first, attempts, which subagent did what). End the report with `Token:` if the `report-usage` hook supplied real transcript numbers when this skill was invoked, and `Waste issue:` only if the hook listed violations; otherwise omit, never write N/A, `None found` or estimates.
- **Plan**: summarize REQ/task/open question/risk counts, main risks and next step; do not copy the whole plan. One section per task `Task/Status/File` + bullets, no `Description`; open questions per [Open questions](#open-questions).
- **Review**: text, no pipe-table; keep the template's fields and stats. Severity: CRITICAL (severe logic/security/crash), WARNING (code smell/performance/edge case), SUGGESTION (suggestion), GOOD (strength). Data-dependent code records time/space Before/After, input, query/API/I/O and preprocessing; outside runtime write N/A.
- **Security**: keep all nine fields per [review-web-security](../review-web-security/SKILL.md), including `Result: Correct | Incorrect`, exploit conditions and CWE/OWASP; do not merge into a normal review.
- **Dependency**: keep package, severity, current version → fix, change type and suggested command; never run fix commands.
- **Test**: summarize QA results only; does not replace the coverage matrix or detailed bug report, never guess Pass/Fail.
- **Debug**: follow the template; keep severity, origin, root cause, regression test and verification; UI images, performance measurements, security, postmortem only when applicable. Changed files listed per the Change template.
- **Feedback**: `Title: [Type] title`, `URL: location or undetermined`, then bullets on symptom/how found/handling status. Type is free; does not replace QA bug reports or the SendFeedback tool.

Separators and layout follow the matching template. Report after the source work completes; write feedback as soon as found.

## Mobile and desktop display

Reports must read on narrow screens (~40 chars) and desktop, no horizontal scroll:
- No tables (pipe-table) in reports; use labels + bullets.
- Separator line is 24 `-` chars; code fences hold only short lines (≤ 60 chars), no long commands/JSON in a fence.
- Links show short labels (line numbers, file name), never long absolute paths as text.
- One idea per bullet; paragraphs max 2–3 sentences; key numbers (Pass/Fail, error counts) at line start.

## Open questions

- With 2 or more open questions needing user decisions: text, no table. One section per question `Question:` / `Proposal:` (add `Impact if wrong:` for high risk — money, data loss, permissions), separated by a 24 `-` line inside inline code (never bare `---`, which Markdown renders as a short rule), as in the example:

`------------------------`

Question 1: content
Proposal: default

`------------------------`

- With only 1 question, ask directly. Does not apply to `AskUserQuestion` or runtime tools with their own question UI.
