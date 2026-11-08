---
name: system-understanding
description: "Survey and explain an existing system before coding, review or optimization; map modules, request flow, data flow, dependencies, boundaries, database and cross-module impact without redesigning or implementing. Draw Mermaid diagrams (directory structure, ERD, user/system flow): references/diagrams.md."
license: MIT
metadata:
  version: "1.0"
---

# System Understanding

Build grounded understanding of an existing system before proposing changes. This skill serves surveying and context handoff; new HLD/LLD design belongs to agent `architect`.

## Process

1. Read `AGENTS.md`, `CLAUDE.md`, README, manifest/lockfile and the suitable doc menus (`docs/index.json`, `docs/plans/index.json`, `docs/testcases/index.json`, `docs/reviews/index.json` if present). Open the right handoff docs (`docs/requirement-analysis.md`, `docs/system-design.md`) or plan JSON in `docs/plans/` when the menu conditions match the task.
2. Identify stack, entry points, modules, services, jobs, CLI, routes and main dependencies from real files; never guess from directory names.
3. Trace one representative flow from input → validation/auth → business logic → database/external service → output/side effect.
4. Record boundaries and ownership: which module is responsible, which contract is used, where canonical data lives, which tenant/authz and transaction boundaries apply.
5. For diagrams follow [references/diagrams.md](./references/diagrams.md); with a database combine [`database`](../database/SKILL.md); with bottlenecks or large data combine [`complexity-performance`](../complexity-performance/SKILL.md).
6. Clearly separate facts read, assumptions, unknowns and expected impact; cite path/file/line when possible.
7. State which modules, tests/CI/docs a change may affect and a suitable verification order.

## Minimum output

- **Scope**: what was surveyed and what was not.
- **Component map**: modules/entry points/dependencies and main responsibilities.
- **Main flow**: request/data flow and side effects.
- **Data & contract**: schema/API/event, permissions, transactions and canonical data source if determinable.
- **Diagrams**: per [references/diagrams.md](./references/diagrams.md) for directory structure, ERD or user/system flow by scope.
- **Risks/impact**: coupling, failure points, query/API fan-out, cache, retry, consistency or areas lacking evidence.
- **Next step**: coding, database review, complexity review, system design or planner; never switch roles beyond the request.

## Limits

- Never code, migrate, change schema/index, call production APIs or modify data.
- Never turn a local observation into a system-wide architectural conclusion without enough tracing.
- Never use fake data to cover unread parts; state missing files, access or environment.
- Do not overlap with `architect`: for HLD/LLD, new architecture options or design docs, hand off to that agent.

## Diagrams

Draw grounded diagrams (directory structure, database ERD, user/system flow in Mermaid), never guess components or relations: [references/diagrams.md](./references/diagrams.md).
