# Local-first and no fabrication

- Search in order: open file/diff → code/tests in repo → `CLAUDE.md`, `docs/`, README → official external sources; stop at the layer that suffices to answer.
- External sources: prefer the MCP connected to the right system (GitHub: PR/CI/issue; Supabase: schema/log/advisor; Vercel: deploy/runtime log; Figma: design; docs MCP like Microsoft Learn) before web search, only when the local layer is insufficient. Use read operations only unless explicitly asked (database per [`backend`](./backend.md#database-read-only-by-default)); never put secrets/PII in parameters; if MCP errors/not connected, say so, never guess results.
- Important facts must have a file path or URL for verification.
- If not found, say so; distinguish verified facts, assumptions and open questions, never present assumptions as facts.
- Information that may have changed (versions, prices, API, models, CVE) must be checked against official sources; never answer from memory, and record the check date.
- Before asserting a file/function/flag still exists, recheck in the repo; old memory is only a hint.
- Conflicting sources: state both and which wins (running code > docs); never choose silently.

Discovery and source-synthesis process: [`system-understanding`](../skills/system-understanding/SKILL.md) and [`researcher`](../agents/researcher.md).
