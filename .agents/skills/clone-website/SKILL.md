---
name: clone-website
description: Clone an existing website or supplied website reference with structural and visual fidelity. Use when the user provides an image, live website URL, sitemap URL, recording, HTML, or design reference and asks to reproduce the site; do not use for redesigning, restyling, or inventing a new UI.
license: MIT
metadata:
  version: "1.3"
---

# Clone Website

## Mandatory checkpoint before coding

After identifying the source and route/page scope, ask the user once:

> Do you want the design updated so the clone matches the source 100%? If yes, I will keep the sections, order, sizes, width/max-width, spacing, typography, assets, responsive behavior and interactions exactly as in the source. If not, specify which parts may differ.

Never assume the answer; do not code until the checkpoint has a clear answer. If 100% is chosen -> every observable difference within the chosen scope is a bug to fix; claim pixel-perfect only after comparing for real at the same viewport/state.

The reference source (image, website, sitemap, recording, HTML, design file) is the absolute source of truth for structure, content, typography, color, spacing, assets, responsive behavior and observable interactions. Cloning means reproducing UI/behavior 100%, not just downloading assets — downloaded assets only help; acceptance is that the clone matches the source.

## Invariant constraints

- Keep the hierarchy intact: routes, section order, header/navigation/main/footer regions, component groups, position and relationships between parts.
- Never add, remove, reorder, re-layout, change copy, change components/interactions, redesign, "improve", simplify, modernize, add sections/CTAs, change theme/design system/component library or style outside the scope the user chose — even if it looks "reasonable" or "better" to the agent. Source differs from current code outside the scope -> report the difference, ask for confirmation, do not expand/replace on your own.
- Keep observed UI values intact: relative sizes, colors, borders, radius, shadows, spacing, icons, images, states, motion.
- No placeholders, fake images, fake text or generic components to cover what you don't understand; missing asset/behavior -> state the limitation, keep a minimal structure.
- Preserve URLs, routes, links, queries, form actions and data contracts within the clone scope. Do not change backend/API just for frontend convenience.
- Infer responsive behavior from evidenced viewports/breakpoints; never add breakpoints that change UI beyond the source.
- Do not apply other design skills (like `ui-styles`) on your own — they can skew the clone from the source.

## Process

Before coding from a URL, check accessibility, status/redirects, HTML/DOM, computed style, fonts, assets, viewport/responsive and interactions; state what works, what is blocked or unverified.

1. **Identify the canonical source**: classify image/screenshot, website URL, sitemap URL, recording, HTML, Figma or multiple sources; state which wins on conflict. For a sitemap, use it only for inventory and fix the route URL or route group to clone before coding; never clone the whole sitemap. If the source cannot be accessed/read, stop speculating and report a specific blocker.
2. **Build the inventory before editing**: routes and URLs, section/component tree, header/footer, content, assets, fonts, colors/tokens, sizes/spacing, breakpoints, states and interactions. Separate what was observed from assumptions.
3. **Survey the codebase**: read project guidance, stack, routes, components, assets and related contracts; reuse existing rendering mechanisms, tokens and components when they match the source. Change only files/pages within the clone scope.
4. **Compare with current code/design**: if the current clone differs from the source website or the design file, stop and ask the user to choose the source of truth. Never decide website vs design file yourself.
5. **Lock in and sync docs**: if the user chose the website, confirm updating design/plan/docs to match the website 100%; if the design file, use it as source of truth and update plan/docs to the chosen design. Update in the repo's existing doc format, including plan/index when affected; never write a plan that contradicts the chosen source.
6. **Hand off to coder**: once source of truth, inventory, scope and plan/docs are locked, hand off to `coder` to write code — do not write code in this orchestration step. In Claude Code this is a separate call made by the orchestrating agent (the session that ran steps 1–5) via the Agent tool; the clone agent has no `Edit` and no tool to call other agents, so it cannot do this itself.
7. **Fidelity comparison**: coder must check at the same viewport and state as the source; compare macro-layout first, then typography, spacing, assets, colors and interactions. Check both the actual bounding box and computed style of containers, sections, slider track/thumb and related elements, at minimum `width`, `max-width`, `min-width`, `height`, `padding`, `margin`, `gap`, `overflow`, `flex-basis`/grid track. Do not conclude correct just because the source CSS declares something similar: if the source uses `max-width` but the clone renders full width, or vice versa, fix it or report the specific difference. If a difference cannot be verified, record it and stop speculating.
8. **Evidence screenshots (before and result)**: after all in-scope edits are done — capture the **final result state**, not mid-way/WIP then report done. Capture pairs at the same viewport/state: the `before` image is the source (original website/image/design being cloned) and the `result` image is the real clone page opened in a browser, for side-by-side comparison. Save to `.agents/storage/evidence/<task-slug>/<viewport>-<state>-{source|result}.png` (not committed, only evidence for the report). Never claim fidelity was compared without both real images; if the environment cannot capture, state the reason instead of skipping.
9. **Handoff**: review the diff to confirm no UI added/removed or changed beyond the chosen source of truth; state the source, synced plan/docs, matching parts, unverified parts and checks run. A report per the [Change template](../report/assets/change-report-template.md) must have a `URL:` line (checked route) and an `Evidence image:` line (screenshot paths from step 8). Never claim pixel-perfect without the corresponding comparison and evidence screenshots.

## Pipeline automating assets, CSS and media

When the user asks to clone from a URL and needs local assets, open [references/pipeline.md](./references/pipeline.md): Step 0 source inventory, Step 1 extract/download assets, Step 2 process CSS, Step 3 inject layout/media, Step 4 verify, plus the default storage structure. Scripts are in `scripts/`, the sample pixel spec in `assets/pixel-perfect-spec.md`; final acceptance is still comparing the real UI.

## Rules when the source is a screenshot or image

Source is an image/screenshot (no HTML/CSS to crawl): read [references/screenshot-source.md](./references/screenshot-source.md) before building the UI.

## Acceptance criteria

- Page tree, section order, routes and in-scope behavior match the reference source.
- UI has no unauthorized change of color, font, spacing, component, copy, asset, breakpoint or interaction.
- No unmarked placeholders/assumptions in the committed clone scope.
- Correct viewport, responsive states and interactions are checked with evidence; unchecked states are stated.
- The diff contains no changes outside the page/component/asset/config needed for the clone.

## Related skills

- Use `coding-frontend` to implement the frontend per the project's real stack and rules.
- Use `workflow-test` or `testcase` when the user asks to design/run tests; never turn cloning into a redesign.

## Fidelity constraints

- Lock the source of truth, route, viewport and state before implementing. Separate observed facts from assumptions; do not record pixel-perfect without comparing at the same viewport/state.
- Every downloaded asset has a mapping `originUrl` → `localPath`, status, resource type and error if any; never replace an undownloaded URL with a placeholder or unverified URL.
- Keep the original CSS in a separate file when possible, replace URLs with the verified mapping, keep stylesheet and selector order. Do not use complex regex to edit CSS if it could break strings, data URIs or `@import`.
- Video, iframe, stream manifests and large assets have their own status. Never download/merge `.m3u8` streams yourself, never skip `poster`, `source`, `track` or `srcset`; state what needs manual handling.
- CSS/media injection must be idempotent (re-running must not duplicate `<link>`, `<style>` or media sources) and must not overwrite the source layout; use a separate output file.
- The pixel spec holds only measured/observed values (color, font, size, line-height, spacing, container, breakpoint, shadow, transition, state); unmeasured values are `TBD`/`Unverified`, never invented.
- Respect same-origin limits, file size, timeout and access rights. External hosts, authentication, CAPTCHA, paywall or streams needing separate permission -> stop and report a blocker.
