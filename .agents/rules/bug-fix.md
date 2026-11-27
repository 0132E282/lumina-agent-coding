# Debug — evidence-based, root cause

- Follow [`coding`](./coding.md#kiss-yagni-and-scope) for context gathering, inferred intent and scope; follow [`backend`](./backend.md#database-read-only-by-default) for database safety.
- Reproduce the issue and compare expected vs actual using evidence (logs, traces, requests/responses, queries or data). Localize the failing layer, test hypotheses and fix the confirmed cause; invalid input the system fails to reject is still a code bug.
- Add a regression test that fails for the bug, passes after the fix and fails again without it. Do not disable tests or change expectations against the spec.
- Once the cause is confirmed, make the smallest fix without asking for step-by-step approval. Ask only for material spec ambiguity, contract change or protected action; report unrelated bugs and ask before expanding scope.
- Route security bugs through [`review-web-security`](../skills/review-web-security/SKILL.md); never expose secrets, PII or exploit payloads.
- For intermittent issues, find the cause before calling them flaky. UI bugs need before/after captures at the same route and viewport per [`frontend`](./frontend.md); if impossible, state why. Recheck failing, normal and edge cases, regression and relevant performance; report limits.

Process and checklist: [`debugs`](../skills/debugs/SKILL.md).
