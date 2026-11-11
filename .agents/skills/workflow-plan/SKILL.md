---
name: workflow-plan
description: "Add the project's planning process to the existing Plan mode when the user asks for a plan; survey, design when needed, task/AC/test and handoff, no implementation."
---

# workflow-plan

## Combining with Plan mode

This is the shared planning process source, independent of a dedicated command. When the user asks for planning in Claude/Codex/Antigravity Plan mode, apply this skill with project guidance. May call `$workflow-plan` if needed; no custom `/plan` needed.

- Mode, write permission and answer format are decided by the runtime. The skill never toggles modes, simulates mode-switch tools or bypasses read-only via subagents.
- Never edit product code, install dependencies, migrate or commit/push while planning. Reuse still-valid handoffs/plans; never rerun analysis for the same input.
- If the native mode only allows reading or writing one dedicated plan file, follow that location/format; present the plan content in the permitted output, stating JSON/index are unsaved. When the runtime allows writing docs, save the handoff per the rule below before implementation. Never say saved when not written.

## Process by scope

1. Read the request and project guidance; read `docs/plans/index.json` if present, search by title/description/tags then open relevant files via path. Reuse `docs/requirement-analysis.md`/`docs/system-design.md` if still correct. Survey the affected stack, files and behavior; never dump the whole repo.
2. Research only when evidence is missing. System design only when new HLD/LLD/data model is needed; use the matching role and handoff files when the runtime allows. Never default to the full pipeline for small changes.
3. Use the [`planner`](../../agents/planner.md) role to produce requirement → task → AC → test, scope, dependencies, concrete files/behavior, execution order, rollback/risks and open questions. Assign subagents only when the workflow/scope needs it and the runtime supports it; otherwise plan sequentially in the role, never simulating delegation.
4. Review the plan when complexity/risk requires or the user asks. `reviewer` only lists findings; planner handles findings within plan scope. Briefly report what is settled/missing, never move to implement on your own.
5. When writing is allowed, save valid JSON at `docs/plans/<title-slug>-<yyyyMMdd>.json` per [`plan-format`](../../rules/docs.md#implementation-plan-contract), each task's `filesToChange` being verified paths. Update `docs/plans/index.json` with entries containing only `title`, `description`, `tags`, `path`. A native plan file is a draft; the JSON is the structured handoff, never keeping two conflicting requirement sources.
6. Output the Plan Summary via skill `report`, stating the real file-save status and verification. Use the runtime's approval/exit-Plan-mode point; implement only when the user and runtime have allowed it. Never add a confirmation round duplicating existing approval.
