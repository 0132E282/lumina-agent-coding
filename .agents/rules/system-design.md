# System design — pick the right documents and follow them

- Main documents `ARCHITECTURE.md` and `DESIGN.md` at the repo root; detailed versions split by type (database, api, frontend...) in `system/` and `design/`, outside `docs/`.
- Choose documents by real project type and complexity (default: web frontend); other types (mobile, AI, desktop, SaaS, e-commerce, backend, infrastructure) only when the project is of that type. Never write the full set; drop inapplicable sections with a reason.
- Mermaid diagrams only with ≥3 components/steps, from verified structure. Design patterns only for a concrete problem, with the reason ([`coding`](./coding.md#kiss-yagni-and-scope)).
- Planning, orchestration and coding always read these designs; each task cites the design part it implements. No design yet: say so, never invent; code that deviates from the design: stop and ask.
- Follow the existing design system and UI; never redesign or swap the UI library on your own. Parts without basis are recorded as assumptions or open questions.

Roles: [`architect`](../agents/architect.md) writes architecture, [`designer`](../agents/designer.md) writes UI. Diagrams: [`diagrams`](../skills/system-understanding/references/diagrams.md); sets per project type and checklist: [`design-sets`](../skills/system-understanding/references/design-sets.md).
