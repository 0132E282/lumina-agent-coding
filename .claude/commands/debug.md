---
description: "Debug and fix bugs per the debugs skill: reproduce, root cause, regression test, fix via coder, Debug report"
argument-hint: "[bug description | log | URL | issue]"
---

Debug and fix: $ARGUMENTS

- Read and follow the [`debugs`](../skills/debugs/SKILL.md) skill and the [`bug-fix`](../rules/bug-fix.md) rule: determine expected/actual, reproduce, collect evidence, localize, root cause.
- If the bug description is missing, use the bug being discussed in the session; if none, ask one question before starting.
- Diagnose in the main session; delegate the code fix to the `coder` agent with the root cause, `file:line` and a regression test that must fail before the fix. If only diagnosis is requested ("debug only", "don't fix yet"), stop at the cause and fix proposal.
- Database/production is read-only; read production logs via the connected MCP per [`search-priority`](../rules/search-priority.md).
- Report with the `report` skill, Debug template. Never commit/push on your own. Codex uses the equivalent `$workflow-debug`.
