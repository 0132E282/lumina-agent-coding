# Frontend — match the pattern, usable, safe

- Only edit the assigned route/component/section and UI behavior; never add, remove, restore, reorder or restyle UI, copy, modals, CTAs, assets, routes, responsive behavior or state outside scope (authority and revert/conflict handling per [`coding`](./coding.md#kiss-yagni-and-scope)).
- Before UI edits, state the file/section and capture a baseline of the same route/viewport if a browser is available; before handoff capture a final of the same viewport, compare the diff and remove out-of-scope UI. Final evidence has URL and images at `.agents/storage/evidence/<task-slug>/` of the project being worked on; browser-tool images saved in system temp directories (`/var/folders`, `/tmp`) must be copied there before citing in a report, never cite temp paths; if unable to run/capture, state it.
- New UI must have a standard design/source; never genericize on your own. Keep approved route/state/data fetching and content; never use fake data to mask API errors.
- Keep semantic HTML, keyboard/focus/label/alt/contrast, responsive, reduced motion, UI states, deep links and the public SEO boundary.
- Never expose secrets; escape/sanitize untrusted data.

Process/checklist for UI, CMS and verification: [`coding-frontend`](../skills/coding-frontend/SKILL.md), [`clone-website`](../skills/clone-website/SKILL.md) and [`type-safety`](./coding.md#type-safety). Render/state/effect loops and N+1 before handoff: [`delivery`](./delivery.md#quality-and-evidence).
