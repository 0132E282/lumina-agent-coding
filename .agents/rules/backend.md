# Backend and data rules

## Backend — contract, content and security

- Read the real stack/schema/routes/contract; do not change contracts, shared modules or flows outside scope without approval.
- New APIs/routes need a verifiable URL or reference doc; never invent schemas, endpoints or responses.
- Validate at boundaries; allowlist written fields, parameterize queries; never leak secrets, PII or stack traces.
- Publish only permitted content; preview/draft needs permission, robots/noindex does not replace authentication.
- Avoid N+1; transactions, cache, uploads, HTML, timeout/retry and idempotency must preserve integrity and security boundaries.

Process/checklist: [`coding-backend`](../skills/coding-backend/SKILL.md), [`database`](../skills/database/SKILL.md), [`review-web-security`](../skills/review-web-security/SKILL.md).

## Data safety

- Authorization/tenant always in the backend, as early as possible and on the correct resource/action/owner; UI is only UX, not access control.
- Write groups that must succeed or fail together must use a transaction.
- No irreversible side effects inside a transaction.

Process/checklist per engine and security boundary: [`database`](../skills/database/SKILL.md), [`coding-backend`](../skills/coding-backend/SKILL.md), [`review-web-security`](../skills/review-web-security/SKILL.md).

## Database read-only by default

- Every real database is read-only by default: never run writes, DDL, migrations, seeds, change indexes/schema/collections or flush production cache on your own.
- You may draft migrations/write scripts when asked, but drafting does not grant permission to run them.
- Run a mutation only when the user explicitly requests both design and execution; never extend from a read/analysis request.
- Test/sandbox is an exception only when the user explicitly confirms.

Command scope and per-engine process: [`database`](../skills/database/SKILL.md). Transaction/authorization: [`data-safety`](#data-safety). Explicit authorization like Git: [`git`](./git.md).
