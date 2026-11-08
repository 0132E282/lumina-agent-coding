# HTML to Component

When splitting components, keep the frontend/type invariants and the DRY/readability checklist in [`coding-standards`](../../coding-standards/SKILL.md); do not create abstractions beyond current needs.

Convert static HTML/CSS already in the project into components of the framework the user specifies, keeping the content/layout/behavior observed in the source files exactly — no redesign, no content changes, no added features.

## Scope

- Input: `.html`/`.css` files (and `.js` if any) **already in the repository**. Not for images, URLs or design references — those use [clone-website](../../clone-website/SKILL.md)/`ui-cloner`.
- The target framework is specified by the user each time (React, Vue, Angular, Svelte...); never pick a default. If the target framework is unclear, ask before converting.
- Keep the content, layout, style, text and JS behavior observed in the source files intact, same principle as [frontend](../../../rules/frontend.md). If the source file is the result of an earlier clone, also apply [clone-website's fidelity constraints](../../clone-website/SKILL.md#fidelity-constraints) when comparing.

## Process

1. **Read the target project's conventions before converting**: component dir (`components/`, `src/components`...), file/component naming, TS or JS, styling approach in use (CSS Module, Tailwind, styled-components...). Convert per the observed convention; never impose your own standard.
2. **Read the whole source**: HTML, related CSS (inline `<style>` or linked `.css` files) and related JS (inline `<script>` or linked `.js` files). Do not convert before reading all the source.
3. **Identify repeated blocks/UI patterns** (card, list item, table row, nav item...) to split into separate components with props; keep non-repeated parts in the parent component. Apply the [DRY rule](../../../rules/coding.md#coding-principles) — split only when it truly repeats ≥2 times or the pattern is clear, never speculatively.
4. **Extract shared functions/logic**: repeated handling (data formatting, class name computation, similar event handlers) becomes its own function/hook per the target framework's idiom (hook for React, composable for Vue, service for Angular...). Keep the original JS behavior exactly, never add new logic.
5. **Convert per the target framework's idiom**: HTML attributes -> matching props/bindings (`class` -> `className`/`:class`, `onclick` -> `onClick`/`@click`...). CSS keeps the styling mechanism the target project uses; never switch to CSS-in-JS if the project uses CSS Modules and vice versa.
6. **Optimize rendering where applicable to the target framework**: stable `key` for lists, memoization (`React.memo`/`useMemo`/`computed`...) for repeated computation or observed redundant re-renders. Do not optimize without evidence of need — avoid premature optimization per [simplicity](../../../rules/coding.md#kiss-yagni-and-scope).
7. **Fidelity comparison**: compare the original file and the new component — same content, same displayed structure, same interactive behavior. Any difference must be fixed or reported with location/reason, never treated as an "improvement".

## Pre-completion checks

- The new component displays the same content/layout/style as the original HTML/CSS file, compared directly (no guessing).
- Original JS behavior (click, toggle, submit...) works equivalently after moving to the target framework's event handlers.
- File/component names, directory location and styling approach match the target project's convention observed in step 1.
- No TODO/placeholder covering unconverted parts; unconverted parts must be reported clearly, never silently skipped.
- The target project's lint/type-check (if any) passes; apply [type-safety](../../../rules/coding.md#type-safety) when targeting TypeScript.

## Not applicable

- Never add data fetching, global state management, routes or backend calls not in the original file.
- Never switch UI library/CSS framework (Tailwind, MUI...) if the target project does not already use it.
- Multiple HTML files at once with clearly shared parts (header/footer repeated on every page): ask the user whether to extract a shared layout before converting each page; do not decide on your own.

## Related skills

- [clone-website](../../clone-website/SKILL.md) when the source is an image/URL/sitemap rather than an HTML file already in the project.
- [coding-frontend](../SKILL.md) for the remaining implementation (wiring real data, SEO, accessibility) once components exist.
- [design-patterns](../../design-patterns/references/refactoring.md) when more specific refactoring techniques are needed for the function/component extraction step.
- [testing](../../testing/references/unit-testing.md) when tests are needed for the newly extracted components/functions.
