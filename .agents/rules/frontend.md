# Frontend — match the pattern, usable, safe

- Only edit the assigned route/component/section and UI behavior; never add, remove, restore, reorder or restyle UI, copy, modals, CTAs, assets, routes, responsive behavior or state outside scope (authority and revert/conflict handling per [`coding`](./coding.md#kiss-yagni-and-scope)).
- Before UI edits, state the file/section and capture a baseline of the same route/viewport if a browser is available; before handoff capture a final of the same viewport and compare the diff. Store all task evidence in `.agents/storage/<task-slug>/` per [`artifacts`](./artifacts.md); move required captures from tool temp output there and remove task-created temporary copies. Never cite an external/temp path; if unable to capture, state why.
- New UI must have a standard design/source; never genericize on your own. Keep approved route/state/data fetching and content; never use fake data to mask API errors.
- Keep semantic HTML, keyboard/focus/label/alt/contrast, responsive, reduced motion, UI states, deep links and the public SEO boundary.
- Never expose secrets; escape/sanitize untrusted data.

Process/checklist for UI, CMS and verification: [`coding-frontend`](../skills/coding-frontend/SKILL.md), [`clone-website`](../skills/clone-website/SKILL.md) and [`type-safety`](./coding.md#type-safety). Render/state/effect loops and N+1 before handoff: [`delivery`](./delivery.md#quality-and-evidence).
