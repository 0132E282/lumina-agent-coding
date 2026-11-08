---
name: coding-backend
description: Implement/modify website/CMS backend — CRUD, publishing, slug/redirect, canonical, HTTP status, sitemap, API, cache, media, multilingual, security. Use when coding backend per spec and the existing stack; does not replace architecture design or a full SEO audit.
license: MIT
metadata:
  version: "1.0"
---

# Coding Backend

Apply the invariants in [`rules/backend`](../../rules/backend.md#backend--contract-content-and-security), [`rules/backend`](../../rules/backend.md#data-safety), [`rules/backend`](../../rules/backend.md#database-read-only-by-default) and the cross-stack checklist [`coding-standards`](../coding-standards/SKILL.md).

Ensure content, URLs and SEO data are consistent and the website is fast and stable. Follow the project's real framework, database/ORM and architecture; do not default to Laravel or Node.js or add services/libraries on your own.

## Principles

- Follow [backend](../../rules/backend.md#backend--contract-content-and-security), [type-safety](../../rules/coding.md#type-safety) and [database-read-only](../../rules/backend.md#database-read-only-by-default) where applicable.

- Read project guidance, spec, schema, routes, API contract and related config before coding. Reuse existing models, validation, services, serializers, jobs and cache; keep contracts outside the change scope compatible.
- **Mandatory edit boundary**: change only modules/endpoints/behavior within the request or approved task. Do not touch working flows outside scope for convenience, cleanup or extra improvement. If another module/contract must be affected, stop that part, report the files and expected impact, ask the user to agree; continue the independent assigned parts.
- Separate HTTP/validation/authorization/business logic per the project structure. Never trust visibility permissions from the frontend; check permissions in the backend per resource and tenant.

## Process

1. **Scope**: identify the requested modules, endpoints, files and behavior; note existing flows that must stay unchanged. Get approval first if the approach needs to change out-of-scope behavior.
2. **Survey**: identify entities, content lifecycle, actors/permissions, public URLs, metadata, frontend/SSR contract and acceptance criteria. Check stack version, schema/index, timezone, job/cache/storage and the real check commands.
3. **Implement**: handle the relevant groups in the references requirements table, choose the smallest change meeting the spec. Schema/API changes must state how compatibility is kept; URL changes need a redirect mapping and updates to the related metadata/sitemap/link sources if those are in the approved scope.
4. **Verify**: test behavior, access control, content states, URL/status and cache; run appropriate lint/type check/build. For affected data access paths, count queries for one request/job with available tools and check whether the query count grows with the record count; check relation lazy loading and queries inside loops on Laravel, EF/SQL or other ORM/framework. Without a query log/profiler, check statically and state that the real query count was not measured. For bug fixes, write a regression test that fails because of the bug before fixing, per [quality-assurance](../../rules/delivery.md#quality-and-evidence). Review the diff to confirm flows outside the request are unchanged; get approval before any expanding change.
5. **Handoff**: self-review the diff and sync affected docs. Report changed behavior/files, real commands and results, migrations/scripts to run and verification limits; distinguish written code from changes actually applied to the database/deployment.

## Implementation requirements

Requirements table by group (content/CMS, SEO data, URL/slug, canonical, HTTP status, sitemap, robots/index, API/render, query/cache, media, multilingual, security, operations): [references/implementation-requirements.md](./references/implementation-requirements.md). Open when implementing and apply only the relevant groups.

## Pre-completion checks

- Public sees only allowed content; test unauthenticated users, missing permissions and cross-tenant access if applicable.
- Publish/unpublish/scheduled, slug changes and concurrent requests keep the correct state; redirects do not loop, missing/removed URLs return the right status.
- Metadata, canonical and sitemap are consistent; cache does not keep stale content after changes or leak private content.
- Uploads/HTML and bad input are handled safely; the API contract and existing tests are still correct.
- State clearly which checks pass/fail/not run; never treat written code as proof that a job, migration or production backup works.

## Related skills

- [database](../database/SKILL.md) when writing/reviewing queries, indexes or measuring performance for the real engine.
- [seo](../seo/references/website.md) when an SEO audit, crawl/index verification or current SEO guidance lookup is needed.
- [testing](../testing/references/unit-testing.md) when writing tests; [coding-frontend](../coding-frontend/SKILL.md) to check the render/metadata contract when the task also has a frontend.
- New architecture design is handled by [architect](../../agents/architect.md); never expand a coding task into redesigning the system.
