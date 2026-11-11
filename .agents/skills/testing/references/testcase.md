# 🧪 Test Case Writer

When designing or executing black-box tests by module/feature, apply [section 7.1](#71-black-box-and-scheduling-at-execution).

Skill for writing **structured test cases** for a specific behavior/flow, used right in the current session. Different from agent [`qa-tester`](../../../agents/qa-tester.md) — that agent runs the whole process (broad requirement analysis, P0–P3 risk assessment, execution, bug report, handoff) for a feature; this skill is the technical layer "right format, right technique" when only a few quick test cases are needed, without spawning a separate agent. Shares fields/format with `qa-tester` so the two stay compatible.

## 1. Goal and scope

Write test cases for UI, API, business logic, database or the whole system. Define the scope clearly before writing — one specific flow/API/bug, never default to expanding to the whole feature.

## 2. When to use

New feature, requirement change, bug fix (write a bug-reproducing test **before** the fix — [`rules/delivery`](../../../rules/delivery.md#quality-and-evidence)), or adding cases to the regression suite.

## 3. Inputs

Read before writing: spec/acceptance criteria, UI design, API contract, user roles, business rules. Missing any → apply section 9, never invent.

## 4. Analysis process

Identify: main flow, alternate flows, error conditions, related business states, data/integration/order dependencies.

## 5. Test design techniques

Choose techniques by problem, never add cases just to raise the count ([`rules/coding`](../../../rules/coding.md#kiss-yagni-and-scope)):

| Technique | Use when |
|---|---|
| Equivalence partitioning | Groups of valid/invalid data |
| Boundary values | Just below, at, just above limits (numbers, Unicode, timezone) |
| Decision table | Combinations of conditions/permissions/business rules |
| State transition | Valid/invalid transitions, repeated actions, end states |
| Pairwise | Many combinations, risk allows fewer cases — does not replace mandatory business combinations |
| Risk-based testing | Prioritize high-impact/high-likelihood cases when time is limited |

## 6. Test scope

Happy path, invalid data, permissions, system/integration errors, data integrity (rollback, unique, soft delete), concurrency if relevant (idempotency, race condition).

## 7. Output format

Each test case requires these fields:

| Field | Meaning |
|---|---|
| ID | Unique code, e.g. `TC_LOGIN_001` |
| Requirement ID | Requirement/acceptance criterion being verified |
| Title | Short description of the behavior to test |
| Priority | High / Medium / Low |
| Preconditions | System state before running |
| Test data | Data and accounts used (fake data, no real secrets/PII — [`rules/backend`](../../../rules/backend.md#data-safety)) |
| Steps | Concrete numbered actions |
| Expected result | Observable, verifiable result — tied to the matching step/checkpoint |
| Postconditions / Cleanup | State after the test and how to clean data if newly created |

When **recording executed results** (not just design) → add: Actual result, Status (Pass/Fail/Blocked/Skipped/Not Run), Evidence/Bug ID. Write Pass/Fail only when executed with evidence — newly designed tests are Not Run ([`rules/delivery`](../../../rules/delivery.md#quality-and-evidence)).

## 7.1. Black-box and scheduling at execution

- Evaluate from requirement/contract, input, observable output and allowed side effects; never use internal implementation to decide Pass/Fail.
- Every case must trace to a requirement and expected input/output; all modules/cases in scope must be scheduled and reconciled fully, none skipped or run twice.
- Total Pass/Fail/Blocked/Skipped/Not Run must fully explain the input.
- The helper must check `allocated = total input cases`, no duplicate IDs, and record all of `Pass/Fail/Blocked/Skipped/Not Run` after each batch.
- If no framework/runner supports it, only state the batch plan and `Not Run` status; never add dependencies to create parallel runs.

## 7.2. Evidence and API results

- Every executed case (Pass/Fail) must have real evidence: screenshots for UI (stored in `.agents/storage/evidence/<task-slug>/`, per [`rules/frontend`](../../../rules/frontend.md)) or real API request/response for API. No evidence means no Pass/Fail.
- Never write generic API results ("API works normally", "APIs OK"). Each API is its own section with:
  - Full `METHOD URL` (real path, not `/api/...`).
  - Parameters sent: path/query/body/header (secret/PII masked), and whether each parameter is correct or incorrect vs the contract.
  - Expected per contract: status, main fields/types.
  - Actual: status and real response (trim irrelevant parts).
  - `Result: Correct | Incorrect`, no other values. `Incorrect` must state where: which status, field, type, value or parameter.
- An API that could not be called gets no Correct/Incorrect; the case stays `Blocked`/`Not Run` with the reason.

## 8. Quality criteria

- Executable: concrete steps, not vague ("check the form works" is not a step).
- Verifiable expected result — never write "works normally", "displays correctly", "shows a valid error" without concrete criteria.
- No duplication — different cases must test different behavior, not just meaningless data changes.
- Traceable to requirements — Requirement ID matches real docs/API contract, never invent IDs without a source.

## 9. When information is missing

State the assumption in use. A gap directly affecting the expected result → ask before marking the case Ready; if you cannot ask right away, mark Draft/TBD, never fill in business logic to finish the case ([`rules/coding`](../../../rules/coding.md#coding-principles), [`rules/search-priority`](../../../rules/search-priority.md): never invent unconfirmed rules/thresholds/error messages).

## 10. Saving testcases and results

- Before creating or updating a testcase suite, read `docs/testcases/index.json` if it exists; it is testcase and result data, not a file index.
- Save cases, traceability matrix and execution status in `docs/testcases/index.json`, keeping IDs stable. Add cases to the existing suite instead of creating duplicates.
- New suites and cases have `title` and `createdAt` as `YYYY-MM-DD`; each run has `executedAt` in ISO 8601. Each case has a run-result area with `status`, `actualResult`, `evidence` (`screenshots`, `apiChecks` per [section 7.2](#72-evidence-and-api-results)) and `bugId` when any. New cases are `Not Run`; write `Pass`/`Fail` only after running and storing evidence. Keep run history if the current schema has history.
- After updating testcases or results, parse the JSON and reconcile case count, unique IDs, traceability and status.

### Repository-level testcases

- When coding for all tasks of a completed implementation plan, create a repo-level testcase doc at `docs/repo/<title-slug>-<yyyyMMdd>.md`; content based on code, routes, APIs and real flows verified in the repository.
- Read `docs/repo/index.json` first to avoid duplicate repo testcases; open the pointed Markdown files when relevant. If the menu does not exist, create an empty JSON array then add the new entry.
- Write testcases per the section 7 structure. Unrun results are `Not Run`; write Pass/Fail only when executed with evidence.
- Add/update the entry in both `docs/repo/index.json` and `docs/index.json` with exact `title`, `description`, `tags`, `path`. `docs/repo/index.json` is a sub-index, never embed testcase content in the index.
- Auto-creating the doc after coding only designs testcases, never runs tests. Execute only when the user requests it or the test workflow is assigned.
- This convention is for repository-level testcases; feature-level suites and result history still live in `docs/testcases/index.json`.

If a test case is reviewed independently, the review report belongs in `docs/reviews/` per workflow-review; testcases and run status stay in `docs/testcases/index.json`.

## When to apply

- Need to quickly write a few test cases for a specific feature/API/bug right in the current session.
- Not for designing + executing a whole test suite with risk assessment, REQ→AC coverage matrix and full bug reports for a large feature — assign to agent [`qa-tester`](../../../agents/qa-tester.md).
