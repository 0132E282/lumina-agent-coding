# Debug — evidence-based, root cause

- Never fix by guessing: you must reproduce or clearly identify the conditions, have expected vs actual per spec and real evidence (log, stack trace, request/response, query, data); real data/database is read-only, never expose secrets/PII when collecting evidence.
- Localize the failing layer and identify the source (code, data, config/environment, user input/action outside spec, external dependency/system) with evidence; test each hypothesis, fix the root cause, no arbitrary workaround or symptom masking. User input outside spec that the system does not validate/report clearly is still a code bug.
- Have a regression test that reproduces and fails for the right reason before the fix, passes after the fix and fails again when the fix alone is removed; never disable tests, never change expected results against the spec.
- Minimal fix within scope; extra bugs found outside scope: only report location/impact and ask permission.
- Security bugs must go through [`review-web-security`](../skills/review-web-security/SKILL.md); never write exploit payloads, tokens or sensitive data into reports, logs, commits or public PRs.
- Intermittent bugs: never conclude "flaky" before finding the cause.
- UI bugs must have before and after images of the same route/viewport per [`frontend`](./frontend.md); if capture is impossible, state why.
- Re-verify the failing case, normal case, edge case, regression and related performance; parts unverified on the target environment must be stated.

Process (levels S1–S4, repeated runs for flaky bugs, saving evidence), per-bug-type checks and quality checklist: [`debugs`](../skills/debugs/SKILL.md). Database: [`backend`](./backend.md#database-read-only-by-default). Scope: [`coding`](./coding.md#kiss-yagni-and-scope).
