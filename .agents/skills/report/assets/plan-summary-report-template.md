# Plan report template

Use right after `planner` writes the plan JSON in `docs/plans/`, before awaiting approval. Text, no tables, no code fence, no `Description`; do not copy the plan verbatim.

- One section per task, opened by a separator line; bullets state the work.
- `Status` uses exactly `TODO | IN_PROGRESS | BLOCKED | DONE`.
- UI task: add `URL:` (route) and `Evidence image:` when available. API task: add `API:` when actually run.

`------------------------`

Task: TASK-001 — Name stating the outcome
Status: TODO
File: path/to/file.ext

- Work item 1
- Work item 2

`------------------------`

**Overview**: REQ [N] | Task [N] (P0 [n], P1 [n], P2 [n]) | Open questions [N] | Risks [N]. Plan: `docs/plans/<title-slug>-<yyyyMMdd>.json`.

**Open questions** (omit if none; one section per question per [report](../SKILL.md#open-questions)):

Question 1: [content]
Proposal: [default, or "User must decide"]

**Main risks**: [risk + mitigation, or `None`]

**Next step**: Wait for the user to settle open questions and approve the plan; then assign `coder` per `executionOrder`.
