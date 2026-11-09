# Debug — evidence-based, root cause

- Never fix by guessing: reproduce or pin down the conditions, with expected vs actual per spec and real evidence (log, trace, request/response, query, data). Real database is read-only; never expose secrets/PII.
- Localize the failing layer and source (code, data, config, out-of-spec input, external dependency), test each hypothesis, fix the root cause, never mask the symptom. Out-of-spec input the system does not validate/report clearly is still a code bug.
- Regression test: fails for the right reason before the fix, passes after, fails again without it. Never disable tests or change expected results against the spec.
- Root cause confirmed with evidence → apply the minimal fix immediately, no confirmation; ask only for a real-database write, a contract/spec change or an ambiguous spec. Extra bugs outside scope: report location/impact and ask.
- Security bugs go through [`review-web-security`](../skills/review-web-security/SKILL.md); never put exploit payloads, tokens or sensitive data in reports, logs, commits or PRs.
- Intermittent bugs: never conclude "flaky" before finding the cause.
- UI bugs need before/after images of the same route/viewport per [`frontend`](./frontend.md); if impossible, state why.
- Re-verify the failing, normal and edge cases, regression and related performance; state what was not verified.

Process and checklist: [`debugs`](../skills/debugs/SKILL.md). Database: [`backend`](./backend.md#database-read-only-by-default). Scope: [`coding`](./coding.md#kiss-yagni-and-scope).
