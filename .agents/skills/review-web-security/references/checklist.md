# Detailed security checklist

Mark each item with status: `Pass`, `Confirmed bug`, `Not applicable`. For `Pass` or `Confirmed bug`, cite evidence; for `Not applicable`, give a short reason. Merge items with the same cause into one finding.

## A. Authentication and accounts

- Plaintext passwords, fast/unsuitable hash, default or weak credentials.
- Brute force, credential stuffing; missing attempt limits and abuse detection.
- User enumeration via response, timing or reset/registration flow.
- Guessable reset tokens, no expiry, reusable or not bound to the right account.
- Password/email change and account linking lacking proper verification.
- OTP/MFA lacking limits, expiry, single use; bypass via side endpoints/recovery.
- OAuth/OIDC wrongly checking redirect URI, state, nonce, PKCE, issuer or audience.
- JWT not properly checking signature, allowed algorithms, issuer, audience, expiry.
- Session/token still valid against policy after logout, account lock, permission change or password change.
- Shared API keys, broad permissions, leaked or lacking revocation/rotation.

## B. Session, cookie and CSRF

- Session fixation; no session regeneration after authentication or privilege elevation.
- Missing suitable idle/absolute timeout; logout does not invalidate the server session.
- Cookies missing suitable Secure/HttpOnly/SameSite; domain/path too broad.
- Token/session appearing in URL, log, referrer or analytics.
- CSRF on operations using auto-sent credentials such as cookies; GET with side effects.
- WebSocket using cookies but lacking proper origin checks.
- CSRF protection exists but related endpoints are wrongly exempt or have a bypass.

## C. Authorization and data isolation

- IDOR/BOLA: accessing others' objects via ID or relations.
- BFLA: low role calling admin functions; permission checked only in UI.
- Endpoints missing authentication: new routes default allow instead of default deny; per-route auth middleware easy to miss; API/admin/internal routes callable when not logged in.
- Missing field read/write permission; mass assignment of role, owner, tenant, price or status.
- Trusting user_id/tenant_id/role from the client instead of verified identity and context.
- Missing tenant scope in query, cache, storage, search, export or job.
- Bulk action checking only some records; export/download/restore/preview bypassing permissions.
- Dynamic model/module/relation/action without allowlist and matching policy.
- Stale permissions in cache; default allow when policy is missing or the check errors.
- Private documents with public URLs; signed URLs not bound to suitable scope/expiry.

## D. Injection and backend input handling

- SQL/NoSQL injection; raw query concatenation or allowing arbitrary operators/queries.
- OS command/code/expression injection; eval, shell or dynamic script from input.
- Server-side template injection; input becoming an executed template.
- LDAP/XPath/XML injection; XXE via parsers allowing external entities.
- Unsafe deserialization or prototype pollution when input affects sensitive objects/config.
- CRLF/HTTP header/email header injection; log injection.
- CSV/formula injection when exporting untrusted data.
- Unbounded dynamic sort/filter/table/column/relation; confusing values with identifiers.
- Validation lacking type, length, value domain, nested structure or needed canonicalization.

## E. Frontend and browser

- Stored/reflected/DOM XSS; wrong encoding for HTML, attribute, URL or JavaScript context.
- innerHTML, dangerouslySetInnerHTML, v-html, document.write receiving data not safely handled.
- Rich text/Markdown/SVG using unsuitable sanitizer or with bypass config.
- HTML injection, dangerous URL schemes, DOM clobbering; eval/new Function from input.
- postMessage not exactly checking origin, source and data schema.
- Clickjacking on sensitive operations; open redirect aiding phishing.
- Secrets/private keys embedded in bundle or frontend environment variables.
- Token/storage with unsuitable protection model; XSS can read data or call APIs as the user.
- Sensitive data in analytics, URL, public source maps or error reports.
- Browser/service worker cache keeping data across users or after logout.
- Third-party scripts lacking suitable source/integrity control; overly broad CSP.
- Trusting API data as safe to render; trusting hidden fields or frontend validation.

## F. HTTP, API and integrations

- CORS reflecting origin or letting untrusted origins read credentialed responses.
- SSRF via URL fetch, image import, PDF renderer; ignoring redirect, DNS or internal access.
- WebSocket/channel/message lacking authentication, permission or resource limits.
- HTTP parameter pollution, parser differential, request smuggling between proxy and backend.
- Host-header poisoning; trusting X-Forwarded-* from unconfigured sources.
- Webhooks lacking signature verification, timestamp, replay protection or event reconciliation.
- Third-party APIs lacking schema validation, timeout, size limits or safe error handling.
- Exposed legacy/debug/internal endpoints; incomplete API inventory.
- GraphQL resolvers lacking permissions; query depth/complexity/batching not suitably limited.
- Serializers returning extra fields or sensitive data beyond need.

## G. Files and uploaded content

- Trusting only client extension/MIME; executable files or active HTML/SVG served from the same origin.
- Uploaded files that can be executed; lacking suitable storage isolation.
- Path traversal, arbitrary file read/write/overwrite via paths or file names.
- Zip Slip, archive symlinks or decompression bombs.
- Upload/extraction/conversion lacking limits on size, file count, time and resources.
- Vulnerable image/PDF/Office/video parsers; converters accepting dangerous input.
- Temp files, private files, thumbnails or conversion outputs lacking permission control.

## H. Business logic and payments

- Trusting price, tax, total, discount, balance or payment status sent by the frontend.
- Not reconciling transactions with order, amount, currency, merchant and status from a trusted source.
- Negative numbers, overflow, wrong rounding/currency or quantities outside the valid domain.
- Workflow step bypass; editing locked objects; missing state-transition checks.
- Race condition, double spending, TOCTOU; lacking suitable transaction/locking/constraints ([`rules/backend.md`](../../../rules/backend.md#data-safety)).
- Lacking idempotency or replay protection for payments, webhooks, refunds and retries.
- Refunds exceeding value or repeated; coupon/referral/multi-account abuse.
- Exceptions/timeouts making the system fail-open or write partial data.

## I. Database, data and cryptography

- Public database/cache/search; over-privileged application account.
- Leaked backup/dump/snapshot; production data moved to test without suitable masking.
- Passwords, OTP, session, token, PII in logs or telemetry.
- Home-grown algorithms, outdated primitives or wrong library use.
- Weak random tokens; nonce/IV reused wrongly; ciphertext lacking integrity protection.
- Leaked keys, broad permissions, unsuitable storage or lacking lifecycle management.
- Sensitive data lacking protection in transit/at rest per the threat model.
- Inconsistent retention/deletion across database, files, cache and copies per policy.

## J. Cache, resources and availability

- Cache key lacking user/tenant/permission; private response cached and shared.
- Cache poisoning/deception; cache keeping revoked permissions or data.
- Login/OTP/search/export/SMS/email/AI lacking suitable rate limit, quota and abuse protection.
- Pagination, GraphQL, filter, regex or request body creating unbounded load.
- ReDoS, heavy queries, large uploads, queue flooding or decompression exhausting resources.
- Missing timeout, concurrency limit, backpressure; retry storms.
- IP-only rate limit easy to bypass or locking wrongly; not checking limits per identity/business.

## K. Infrastructure and configuration

- Debug/profiler on in production; .env, .git, backups, directory listing served publicly.
- Unsuitable HTTP/TLS config; backend with certificate verification off.
- Bucket/storage/admin ports/database/dashboard public against need.
- Containers/processes running with high privilege; service accounts and filesystem too broad.
- Dev/staging using production secrets or resources outside scope.
- Dangling DNS/subdomain takeover; origin directly reachable bypassing needed controls.
- Secrets committed to code/history; no revocation of leaked secrets.
- Runtime/framework/OS lacking suitable patches.

## L. Supply chain, CI/CD and monitoring

- Direct/transitive dependencies with vulnerabilities exploitable in the app context.
- Typosquatting, dependency confusion, untrusted package/build scripts.
- CI running untrusted PR code with secrets; over-privileged runner/deploy tokens.
- Artifact/image/build provenance not suitably controlled.
- Missing audit log for permission changes, document access, export, financial operations.
- Logs easily edited/deleted; missing alerts for risky behavior.
- Error responses leaking SQL, stack trace, config or secrets.
- Backups with untested restore; lacking token/key revocation and incident handling.
