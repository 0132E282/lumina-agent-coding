# Delivery and handoff rules

## Implementation on request

- Implementation/fixes must follow the [`coder`](../agents/coder.md) role, the right task/plan, and approved dependencies and files/behavior.
- Before handoff, remove out-of-scope hunks, verify affected flows, sync repo docs/testcases and use [`report`](../skills/report/SKILL.md); never self-review/commit.

Order of reading plan, implementing, verifying and handoff: [`workflow-implement`](../skills/workflow-implement/SKILL.md).

## Quality and evidence

- Checks proportional to risk/scope; static analysis is mandatory before reporting completion unless the user explicitly declines.
- Never record Pass/Fail or claim a tool/check ran without execution and evidence; executed testcases must have images or real API request/response, APIs record each endpoint/parameter `Correct | Incorrect` per [`testcase` section 7.2](../skills/testing/references/testcase.md#72-evidence-and-api-results).
- Before handoff, check final newline on changed text files, `git diff --check`, diff/out-of-scope, regression, render/state/effect loops and N+1 on affected flows; if unmeasurable, state static review only.
- Errors caused by the diff or within scope must be fixed and rechecked; pre-existing out-of-scope errors: only report location/impact and ask permission.
- Bug fixes follow [`rules/bug-fix`](./bug-fix.md); respect requests not to run tests/checks.

Commands, checklists and artifacts: [`testing`](../skills/testing/references/unit-testing.md), [`workflow-test`](../skills/workflow-test/SKILL.md), [`workflow-review`](../skills/workflow-review/SKILL.md). Black-box testing per module: [`testcase`](../skills/testing/references/testcase.md#71-black-box-and-scheduling-at-execution).

## Mandatory reporting

- Every agent must use [`report`](../skills/report/SKILL.md) when completing a task with concrete changes/results; pure lookups do not apply.
- A whole plan/task group has only one final consolidated report, after all tasks/AC/mandatory checks have evidence; subagents only do an internal handoff per the [handoff template](../skills/report/assets/subagent-handoff-template.md), never call `report`.
- A whole plan/task group must be done to the end of scope; with TODO/IN_PROGRESS remaining, unmet AC (never lower AC yourself) or mandatory checks Fail/Blocked/Not Run, do not claim completion, only report the concrete blocker. Repo testcases requested as `Not Run` design are not executed checks.
- A report presents only final results already obtained (changes, check results, limits), never narrates process or subagent progress, does not replace review/analysis/test and never turns environment errors into Pass.

Timing, type selection, format and the `Token:`/`Waste issue:` lines: [`report`](../skills/report/SKILL.md); entry point: [`workflow-report`](../skills/workflow-report/SKILL.md).
