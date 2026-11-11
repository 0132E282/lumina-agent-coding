# Backend and frontend code review checklist

## How to use

Fix scope/SHA/files and read context, caller/callee, rules, manifest/lockfile, formatter/linter config before checking. Use the common (C), backend (B), frontend (F) and cross-layer (X) parts matching the code in scope. Never treat an item as a bug just because the checklist mentions it.

Each ID must have status `Checked` / `Confirmed bug` / `Not applicable` / `Not checked`, location/evidence and a reason when not applicable/not checked. `Checked` only means no bug found in the parts read or verified; it does not guarantee safety. If scope has one layer, state the not-applicable reason for the other groups.

Run existing parser/typecheck/linter/formatter/test when suitable, in non-fixing mode; record command and real result, missing tools write `Not Run`. Never run auto-fix, install packages, write to a real DB or attempt destructive exploits. A violated rule must cite the rule name and code; never turn personal preference into a mandatory convention. Verify references, dynamic imports, reflection or code generation before concluding code is unused.

## C — Common to all code

- **C01 Syntax and type:** parse/compile/import/export, type/nullability, async/await, unhandled promises; TypeScript without `any` per project rule.
- **C02 Codebase/rule compliance:** stack, module structure, naming, API convention, types, error handling; check against rules that actually apply and existing patterns.
- **C03 Format:** real formatter/linter config, indent, quote, import order, whitespace and final newline of non-empty text files (including JSON/index/docs); keep LF/CRLF per codebase. `git diff --check` does not replace the final-newline check. Separate format errors from logic errors.
- **C04 Redundant code:** unused import/variable/function, dead/unreachable branch, commented-out code, duplicate logic, unneeded dependency/abstraction; prove usage paths before concluding.
- **C05 Logic and requirements:** contract/AC, condition/processing order, empty/null/boundary, errors, compatibility and out-of-scope changes.
- **C06 Design and readability:** responsibility, coupling, DRY/KISS, nesting, function/variable names and comments per rule; never propose refactors without concrete impact.
- **C07 Big O and resources:** identify `n`/`m`, time/space for main path and worst case, lookup/sort/traversal/recursion, allocation/preprocessing, I/O and concurrency; use complexity-performance. When proposing optimization, record current → expected, trade-off and what is unmeasured. Pure config/docs write N/A.
- **C08 Security:** read review-web-security with references/checklist.md, check all 12 groups by stack/scope; trace input → validation/permission → sink, reading the real middleware/helpers. Check secret/PII/log/error and related dependency/lockfile; verify CVE/recommendations by version against official sources when needed, mask sensitive values.
- **C09 Verification:** suitable tests for success/error/boundary/permissions, regression and real evidence; findings only have `Result: Correct | Incorrect` per [`rules/review`](../../../rules/review.md). Never conclude Pass for unrun checks.
- **C10 Bug fix:** applies only when the diff fixes a bug; check against [`rules/bug-fix`](../../../rules/bug-fix.md) and [`debugs`](../../debugs/SKILL.md): bug origin (code/data/config-environment/user input/dependency) and root cause with evidence; regression test asserts the exact symptom and fails on old code (report must cite the `verify-regression.sh` result or command + failing output on the base SHA; reviewer reruns the new test on the base SHA via `git worktree`/`git stash` in a copy when runnable; if not runnable `Needs verification` with reason); fix targets the cause, no workaround/symptom masking, no disabled tests or expected values changed against spec; normal/boundary cases and related flows not broken; UI bugs have before/after images on the same route/viewport (if missing write `Needs verification`); S1–S4 severity reasonable; security bugs passed review-web-security and no exploit payload in commit/PR/test.

## B — Backend

- **B01 Route/API contract:** method, status, schema/serialization, compatibility, stable pagination, filter/sort allowlist and validation at the boundary.
- **B02 Authentication/session:** token/session lifecycle, expiry/revoke, cookie/CSRF per auth mechanism, reset password and bypass paths.
- **B03 Authorization:** function/object/field permission, ownership/tenant, bulk/export/download/preview, service account; check before reading/writing sensitive data.
- **B04 Input and injection:** SQL/NoSQL/command/template injection, deserialization, mass assignment, SSRF, path traversal; trace to the sink and check actual parameterization/allowlist.
- **B05 Database and N+1:** per-record query/lazy loading, eager loading/batch, query count `Q(n)`, rows scanned/returned, columns read, WHERE/JOIN/ORDER BY, index/plan if any; never infer query Big O from code line count. Use database; missing plan/log means static analysis only.
- **B06 Data consistency:** transaction, atomicity, race/lost update, uniqueness, idempotency/replay, rollback and side effects outside the transaction.
- **B07 Backend Big O:** service/job algorithms, in-RAM join/lookup, large-data serialization, streaming/chunk/batch; request/page/payload limits, timeout/retry/backoff and concurrency.
- **B08 File/upload:** read/write permission, size/real MIME, name/path, public/private storage, file execution, signed URL and download headers.
- **B09 Cache/queue/integration:** cache key by tenant/permission, invalidation, cache poisoning, job retry/duplicate, webhook signature/replay, timeout and external service errors.
- **B10 Sensitive business logic:** money/units/rounding, price and status from trusted sources, valid state transitions, payment/refund and duplicate-action protection.
- **B11 Config and operations:** debug/error disclosure, CORS, secret, TLS/proxy, rate limit/resource abuse, DB/storage permissions; assess by the real environment, never treat a missing header as a vulnerability by default.
- **B12 Backend tests:** contract, permission/tenant, boundary data, rollback/replay/race when applicable, query count and error flows; state what was not run.

## F — Frontend

- **F01 Render and state:** render conditions, loading/empty/error/success, state synced with data, stale closure, derived state and behavior after retry/navigation.
- **F02 Hook/effect/lifecycle:** correct dependencies, render/state/effect loop, listener/timer/subscription cleanup, request cancellation and response race when the framework applies.
- **F03 API and N+1:** per-item/component calls, duplicate fetch/waterfall, pagination/batch/cache, query key by user/tenant, retry/timeout and invalidation after mutation.
- **F04 Frontend Big O:** filter/map/find/sort in render, nested lookup, copy/allocation, DOM/list size, virtualization when justified, bundle/asset/network; never add memoization by gut feeling.
- **F05 Input/form:** UX validation and server error handling, double submit, null/boundary, number/date/timezone format; permissions and important validation are still checked in the backend.
- **F06 XSS and browser sinks:** HTML/Markdown render, innerHTML, URL/protocol, DOM injection and sanitization; real CSP and libraries, never trust API data as safe by default.
- **F07 Sensitive data:** secrets in bundle/public env/source map, token/storage, log/analytics, response/cache/state containing PII or unauthorized content; hiding UI does not replace authorization.
- **F08 Browser boundary:** cookie/CSRF per auth mechanism, credential/CORS, open redirect, postMessage origin/source, iframe and external links when applicable.
- **F09 Routing and access:** route/guard, reload/back/forward, hydration/SSR, fetch errors and URL; a route guard is UX, must be checked against server permissions.
- **F10 UI/accessibility:** semantic HTML, keyboard/focus, label/error, contrast, responsive/overflow, images and interaction states per requirements; use available tools, record the limit if the browser was not run.
- **F11 Content/SEO when applicable:** metadata/canonical/status, CMS content escaping, URL/link, draft/preview, render/index and images; never apply SEO to internal screens needing no index.
- **F12 Frontend tests:** main interactions, error/boundary, race/retry, permissions and regression; evidence that browser/build/type/lint and format actually ran.

## X — Cross-layer flows

- **X01 Frontend → backend contract:** field/type/null/status/error/pagination consistent; never trust price/permission/tenant sent by the client.
- **X02 End-to-end N+1:** count requests per item and queries per request/record; report API count `A(n)` and query count `Q(n, m)` separately, never adding different-unit quantities into one time Big O.
- **X03 End-to-end security:** backend serializes by correct permission/tenant/field before returning to the client; cache/browser/storage do not leak across users/tenants or unreleased content.
- **X04 Errors and mutation:** optimistic update/rollback, double submit/retry/idempotency, consistency after mutation and side effects when a layer fails.

## Output

Report coverage by ID, all evidenced findings in scope, parts unread/unrun and Big O assessment for reviewed data-dependent flows even when no bottleneck was found. Merge same-cause findings with all locations; no cap on bug count, never drop low-severity security findings. Security findings use all nine fields of the security template; separate security severity from general review severity. Never claim all vulnerabilities were found or use the checklist in place of evidence.
