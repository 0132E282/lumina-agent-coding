# Writing style and diagrams in docs

## AI-readable — default

- Write short, with stable headings; prefer facts, paths, contracts, dependencies and verification results.
- Use Mermaid diagrams for complex relationships/flows; never repeat the whole diagram in prose.
- Distinguish facts, assumptions and unverified parts. Drop preambles/decoration and inapplicable sections.
- Read/write only the relevant parts; record information at the canonical source once then link. Open details as needed.

## Human-readable — only when requested

- Write explanations in the reader's context, may add narrative, examples, a glossary and step-by-step guides.
- Still keep paths, verification sources, warnings and unverified status; never sacrifice accuracy for readability.
- May restate diagrams in prose if the reader needs sequential guidance.

If no audience is specified, always choose `AI-readable` and optimize for the smallest sufficient context.

## Reduce reading load with diagrams

- When a doc has 3 or more related components, a multi-step flow, hierarchy or dependencies hard to read linearly, prefer a Mermaid diagram so AI and readers grasp relationships faster.
- Use diagrams for relationships, ownership, sequence, boundaries and dependencies; use text for purpose, assumptions, constraints, caveats and details a picture cannot show well.
- Never repeat the whole diagram content in prose. After a diagram, record only conclusions, easily confused points and verification sources.
- Diagrams must have short labels, as few nodes as needed and distinguish `Verified`/`Assumed`; if a diagram makes the doc harder to read, keep a short text version and state the reason.
