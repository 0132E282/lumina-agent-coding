# Receiving a handoff from ui-cloner

Applies when receiving a handoff from `ui-cloner` (clone-website) to adjust UI.

- Read the source of truth, inventory, mapping JSON and pixel spec before editing UI; apply `clone-website`'s [fidelity constraints](../../clone-website/SKILL.md#fidelity-constraints).
- Use assets with `status: downloaded`; keep `failed`/`skipped` assets as-is and report what needs manual handling. Never replace with placeholders if the clone committed to fidelity.
- Keep section structure, order, original/processed CSS and media paths per the mapping. If the real width, container, breakpoint or interaction deviates from the source, record the specific difference and fix it within the assigned scope; never redesign.
- Compare at the same route, viewport and state: macro layout first, then computed style/bounding box, typography, spacing, colors, assets and interactions. Say pixel-perfect only when there is corresponding evidence.
