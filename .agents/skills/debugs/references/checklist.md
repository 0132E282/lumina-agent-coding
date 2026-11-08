# Debug checklist

## Criteria

| Criterion | Must answer |
|---|---|
| Reproduce | Can it be reproduced? Steps/conditions causing the bug? |
| Expected vs Actual | Where do the expected result (per spec) and the actual one differ? |
| Scope | Is the bug in frontend, backend, database, network or environment? |
| Root Cause | Was the root cause found or only the symptom handled? |
| Origin | Origin: code, data, config/environment, user input/action outside the spec, or dependency? Bad input that is not validated/clearly rejected is still a code bug. |
| Evidence | Are there logs, stack traces, requests, SQL queries or data proving it? |
| Impact | Which functions are affected, how many users, is data lost/wrong? |
| Regression | Does the fix break other functionality? |
| Performance | Does it slow the API, raise CPU/RAM, cause N+1 or memory leaks? |
| Security | Related to authorization, data exposure, SQL injection, XSS, authentication? |
| Verification | Were the failing case, normal case and edge cases retested? |

## Severity

| Level | When | Priority |
|---|---|---|
| S1 | Data lost/wrong, security hole, system/main flow down | Handle immediately, notify the user |
| S2 | Main function wrong or blocking many users, hard workaround | Prioritize in the current task |
| S3 | Secondary function wrong, clear workaround | Plan a fix |
| S4 | Minor display/text, no business impact | Batch-fix later |

Unsure between two levels -> pick the higher one and state the reason.

## Checks by bug type

| Bug type | Check |
|---|---|
| API returns wrong data | Request params, validation, business logic, response mapping |
| Slow API | Time per layer, SQL queries, N+1, cache, external APIs — use [`complexity-performance`](../../complexity-performance/SKILL.md), [`database`](../../database/SKILL.md) |
| HTTP 500 | Exception, stack trace, config, dependencies |
| HTTP 401/403 | Token, authentication, middleware, RBAC/policy — use [`review-web-security`](../../review-web-security/SKILL.md) |
| Database | SQL, transaction, index, lock, real data (read-only) |
| Queue/Job | Retry, timeout, failed jobs, idempotency |
| Frontend | Console, Network, state, props, API data, render/effect loop |
| Production overload | CPU, RAM, request rate, concurrency, workers, slow queries |
| Intermittent | Race/concurrency, time/timezone, test order, shared resources (directories, ports, cache, DB), retry/timeout; run repeatedly and record frequency |
| Security | Per [`review-web-security`](../../review-web-security/SKILL.md); never write exploit payloads/sensitive data into reports |
| Production-only bug | Differences in config, version, access rights, data, environment |

## Debug quality

- [ ] Reproduced the bug or clearly identified the conditions
- [ ] Concrete evidence (log, stack trace, request, query, screenshot) with secrets/PII masked, stored or referenced by path in `.agents/storage/evidence/<task-slug>/`
- [ ] Identified the origin (code/data/environment/user/dependency) and root cause
- [ ] Assigned severity S1–S4 and assessed security risk
- [ ] Fixed the real cause, no arbitrary workaround
- [ ] A test reproduces the bug: fails before the fix, passes after, fails again when the fix alone is removed
- [ ] Ran the appropriate regression tests
- [ ] UI bug: before/after screenshots at the same route/viewport in `.agents/storage/evidence/<task-slug>/` and attached to the report
- [ ] Verified on the target environment (or clearly stated it could not be verified)
- [ ] Performance bug: before/after measurements (p50/p95, queries/request, CPU/RAM when measurable)
- [ ] Production bug: logs/monitoring plan and a short postmortem note

Unmet items must be recorded in the report as remaining limits; never mark as met without evidence.
