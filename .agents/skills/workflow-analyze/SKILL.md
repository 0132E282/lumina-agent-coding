---
name: workflow-analyze
description: "Analyze raw requirements (text/image/PDF/DOCX...) at PM level — purpose, what to do, where it impacts — then propose the next step (plan or assign directly to coder)"
---

# workflow-analyze

No separate analyze command needed. When the user asks to analyze requirements, read the [`analyst`](../../agents/analyst.md) role and apply its scope: clarify why/what/where and classify as new task or small change. Never design the system, split implementation tasks or edit code.

Reuse still-valid handoffs; if writing is allowed, save `docs/requirement-analysis.md` per the role and output a report. Native Plan mode with write limits uses the permitted output and reports the handoff as unsaved. Propose Plan mode + `workflow-plan` next, or direct implementation per existing request/permissions; never run the full pipeline or re-ask approvals already given.

Delegate only when the request/workflow needs it and the runtime supports it; otherwise proceed sequentially in the same role, never simulating agents/tools. This skill is an option when separate analysis is needed, not a mandatory step before every task.
