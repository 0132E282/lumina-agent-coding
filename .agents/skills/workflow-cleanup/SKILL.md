---
name: workflow-cleanup
description: "Trim agent context, keeping goal/decisions/progress and next step; does not clean workspace files."
---

# workflow-cleanup

Read the source `.claude/commands/cleanup.md`; Claude uses `/cleanup`, Codex uses `$workflow-cleanup`. Trim context and keep requirements/decisions/evidence/next step, using the runtime's real compact ability if available. If only a summary is created, report exactly that status, never simulating a memory reset. No delegation just to trim context, never delete files or call the workspace-cleanup skill. Never save a handoff unless asked.
