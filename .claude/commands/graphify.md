---
description: "Build/query the project knowledge graph: output docs/graphify-out/, input defaults to the project root"
argument-hint: "[question | --update | <path> | other graphify flags]"
---

Graphify: $ARGUMENTS

- Follow the [`graphify`](../rules/graphify.md) rule and the installed graphify skill (`~/.claude/skills/graphify/SKILL.md`) for the pipeline and flags.
- Input: no path given → the project root, even when the session is in a subfolder. Use another path only when `$ARGUMENTS` names it.
- Output: `docs/graphify-out/` only; if the skill would write `graphify-out/`, use the `docs/` prefix instead.
- A question (no `--update`/path) with an existing `docs/graphify-out/graph.json` → run `graphify query` first and verify key facts in code. Without a graph, ask before a full build.
- Never commit/push on your own. Codex uses the equivalent `$workflow-graphify`.
