# Hard constraints

The items below are **absolutely mandatory** — never violate them even if it seems reasonable or implicitly necessary for the task. If any is violated, stop and ask the user before continuing.

1. No `git commit`/`git push` without an explicit command from the user in the current turn ([`rules/git`](./.agents/rules/git.md)).
2. No writing/deleting data in a real database (`INSERT`/`UPDATE`/`DELETE`/DDL, migration, seed) unless explicitly requested ([`rules/backend`](./.agents/rules/backend.md#database-read-only-by-default)).
3. Never `Edit`/`Write` feature-implementation code in the main session — always delegate to `coder`, except editing config/docs files ([`AGENTS.md`](./AGENTS.md)).
4. When resolving a git conflict, never pull extra logic from the target branch into the source branch beyond what is required to clear the conflict ([`rules/git`](./.agents/rules/git.md)).
5. Never fabricate test/benchmark/tool results that were not actually run ([`rules/search-priority`](./.agents/rules/search-priority.md)).
6. Never commit/push files containing secrets (`.env`, credentials, private key, API key).
7. An explicit user request authorizes the stated outcome and the smallest necessary in-scope files and changes to deliver it; the user does not need to name implementation files. For requested bug fixes or optimization, investigate the cause and make related code or logic changes needed within the request without asking for approval at each step. Never add unrelated work or change behavior beyond the request; ask when its outcome or contract is materially ambiguous. Protected actions in #1–2 and external side effects still need explicit authorization ([`rules/coding`](./.agents/rules/coding.md#kiss-yagni-and-scope)).
8. Completing a task with concrete changes/results always produces a report via the `report` skill ([`rules/delivery`](./.agents/rules/delivery.md#mandatory-reporting)).

## When it applies

Loaded together with `CLAUDE.md`/`AGENTS.md` every session — applies to the main session and every subagent working in this repo. This is the highest-priority constraint summary; full details are in [`.agents/rules/`](./.agents/rules).
