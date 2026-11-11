---
name: workflow-graphify
description: "Build or query the project knowledge graph when calling $workflow-graphify, /graphify, or asking how parts of the codebase relate; output docs/graphify-out/, input is the project root."
---

# workflow-graphify

Read the source `.claude/commands/graphify.md` and rule [`graphify`](../../rules/graphify.md); Claude uses `/graphify`, Codex uses `$workflow-graphify` with the same argument. The full pipeline is the installed graphify skill (`~/.claude/skills/graphify/SKILL.md`); this skill only fixes the location and input:

- Output: `docs/graphify-out/` at the project root, never `graphify-out/`.
- Input: no path means the project root (not the current subfolder); `docs/graphify-out/` is never scanned.
- Graph exists and the request is a question → `graphify query` first, then verify in code. No graph → ask before building.
