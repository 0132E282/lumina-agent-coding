---
description: "Re-export the result of an existing task."
argument-hint: "[task/scope]"
---

Export a report for scope: $ARGUMENTS. With no argument use the task just completed in the current repo; with an argument use only existing results within that scope. If data is missing, state it clearly, never run a new task/review/test on your own.

Read and use the [`report`](../skills/report/SKILL.md) skill, per the rule [`mandatory-report`](../rules/delivery.md#mandatory-reporting). Keep the report short, genuinely verified. Default to chat, never save a file/post externally or commit on your own. Codex uses the equivalent `$workflow-report`.
