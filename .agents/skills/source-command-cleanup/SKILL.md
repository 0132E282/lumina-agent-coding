---
name: "source-command-cleanup"
description: "Trim agent context, keeping goal/decisions/progress to continue within scope"
---

# source-command-cleanup

Use this skill when the user asks to run the migrated source command `cleanup`.

## Command Template

Trim the agent's working information to avoid drift and continue the right task. Do not scan/delete workspace files, Git history, config, long-term memory or deliverables. Temp-file cleanup remains the separate `cleanup-temp-files` skill and is not triggered by this command.

1. Summarize once the still-valid context: goal/scope, decisions and user permissions already settled, canonical files/handoffs, work done + verification evidence, in-progress changes, blockers/questions needing answers and next step. Keep unfinished requests; never lose tasks or approvals when trimming.
2. Drop from the working context abandoned options, outdated information, repeated logs/dumps and irrelevant speculation. Use source paths instead of copying whole files; never put secrets in the summary, never create a handoff file unless asked to save one.
3. If the runtime has a real context-compact mechanism and allows it, use it with the summary; otherwise return the summary in chat and use it for the next step. Never claim history/tokens/memory were deleted or the session reset without a tool that does it. When the user wants a fully blank session, provide a handoff summary then use the runtime's ability to open a new session as requested; do not simulate UI actions.
4. Report the real status: context trimmed or only a summary created, the goal/next step kept. Do not expand the task, rerun verified steps or re-ask still-valid decisions.
