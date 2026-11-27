---
name: coding-frontend
description: Implement website/CMS UI and content rendering using the existing stack and approved design; not for UX design or redesign.
license: MIT
metadata:
  version: "1.0"
---

# Coding Frontend

Follow [`frontend`](../../rules/frontend.md), [`coding`](../../rules/coding.md) and [`coding-standards`](../coding-standards/SKILL.md). Open the [implementation requirements](./references/implementation-requirements.md) groups relevant to the task.

## Frontend-specific work

- Read the canonical screen/component/asset reference and reuse existing components, tokens, metadata and data-fetching patterns. If a reference is unavailable, state the limitation instead of guessing. Do not redesign, change libraries or invent content/API behavior.
- Wire the requested UI to real data and handle loading, empty, error, retry and success states; never mask API errors with fake data. Keep business logic and data access within existing module boundaries.
- Preserve semantics, keyboard/focus, labels/alt text, contrast, responsive behavior, reduced motion and deep links; validate untrusted content against XSS.
- For a `ui-cloner` handoff, read [clone handoff](./references/clone-handoff.md). For static HTML conversion, use [HTML-to-component guidance](./references/html-to-component.md).

## Verify

- Check the main flow, missing/error data, direct routes, back/forward, keyboard and relevant viewport sizes; check metadata in HTML/DOM where applicable, plus render/state/effect loops and per-item API calls.
- Run the available test, lint, type-check or build command. Report actual results and limits; separate lab measurements from field data and do not promise search ranking or unmeasured performance.

Use [`seo`](../seo/SKILL.md) only when broader crawl/index or content work is in scope; new design work goes to the [`designer`](../../agents/designer.md).
