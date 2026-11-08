---
name: workflow-test
description: "QA by feature/plan, repo or PR; save testcases/results and algorithm complexity into testcase.json."
---

# workflow-test

Read the source `.claude/commands/test.md` and the role `.claude/agents/qa-tester.md`; Claude uses `/test`, Codex uses `$workflow-test` with the same argument. Default is the feature/task in the assigned plan; `repo [branch]` tests the repo, `pr [URL|#number]` tests the PR and related regression. Never redo the plan or fix the application.

Default output is `testcase.json` at the repo root per the [template](./assets/testcase-template.json), not a docs menu. Keep IDs/history, reuse cases from an old index if present without creating two result sources. This path takes priority over the QA role/skill's default docs storage when running this workflow. Unrun cases are `Not Run`; each execution has time, status and real evidence (image or API per [`testcase` section 7.2](../testing/references/testcase.md#72-evidence-and-api-results)); APIs go in `executions[].apiChecks`, one `Correct`/`Incorrect` entry per endpoint.

Record `algorithmComplexity` using complexity-performance (database when queries exist): Before/After time/space/allocation/preprocessing, input, I/O, basis, evidence and limits. Without benchmarks report static; unknown is null with a reason, no relevant runtime is N/A.

Assign qa-tester when the runtime supports it per workflow; otherwise work sequentially in the same role and report the limit, never simulating agents/checks. Use skill `report` on completion.
