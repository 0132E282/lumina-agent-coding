# Documentation rules

## Docs sync

- Docs are part of the Definition of Done: a change that makes existing docs wrong must update the affected part in the same turn.
- Completing a whole implementation plan must create Markdown repo testcases with status `Not Run`, then update `docs/repo/index.json` and `docs/index.json`.
- API changes with a suitable existing Postman artifact must update that artifact, not create a duplicate.

Process for routing, schema, TOC and sync: [`docs`](../skills/docs/SKILL.md). Test artifacts: [`testcase`](../skills/testing/references/testcase.md). Core registry: [`documentation-reading-and-toc`](#docs-registry).

## Docs registry

- Before reading/writing docs in `docs/`, read the suitable owner's `index.json`, search by metadata and open files via `path`.
- Catalog entries have only `title`, `description`, `tags`, `path`; paths are repo-relative. The catalog manages only content in `docs/`, embeds no content and does not mix the `docs/testcases/index.json` schema.
- Read the whole target file and the sources/conventions that decide content before editing; state parts that cannot be read.
- Detailed artifacts and their index must update in the same turn; keep testcase ID/history and never invent dates/results.

Routing per index, artifact schema, TOC/anchors and link verification: [`docs`](../skills/docs/SKILL.md).

## Implementation plan contract

- An implementation plan is valid JSON at `docs/plans/<title-slug>-<yyyyMMdd>.json`, with `title`, `description`, `tags`, `content`, `createdAt`; no free-form Markdown plans.
- `docs/plans/index.json` updates in the same turn and entries have only `title`, `description`, `tags`, `path`.
- A task is a uniform object, keeping all fields/schema even when the value is `null`/`[]`; every path must be verified and trace REQ/BR → AC → task → test.
- Runtime plan mode/write permission takes precedence; never exceed read-only or claim saved when not written.

Full planning flow and task/traceability schema: [`workflow-plan`](../skills/workflow-plan/SKILL.md), [`planner`](../agents/planner.md) and [`implementation-plan-template.json`](../skills/docs/assets/implementation-plan-template.json).
