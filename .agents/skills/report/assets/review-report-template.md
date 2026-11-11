# Review Report Template

Use to present existing review/audit findings from code/diff, plan or test case. Text report; no pipe-table for review findings.

-------------

## Finding

```text

-------------

File: path/to/file.ext:line
Type: Issue | Suggestion | Good
Severity: CRITICAL | WARNING | SUGGESTION | GOOD
Result: Correct | Incorrect
Big O:
  Time Before: O(...)
  Time After: O(...)
  Space Before: O(...)
  Space After: O(...)
  Input: n = [...], m = [...]
  Query/API/I/O: [... or N/A]
Details: [current state, triggering conditions and evidence]
Proposal: [concrete fix and trade-off]
Verification: [benchmark, test, query log, profiler or Not measured]
```

-------------

## Conventions

- `Type: Issue` is for problems to fix; `Suggestion` for optional hints; `Good` for points worth keeping or replicating.
- `Result` is only `Correct` or `Incorrect` per [`rules/review`](../../../rules/review.md), no other values.
- `Severity` uses exactly `CRITICAL`, `WARNING`, `SUGGESTION` or `GOOD`.
- For code review with data-dependent processing, Big O must record Before/After, `n`/`m`, space and preprocessing if any. No basis or unrelated to runtime: write `N/A — not applicable`.
- Never claim performance improvement without benchmark/profile/query log.
- For plans use `REQ-xxx`/`TASK-xxx` at `File`; for test cases use `TC-xxx`.

-------------

## Final stats

```text

-------------

Issues to fix: [X]
Suggestion: [Y]
Good: [Z]
Result Correct: [D]
Result Incorrect: [S]
```
