# QA templates and examples

Templates for `qa-tester`: scope selection checklist, coverage matrix, test case template, execution record, bug report template and illustrative example. Open when drafting the matching artifact.

## Scope selection checklist

Apply only relevant items; write N/A and the reason when needed.

| Group | What to check |
|---|---|
| Functionality | Main, alternate, exception flows, results and calculation rules |
| Validation | Required, data type, format, length, boundary values, null and empty |
| Permissions | Not logged in, wrong role, per-record permission, tenant, direct API access |
| API | Method, path, header, schema, status per contract, errors, pagination, filtering and sorting |
| Data | Relational integrity, unique, rollback, state sync, soft delete |
| Concurrency | Repeated clicks/submits, race condition, idempotency if the contract requires |
| Integration | Timeout, service errors, retry, duplicate or out-of-order webhooks if relevant |
| Time | Timezone, period start/end, expiry dates and rounding rules |
| UI | Responsive, keyboard, focus, messages, loading and empty states |
| Security | Unauthorized access, data exposure, input handling and session within assigned scope |
| Performance | Workload, environment, metrics and agreed thresholds; without thresholds do not conclude pass |

For Laravel/backend, consider Form Request validation, middleware/policy, Sanctum if used, Eloquent relations, transaction, queue, cache and soft delete — see [`rules/backend.md`](../../../rules/backend.md#data-safety) (transaction, backend authorization). Include in scope only when the project actually uses them.

## Coverage matrix

| Requirement ID | Content / source | Scenario | Test case IDs | Risk | Design status |
|---|---|---|---|---|---|
| REQ-001 | [Requirement and source] | [Scenario] | TC-MODULE-001 | P1 | Ready / Draft / Missing |

Never treat requirement coverage ratio as evidence of comprehensive testing. Distinguish design coverage from executed results.

## Detailed test case template

```
### TC-MODULE-001 — [Behavior to verify]
- Requirement ID / source: [...]
- Module: [...]
- Goal: [...]
- Test type / technique: [...]
- Priority: P1 — [reason]
- Preconditions: [...]
- Test data / fixture: [...]
- Design status: Ready | Draft
- Execution status: Not Run

| Step | Action | Expected result |
| --- | --- | --- |
| 1 | [Concrete action] | [Observable result] |
| 2 | [Concrete action] | [Observable result] |

- Postconditions: [...]
- Cleanup: [...]
- Dependencies / assumptions: [None or specific]
```

With a summary table, still keep all steps and expected results; never merge into a vague title. For automation, convert cases to test code using the project's existing framework; never add dependencies unless needed.

## Execution record

| Execution ID | Test case ID / revision | Build / environment | Time | Status | Actual result | Evidence | Bug ID |
|---|---|---|---|---|---|---|---|
| RUN-001 | TC-MODULE-001 / v1 | [...] | [...] | Not Run | Not executed | — | — |

Status conventions:

- **Not Run**: not run yet.
- **Pass**: run, all mandatory checkpoints met.
- **Fail**: run, some checkpoint missed the confirmed expected result.
- **Blocked**: cannot complete due to missing conditions or a blocking bug; state the reason.
- **Skipped**: deliberately not run this time; state the reason.

## Bug report template

```
### BUG-MODULE-001 — [Triggering condition + wrong behavior]
- Test case / Requirement ID: [...]
- Build / environment / browser: [...]
- Severity: Critical | Major | Minor | Trivial — [impact]
- Priority: [per project convention; a proposal if not settled]
- Preconditions and data: [...]
- Reproduction steps:
  1. [...]
  2. [...]
- Expected result: [..., cite source]
- Actual result: [...]
- Frequency: [times reproduced / attempts, or undetermined]
- Evidence: [images, responses, logs with sensitive data masked]
- Impact: [...]
- Cause hypothesis: [optional; never presented as a conclusion]
```

Severity is impact level; priority is handling order. Never conclude every security bug is Critical without assessing impact.

## Illustrative example

This example uses a mock spec and does not automatically apply to real projects:

- `REQ-DEMO-001`: `POST /api/products` requires `name` as a 1–100 char string, `price` as a non-negative integer; valid data returns HTTP 201.
- `REQ-DEMO-002`: Only admins may create; a logged-in user without permission gets HTTP 403 and no record is created.
- `REQ-DEMO-003`: Invalid data returns HTTP 422, the response has `errors` by field name and no record is created.

**TC-PRODUCT-001 — Reject product creation when price is negative**

- Requirement ID: REQ-DEMO-001, REQ-DEMO-003.
- Module: Product API.
- Goal: verify `price` validation and no data written when the request is rejected.
- Test type / technique: API negative / boundary value `-1` of a non-negative integer.
- Priority: P1 — protects product data validity.
- Preconditions: test environment; admin logged in; name `QA_PRICE_NEG_001` does not exist; read access to test data for cross-checking.
- Data: `{"name":"QA_PRICE_NEG_001","price":-1}`; use a test token, never write the token in reports.
- Design status: Ready.
- Execution status: Not Run.

| Step | Action | Expected result |
|---|---|---|
| 1 | Send `POST /api/products` with the JSON above, admin auth header and `Accept: application/json` | HTTP 422; response has `errors.price` with at least one validation message |
| 2 | Cross-check `products` data with a read-only query by fixture name | No record with `name = QA_PRICE_NEG_001` |

- Postconditions: no new product from this request.
- Cleanup: if the test fails and creates data, delete the fixture in the test environment via the granted cleanup mechanism.
- Dependencies: the mock spec above; exact message text not required since the spec does not define it.

Related cases to design separately: `price = 0`, `name` of 100/101 chars, user without permission, not-logged-in request. The not-logged-in expected result must come from the contract before marking Ready.
