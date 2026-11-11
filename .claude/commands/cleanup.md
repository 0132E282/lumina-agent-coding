---
description: Condense agent context, keeping goal/decisions/progress to continue within scope
---

Condense the agent's working information to avoid rambling and continue the right task. Do not scan/delete workspace files, Git history, config, long-term memory or deliverables. Temp-file cleanup remains the separate job of the `cleanup-temp-files` skill and is not triggered by this command.

1. Summarize once the context still in effect: goal/scope, decisions and user permissions settled, canonical files/handoffs, work done + verification evidence, in-progress changes, blockers/questions to answer and next step. Keep unfinished requests; never lose tasks or approvals after condensing.
2. Drop from the working context abandoned options, outdated info, repeated logs/dumps and irrelevant speculation. Use source paths instead of copying whole files; no secrets in the summary, do not create a handoff file unless asked to save.
3. If the runtime has a real context-compact mechanism and allows its use, use it with the summary; otherwise return the summary in chat and use it for the next step. Never claim history/tokens/memory were deleted or the session reset without a tool that does so. When the user wants a fully blank session, provide the handoff summary then use the runtime's new-session ability on request; do not simulate UI actions.
4. Report the real state: context was condensed or only a summary was created, goal/next step kept. Do not expand the task, rerun verified steps or re-ask decisions still in effect.
