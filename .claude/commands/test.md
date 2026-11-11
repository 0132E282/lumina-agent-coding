---
description: Test a feature per plan, repository or PR; save testcases/results and Big O to testcase.json
argument-hint: "[feature|repo [branch]|pr [URL|#number]]"
---

Assign the `qa-tester` agent to test: $ARGUMENTS

## Scope

- `/test` or `/test <feature>`: by default test the features/tasks in the plan currently assigned. Read `docs/plans/index.json` if present, open the right plan via path and take the settled REQ/AC/task/files; never rerun planning. No plan → use the current task's request and verified code; multiple plans or missing scope → ask before dependent cases.
- `/test repo [branch]`: test the repo's features, default current branch; a specified branch must be verified by ref/SHA, never checkout over the working tree on your own. Follow real code/contract, record untested parts.
- `/test pr [URL|#number]`: test behavior changed in the PR and related regression by base/head SHA. Missing target → use the current branch's PR; multiple/none → ask. Never create a PR, merge or edit code on your own.

## Data and verification

- Default save to `testcase.json` at the **root of the repository under test**, per the [template](../skills/workflow-test/assets/testcase-template.json). Read the existing file first, keep ID/history; read the old `docs/testcases/index.json` if present to reuse related cases, never write back to both sources or delete old data on your own. A path explicitly specified by the user takes priority.
- New suites/cases have `title`, `createdAt`; unrun cases are `Not Run`. Each execution records `executedAt`, scope/SHA, status, actual result, evidence and bug ID; keep history. Pass/Fail only when executed with evidence, if environment is missing then Blocked/Not Run with reason. The template is a skeleton, never store placeholders as verified data.
- Design cases via equivalence partitioning/boundary values/decision table/state transition; store REQ/AC → case, total cases/allocation/results and coverage. Run the existing runner within the assigned scope, never install dependencies or use a real database to write data beyond permission.
- `algorithmComplexity` is recorded per the algorithm/flow tested: input `n`/`m`, time/space Before–After, allocation, preprocessing, query/API/I/O, basis/evidence and limits. Use the `complexity-performance` skill; with a database add `database`. Only record Before when real code/baseline exists; otherwise null with reason. Static analysis is not a benchmark; never infer Big O from testcase counts. No related algorithm/runtime → `applies: false` and reason `Not applicable — no input-dependent algorithm/runtime`.
- The agent traces results, reports bugs/risks via the `report` skill; never implements features or edits the application to make tests pass.
