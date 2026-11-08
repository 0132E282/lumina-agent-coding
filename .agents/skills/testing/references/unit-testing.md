# 🧪 Testing Strategy

Test code/helpers follow type, comment, DRY/SRP and readability in [`coding-standards`](../../coding-standards/SKILL.md). When running many modules/cases, keep full case accounting and lower concurrency only for dependency/state/rate-limit/resource reasons with evidence.

When black-box testing by module/feature and scheduling many modules, also apply [`testcase` section 7.1](./testcase.md#71-black-box-and-scheduling-at-execution).

The **technique layer for writing test code** when implementing — different from [`qa-tester`](../../../agents/qa-tester.md) (designs **business** test cases from specs). This skill does not care which business cases need testing, only how to write technically correct tests for one unit of code.

## Mandatory principles

- Test **behavior** (input/output), not implementation details — changing a function's internals without changing input/output must not fail the test.
- Bug fix → write a bug-reproducing test **first**, see it fail, then fix until it passes ([`rules/delivery`](../../../rules/delivery.md#quality-and-evidence)).
- Coverage by **risk**, not a fixed % — prioritize business logic/edge cases/money-and-sensitive-data flows, skip getters/setters/CRUD indirectly covered.
- Rule of Three for test fixtures/helpers ([`rules/coding`](../../../rules/coding.md#coding-principles)) — do not share from the 2nd repetition.

## Choosing test doubles

| Type | Use when |
|---|---|
| **Stub** | Only need fixed fake data, do not care how it is called |
| **Mock** | Need to confirm the interaction happened correctly (right function/params/count) |
| **Fake** | Need a lightweight implementation that works for real but is unfit for production (in-memory DB instead of SQL) |
| **Spy** | Run real behavior **and** record calls to check later |

Double only **unknown/uncontrolled** dependencies (real I/O, `Date.now()`, random numbers, changing env). Test pure internal logic directly — over-mocking leaves tests only re-confirming the mock ([`rules/coding`](../../../rules/coding.md#kiss-yagni-and-scope)).

## Test structure

**Arrange–Act–Assert**: test name describes behavior + condition (`should_X_when_Y`, not implementation); each test focuses on one behavior concept, unrelated behavior gets a separate test.

## Black-box and per-feature parallel runs

When testing by module/feature, apply [`testcase` section 7.1](./testcase.md#71-black-box-and-scheduling-at-execution) as the standard source for black-box design, scheduling all modules, splitting cases and reconciling results.

## Signs of a bad test

- Always passes even when the code is wrong (no real assert, or an obviously true assert).
- Flaky due to `Date.now()`/`Math.random()`/unseeded run order/isolation.
- Depends on state from another test run earlier (fails when order changes).
- So much mocking that it only re-confirms the mock itself.

## When to apply

- After writing/changing new logic that needs technical tests, or right after a bug fix (regression test).
- When reviewing existing tests suspected fake/flaky — check against the "Signs" section above.
- Not for business test case design (→ `qa-tester`) or choosing architecture patterns (→ [`design-patterns`](../../design-patterns/SKILL.md)).
