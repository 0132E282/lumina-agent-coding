# Debug report template

Use when diagnosing/fixing bugs per skill [`debugs`](../../debugs/SKILL.md). State final results only (e.g. "test fails before fix, passes after" is a result), not the story of attempts. File changes still listed per the [Change template](./change-report-template.md); this template replaces the bug summary. Drop lines that do not apply.

`------------------------`

**Bug**: short title — **Severity**: S1|S2|S3|S4 (reason)

**Impact**: feature, user group/count, lost/wrong data (figures with source: log, analytics, count query; none means `undetermined` + reason)

**Basis**: `file:line` spec or requirement source

**Expected / Actual**: expected result / actual result

**Reproduction**: environment/version + input + numbered steps to the bug (re-runnable commands or actions); intermittent bugs give the rate (e.g. 2/5 runs); if not reproducible give known conditions, what was tried and why the fix proceeds (evidence from log/data)

**Scope**: bug layer (frontend | API | service | database | queue | network | external system) — with `file:line`

**Origin**: code | data | config/environment | user input | dependency — with `file:line`

**Root cause**: one sentence + `file:line` + evidence directly linking to the symptom

**Evidence**: log/stack trace/query/request with secrets masked (secret check from skill debugs run), path `.agents/storage/evidence/<task-slug>/<yyyyMMdd-HHmm>-<type>.<ext>`

**Fix**: main change and why it targets the root cause

**Regression test**: `file:line` — fails before fix (result of `verify-regression.sh <base> -- <command>` + evidence log path), passes after fix, fails again when only the fix is removed; if not automatable, the before/after check method

**Performance**: before → after (p50/p95, query/request count, CPU/RAM) for performance bugs; other bugs on data-dependent flows record N+1/loop review result

**Security**: yes/no; if yes reference the security report, never write exploit payloads

**URL / Evidence image**: route and before/after images in `.agents/storage/evidence/<task-slug>/` — only for UI bugs

**Verification**: final command and result (failing, normal, edge, regression cases)

**Out of scope**: additional bugs found — location, impact, awaiting permission; `None` when appropriate

**Limits**: unmet checklist items, parts unverified on the target environment; `None` when appropriate

**Postmortem**: timeline, impact, how to prevent recurrence — only for production bugs
