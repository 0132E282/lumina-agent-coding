---
name: coding-backend
description: Implement website/CMS backend work across content, URLs, APIs, cache, media and security using the real stack; not architecture design or a full SEO audit.
license: MIT
metadata:
  version: "1.0"
---

# Coding Backend

Follow [`backend`](../../rules/backend.md), [`coding`](../../rules/coding.md) and [`coding-standards`](../coding-standards/SKILL.md). Open the [implementation requirements](./references/implementation-requirements.md) groups relevant to the task.

## Backend-specific work

- Use the actual framework and DB/ORM; do not assume Laravel/Node.js or add services/libraries without need. Trace content lifecycle, permissions, schema, routes and API contracts; reuse existing models, validators, services, serializers, jobs and cache.
- Keep API/URL compatibility. For approved slug or URL changes, update redirects and related metadata, sitemap and links in scope.
- Check content visibility across public/private states and tenants; keep cache, uploads and HTML from leaking or injecting content.
- For affected data paths, measure query counts when possible and check growth with record count, lazy loading and queries inside loops. Otherwise state that review was static.

## Verify

- Check public/unauthenticated, denied and cross-tenant access; publish/scheduled/concurrent states; URL statuses and non-looping redirects; metadata/sitemap; cache invalidation; uploads and API contracts as applicable.
- Run the relevant test, lint, type-check or build command. Report what ran, what did not, and any migration/script that still needs execution; written code does not prove a database or deployment changed.

Use [`database`](../database/SKILL.md) for engine-specific query/schema work, [`review-web-security`](../review-web-security/SKILL.md) for security reviews, and [`testing`](../testing/SKILL.md) for test design.
