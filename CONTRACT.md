# Hard constraints

The items below are **absolutely mandatory** — never violate them even if it seems reasonable or implicitly necessary for the task. If any is violated, stop and ask the user before continuing.

1. No `git commit`/`git push` without an explicit command from the user in the current turn ([`rules/git`](./.agents/rules/git.md)).
2. No writing/deleting data in a real database (`INSERT`/`UPDATE`/`DELETE`/DDL, migration, seed) unless explicitly requested ([`rules/backend`](./.agents/rules/backend.md#database-read-only-by-default)).
3. Never `Edit`/`Write` feature-implementation code in the main session — always delegate to `coder`, except editing config/docs files ([`AGENTS.md`](./AGENTS.md)).
4. When resolving a git conflict, never pull extra logic from the target branch into the source branch beyond what is required to clear the conflict ([`rules/git`](./.agents/rules/git.md)).
5. Never fabricate test/benchmark/tool results that were not actually run ([`rules/search-priority`](./.agents/rules/search-priority.md)).
6. Never commit/push files containing secrets (`.env`, credentials, private key, API key).
7. Never expand scope beyond the assigned task — if more changes seem needed, report and ask first ([`rules/coding`](./.agents/rules/coding.md#kiss-yagni-and-scope)).
8. Completing a task with concrete changes/results always produces a report via the `report` skill ([`rules/delivery`](./.agents/rules/delivery.md#mandatory-reporting)).

## When it applies

Loaded together with `CLAUDE.md`/`AGENTS.md` every session — applies to the main session and every subagent working in this repo. This is the highest-priority constraint summary; full details are in [`.agents/rules/`](./.agents/rules).
