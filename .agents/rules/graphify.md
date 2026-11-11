# Graphify — output in docs/, input is the project

- Graph output always lives in `docs/graphify-out/` at the project root (`graph.json`, `GRAPH_REPORT.md`, `graph.html`, cache); never create `graphify-out/` at the repo root. It is a generated artifact: not an `index.json` entry, not hand-edited, and `docs/*` stays ignored by git unless a handoff explicitly promotes a file.
- `/graphify` with no path takes the current project root as the input; use the project root as the standard even when invoked from a subfolder. Pass another path only when the user names it. Never scan `docs/graphify-out/` itself as input.
- Before answering a question about the codebase, check `docs/graphify-out/graph.json`; if it exists, run `graphify query` first and verify important facts in the code (running code > graph). If missing, say so and ask before building (a full build spends tokens).
- Rebuild with `--update` after code changes; full rebuild only on request. Never put secrets/PII from the scan into the graph or reports.
- The installed skill is `~/.claude/skills/graphify/SKILL.md`; its paths are set to `docs/graphify-out/`. If a skill upgrade resets them to `graphify-out/`, restore the `docs/` prefix before running. The skill's frontmatter `name:` is `graphify-skill` so it does not collide with the `/graphify` command; restore it if an upgrade resets it to `graphify`.

Skill: `graphify`. Docs registry: [`docs`](./docs.md#docs-registry). Local-first: [`search-priority`](./search-priority.md).
