---
name: workflow-debug
description: "Debug and fix bugs when calling $workflow-debug, /debug, or when the user says fix a bug, defect or wrong behavior."
---

# workflow-debug

Read the source `.claude/commands/debug.md` and skill [`debugs`](../debugs/SKILL.md); Claude uses `/debug`, Codex uses `$workflow-debug` with the same argument. The keywords `sửa`/`fix` aimed at a bug or wrong behavior also invoke this flow without a command. Diagnose per `debugs`, fix via the [`coder`](../../agents/coder.md) role, report with the Debug template of skill `report`; never commit/push on your own.
