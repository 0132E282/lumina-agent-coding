---
name: review-web-security
description: "Security review of websites, backend, frontend, API, database and deployment config, with evidence, exploit conditions, impact, fix and regression test. Use for security review, audit, vulnerability hunting, auth/permission/upload/payment checks. Does not run destructive tests or scan outside scope."
license: MIT
metadata:
  version: "1.2"
---

# Review Web Security

## Goal

Find real vulnerabilities, prioritize by risk and give verifiable fixes. Use the checklist as an inspection map, not as a claim that every item is an existing bug. Never claim the app is absolutely safe or that the checklist covers every vulnerability.

## Working principles

- Read project guidance and confirm the user's requested scope before starting.
- Review the code and config provided; test only in environments within the allowed scope. Use fake data and test accounts; never run destructive tests or load tests on production.
- If only asked to review, report and propose patches. If asked to fix, make the smallest change addressing the root cause and run suitable tests ([`rules/coding.md`](../../rules/coding.md#kiss-yagni-and-scope)).
- Never print secret values, tokens, passwords or personal data. Mask sensitive values in evidence; if a secret leaked, recommend revoke/rotate, not just removal from code.
- Each finding has only `Result: Correct | Incorrect` per [`rules/review`](../../rules/review.md); hardening suggestions that are not bugs are listed separately. A missing header is not automatically a severe bug.
- Never assume UUIDs, hard-to-guess URLs, frontend validation, CORS, ORM or the framework automatically protect the whole app.
- Do not run scanners or install new dependencies unless needed. Do not rework the whole architecture to fix a local bug.
- Verify version-dependent recommendations with official docs ([`rules/search-priority.md`](../../rules/search-priority.md)). Never invent CVE, CWE, CVSS, versions or scanner results.

## Process

### 1. Map the application

Identify stack and versions from manifest/lockfile; read relevant routes, middleware, controllers, services, policies, serializers, frontend components, schema and deployment config.

Record:
- Entry points: HTTP, GraphQL, WebSocket, webhook, upload, import, queue, scheduled job.
- Identities: guest, user, admin, service account; tenant, role and permissions.
- Critical data: accounts, personal profiles, private documents, payments, secrets.
- Trust boundaries: browser → API → database/storage/queue → external services.
- Sensitive flows: login, reset password, change email, CRUD, bulk action, export, payment.

### 2. Trace and verify

For each applicable flow:
1. Follow input from source to where it is queried, written, rendered, executed or sent out.
2. Check authentication, function permission, object permission, field permission, tenant and business state.
3. Read the helper/middleware/policy actually invoked before concluding protection is missing.
4. Check side paths: bulk, export, download, restore, preview, legacy API, queue and webhook.
5. Collect code location, preconditions and feasible path. Verify with a small test in a safe environment if available.
6. If it cannot be verified, do not make it a finding; record the missing facts and how to verify in the limits section.

### 3. Classify and prioritize

Rate severity from reachability, required privilege, victim interaction, affected data, tenant scope and real impact.

- Critical: very high impact with a feasible exploit path, such as system takeover or mass access to critical data.
- High: account takeover, significant privilege escalation, sensitive data access or financial manipulation under realistic conditions.
- Medium: limited impact or needs significant extra conditions.
- Low: minor impact; list hardening suggestions without proven exploitability separately.

Never assign severity from the bug name alone. Include CVSS only with enough facts and explain the vector.

### 4. Fix and test

- Fix at trust boundaries and enforcement points; handle every path with the same cause.
- Use standard framework mechanisms, well-maintained libraries and version-appropriate config.
- Add meaningful regression tests: valid operations still succeed, out-of-permission/malicious operations are rejected without side effects ([`rules/delivery.md`](../../rules/delivery.md#quality-and-evidence)).
- Check other user, other tenant, guest, low role, forbidden fields and side endpoints when relevant.
- For race conditions and replay, check atomicity, idempotency and concurrent requests when the environment allows.
- State clearly which tests ran, results, what was not run and remaining risks.

## Security checklist

12 groups — read each item in detail (mark `Pass`/`Confirmed bug`/`Not applicable` with evidence) at [`references/checklist.md`](./references/checklist.md):

| Group | Scope |
|---|---|
| A | Authentication and accounts |
| B | Session, cookie and CSRF |
| C | Authorization and data isolation |
| D | Injection and backend input handling |
| E | Frontend and browser |
| F | HTTP, API and integrations |
| G | Files and uploaded content |
| H | Business logic and payments ([`rules/backend`](../../rules/backend.md#data-safety)) |
| I | Database, data and cryptography |
| J | Cache, resources and availability |
| K | Infrastructure and configuration |
| L | Supply chain, CI/CD and monitoring |

## Stack specifics

Reviewing Laravel/React → read [`references/stack-notes.md`](./references/stack-notes.md) (route→policy trace, mass assignment, Sanctum, `VITE_*`...). For other stacks apply the general checklist above, never infer Laravel/React conventions.

## Report format

Open with confirmed bug count, highest severity and scope limits. Sort findings by risk, not file-read order.

Each finding provides:
1. ID, title and severity.
2. Result: `Correct` or `Incorrect`.
3. File/line or route location; minimal code snippet, sensitive data masked.
4. Root cause and the violated data/permission flow.
5. Preconditions and minimal reproduction scenario in a test environment.
6. Real impact and scope of data/accounts/tenants.
7. Concrete fix or patch if requested.
8. Regression test: valid case, rejected case and side effects to avoid.
9. CWE/OWASP mapping if verifiable; never use mapping in place of evidence.

End with tests performed, parts not accessed/not tested (including points lacking facts to conclude) and handling order. If no confirmed bug, write "No bug found in the checked scope", never "No vulnerabilities".

If the project has skill [`report`](../report/SKILL.md), use that skill's exact template [`assets/security-review-report-template.md`](../report/assets/security-review-report-template.md) to present results — not the generic review template (missing confidence/exploit conditions/CWE fields) and never an invented format.

## References

Use official sources to verify rules, versions and fixes when needed:
- OWASP ASVS: https://owasp.org/projects/asvs
- OWASP Top 10: https://owasp.org/projects/top-ten
- OWASP API Security: https://owasp.org/projects/api-security-project
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/
- CWE: https://cwe.mitre.org/
- Official docs of the relevant framework, runtime and vendors.
