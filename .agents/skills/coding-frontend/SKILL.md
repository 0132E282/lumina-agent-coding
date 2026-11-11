---
name: coding-frontend
description: "Implement/modify content/CMS website frontend — semantic HTML, data rendering, SEO metadata, navigation, images, forms, responsive, accessibility, XSS safety. Use when coding UI per spec or an existing UI/Figma reference; does not replace UX/UI design. Static HTML/CSS to components: references/html-to-component.md."
license: MIT
metadata:
  version: "1.0"
---

# Coding Frontend

Apply the invariants in [`rules/frontend`](../../rules/frontend.md), [`rules/coding`](../../rules/coding.md#type-safety) and the cross-stack checklist [`coding-standards`](../coding-standards/SKILL.md).

Implement UI per spec, display content reliably and work well for both users and search engines. Follow the project's real stack; do not default to React/Next.js or install new libraries.

## Principles

- Follow the [coding-frontend](../../rules/frontend.md) rules for the parts relevant to the task.
- **Mandatory edit boundary**: change only pages/components/behavior within the request or approved task. Do not touch working flows outside scope for "convenience", sync, cleanup or extra improvement. If shared components/pages or out-of-scope behavior must be affected, stop that change, report the files and expected impact, ask the user to agree; continue the independent assigned parts.

- Read project guidance, spec, manifest, routes, components and related API/CMS contracts before coding. Reuse existing components, tokens, metadata and fetch/cache mechanisms.
- **With a UI/Figma reference, follow it**: identify the canonical source, read the right screen/component/asset; keep layout, colors, typography, spacing and interactions. Never create a design system, change theme/UI library or redesign when only assigned a feature/fix. If the reference cannot be read, state the limitation, do not guess details.
- TypeScript follows [type-safety](../../rules/coding.md#type-safety): no `any` or type-bypassing assertions; reuse/derive existing types, group same-domain types in `types/`. Validate untrusted data at the boundary.
- Keep scope: no business/backend changes, dependency upgrades, publishing or deploys beyond the request. Never invent content, APIs, assets or verification results.

## Process

1. **Scope**: list the requested pages/components/behavior and keep other behavior unchanged. Raise out-of-scope dependent changes early to get approval before editing them.
2. **Survey**: identify pages/flows, input data, UI reference and acceptance criteria. Check the existing rendering (CSR/SSR/SSG), framework version and the real test/lint/build commands.
3. **Implement**: choose existing components, wire data and handle states; apply the groups in the references requirements table by page type. Keep business logic/data fetching within current module boundaries; do not create abstractions or global state when local state suffices.
4. **Verify**: check the main flow, missing data, API errors, direct routes and responsive; run appropriate test/lint/type check/build. Check render/state/effect loops in the framework in use and that network/API calls do not grow per item (N+1). For an accompanying backend flow, coordinate query counting per request/job in the backend skill; not limited to React/Next.js or any specific framework. Bug fixes need a regression test reproducing first per [quality-assurance](../../rules/delivery.md#quality-and-evidence); use [testing](../testing/references/unit-testing.md) when writing technical tests. Review the diff to confirm no behavior changed beyond the request; if a change needs extra permission, stop and ask for approval.
5. **Handoff**: self-review the diff, update affected docs. Report changed files/behavior, real checks and results, unverified parts; never treat a local preview as proof Google has indexed.

When receiving a handoff from `ui-cloner`: read [references/clone-handoff.md](./references/clone-handoff.md) before editing UI.

## Implementation requirements

Requirements table by group (semantic HTML, CSS/responsive, JS/forms, content/CMS, metadata/SEO, CSR/SSR/SSG, images/performance, accessibility, navigation, sharing, render safety): [references/implementation-requirements.md](./references/implementation-requirements.md). Open when implementing and apply only the relevant groups.

## Pre-completion checks

- UI matches the reference; long content/missing images do not break layout; check mobile, tablet, desktop and keyboard.
- Valid/invalid forms, pending, network errors, retry and success flows work; no console/hydration errors caused by the change.
- Deep links, refresh, back/forward, internal links and error pages are correct; metadata belongs to the right page in the HTML response and the DOM where applicable.
- CMS data cannot inject scripts through the changes made; dependencies and types are reused per convention.
- State which checks pass/fail/not run. Separate lab from field numbers; never promise SEO ranking or unmeasured performance.

## Related skills and docs

- [seo](../seo/references/website.md) when a crawl/index audit, sitemap, structured data or SEO issues broader than the frontend are needed.
- [seo](../seo/references/content.md) when assigned to plan/write content; never change approved content just to add keywords.
- New design/redesign goes to [designer](../../agents/designer.md); never apply style skills to existing UI on your own.
- Look up official docs for the real version when needed: [HTML and accessibility — MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility/HTML), [responsive images — MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images), [JavaScript SEO — Google](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

## Convert static HTML/CSS to components

Convert existing static HTML/CSS into the target framework's components (React, Vue, Angular, Svelte...), split by repeated blocks and per project convention: [references/html-to-component.md](./references/html-to-component.md).
