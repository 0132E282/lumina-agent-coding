---
name: workflow-report
description: "Use when calling $workflow-report or /report to re-output existing results."
---

# workflow-report

Read skill [`report`](../report/SKILL.md) and rule [`mandatory-report`](../../rules/delivery.md#mandatory-reporting), format existing results/changes per the right report type. Reporting is a mandatory step when a task has results, not waiting for a report command; this skill is only a separate way to invoke it when existing results need re-output, performing no new review. Claude uses `/report`, Codex uses `$workflow-report`. Code with runtime processing uses complexity-performance before the report; pure config/docs/template drops the Big O line. Never invent verification.
