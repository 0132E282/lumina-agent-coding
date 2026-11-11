# Test Report Template (digest)

Use to summarize results **designed/executed** by agent [`qa-tester`](../../../agents/qa-tester.md) into a short copy-pasteable version for PR/commit — does not replace the coverage matrix, detailed test case template or full bug report that `qa-tester` produced separately.

```markdown

## ✅ Test report

**Scope**: [feature/flow tested]

- **Unit Tests** (`[command]`): [X]/[Y] test suites PASS ([n]/[m] tests pass).
- **Linter** (`[command]`): [N] errors (clean if 0).
- **Build** (`[command]`): [build result, or drop this line if the task needs no build].

### Handled Testcase / Bug list

**`TC-xxx` / `BUG-xxx`** (P1/P2/P3) — Pass | Fail | Blocked | Skipped | Not Run
- Problem: [observed wrong behavior]
- Cause & fix: [root cause + fix, with `file:line`]
- Evidence: [image `.agents/storage/evidence/<task-slug>/...png` or `API-xx`]

### API (only when testing API — one section per API, nothing generic)

**API-01** `METHOD https://host/real/path` — Result: Correct | Incorrect
- Parameters: `path`/`query`/`body`/`header` sent (secret/PII masked) — Correct | Incorrect vs contract
- Expected: status [xxx], main fields/types [...]
- Actual: status [xxx], real response (trimmed) [...]
- Where incorrect (only when Incorrect): [which status / field / type / value / parameter]

### Remaining risks
- [Flows/edge cases not tested and why — never write "tested" when not run]
```

No tables (mobile reading); one section per case as above. Every Pass/Fail case needs an `Evidence` line (image or real API) per [`testcase` section 7.2](../../testing/references/testcase.md#72-evidence-and-api-results); API only has `Result: Correct | Incorrect`. Not executed → state "Tests not executed", never infer Pass from finished design. The "Cause & fix" line is filled only when the fix is truly confirmed (no guessing); each item must trace back to the original `qa-tester` test case/bug report when needed.
