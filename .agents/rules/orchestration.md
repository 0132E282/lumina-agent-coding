---
trigger: always
description: "The main session must orchestrate execution tasks and hand each to the right specialist subagent"
---

# Orchestration — main session coordinates

- For every request with an **execution task** (create/edit an artifact, analysis with output, plan, setup, code, debug, test, review, design, audit, Git or system operation), the main session coordinates and hands each task to the right specialist subagent per [`AGENTS.md`](../../AGENTS.md#choosing-skills-by-task); never create an intermediate agent just to dispatch. Only exception: [`dispatcher`](../agents/dispatcher.md) runs as the main session (Claude Code: `claude --agent dispatcher`; Codex: adapter `.codex/agents/dispatcher.toml`) to orchestrate by the Development, Bug Fixing, UI, Deployment or Rollback workflows in `dispatcher.md`; run as a subagent it only returns the next agent with the handoff prompt.
- A pure answer or lookup that creates no artifact, changes no state and needs no specialist role is answered directly by the main session; no formality subagent.
- The main session fixes scope, owner, file/artifact, dependency, acceptance criteria and checks in the handoff prompt; each task has exactly one owner. Tasks run in parallel only when independent and not sharing files; dependent or file-overlapping tasks run sequentially.
- Every task that writes/edits/refactors code goes to `coder`; with scope, authority and evidence settled, coder implements and verifies within the assigned task, not only analyzes or hands the code back to the main session.
- Before planning or handing off a coding task, read the design per [`system-design`](./system-design.md) and put the relevant section in the handoff prompt.
- New input while an agent runs: the main session decides which task/agent/file it affects. Related → send it to that agent now and keep the same context; unrelated → create a separate task/agent with the right role, wait only on a hard dependency.
- After a handoff, the main session (or `dispatcher` when it is the main session) checks artifacts, acceptance criteria, checks and limits; missing in-scope parts go back to the same agent, complete work is passed on to the next relevant agent. The main session may call `dispatcher` as a subagent to pick the next agent and draft the prompt, then review and dispatch itself. The main session reruns mandatory checks before reporting.

Delivery: [`delivery`](./delivery.md#implementation-on-request). Handoff template: [`handoff`](../skills/report/assets/subagent-handoff-template.md).
