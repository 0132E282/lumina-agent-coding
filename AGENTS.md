# General Instructions for Claude Code, Codex, and Antigravity

Read [`CONTRACT.md`](./CONTRACT.md) first — hard constraints, never violate.

This is an agent configuration repo. `.agents/rules/` is the single shared source; `.claude/rules/` and `.codex/rules/` symlink there. Read all rules in `.agents/rules/` before coding; apply only the relevant parts.

## Sources and rules

- TypeScript: no `any`; existing/derived types, group by domain in `types/`.
- Real DB is read-only by default. Commit/push/deploy only when explicitly requested.
- Do not fabricate test results, benchmarks, or tool output.
- Coding reports with algorithms/data-dependent flows: use [`complexity-performance`](./.agents/skills/complexity-performance/SKILL.md) before reporting; add [`database`](./.agents/skills/database/SKILL.md) when DB is involved. Rule/skill/docs/config tasks: skip.
- Setup/template changes: report as `- File:` / `Description:` / `Trigger condition:` text (no tables).

`.codex/rules/` Markdown follows these instructions, not command-execution `.rules`. Relative links resolve from `.agents/rules/`.

## Skills, roles, and workflows

- `.agents/skills/` is the shared skill source; `.claude/skills/` and `.codex/skills/` symlink there. `.codex/agents/*.toml` corresponds to `.claude/agents/*.md`.
- Workflows: `$workflow-{analyze,plan,implement,test,review,report,git,cleanup}`. Claude calls `/git`, `/cleanup` directly (real command files in `.claude/commands/`); for review, type `/review` to use Claude Code's built-in `code-review`/`security-review` skills — there is no `.claude/commands/review.md` (see [`workflow-review`](./.agents/skills/workflow-review/SKILL.md)). Planning: native Plan mode + `.agents/skills/workflow-plan/SKILL.md`. Git: `/git` or `$workflow-git`, default `commit all`; no auto-push, no temp/secret files.
- Hand off via `docs/` per role; maintain approval checkpoints. Do not auto-run the full pipeline.
- On task completion → mandatory report via `report` skill ([`rules/mandatory-report`](./.agents/rules/mandatory-report.md)).

## Execution discipline

Follow [implementation](./.agents/rules/implementation.md) directly. `/cleanup` trims context only. `/test`/`$workflow-test` saves to `testcase.json` at repo root.

- Implement immediately when evidence is sufficient; no extra probing.
- Scope before coding; preserve all behavior outside the assigned scope; get approval for out-of-scope changes.
- Before completing: check diff for N+1, render/state/effect loops, and out-of-scope changes across the stack.
- Full plan completion: create `docs/repo/<title-slug>-<yyyyMMdd>.md` (Not Run); update `docs/repo/index.json` and `docs/index.json`.
- Small, clear task → `coding-agent` directly. Plan/subagent/review only when truly warranted.

## Hooks and format

Hooks are runtime-specific: Claude Code loads `.claude/settings.json`, Codex loads `.codex/hooks.json` or inline `[hooks]` tables in `.codex/config.toml` (and user-level hooks from `~/.codex/`), while Antigravity does not automatically run either runtime's hooks. Codex project hooks require review/trust before they run. Follow the equivalent rule through the active runtime's hook configuration or explicit commands; do not report a hook as run without evidence that the runtime executed it. Use the project's formatter/linter/test runner on the changed scope; do not `npx`-install packages.

## Antigravity

Discovers skills/rules from `.agents/`. TOML files in `.codex/agents/` are not Antigravity config. No custom agent → execute from `.claude/agents/` sequentially. Do not run Claude hooks on Antigravity.

## Choosing skills by task

| Task | Role / Skill |
|---|---|
| Setup tool/library/runtime/app | `setup-agent` |
| System survey / diagram | `system-understanding`; `system-diagrams`; `database` for schema/query |
| Implementation | `coding-agent` — main session never `Edit`/`Write` product code |
| New UI / redesign | `ux-ui-designer-agent` |
| SEO | `seo-website`; content: `seo-content-website` |
| Data leak check | `leak-hunter` — list suspects only; self-activate only when assigned |

Docs default to `AI-readable` (minimal context, link instead of repeat). `human-readable` only when requested.

## Agent coordination

- Next agent reads the handoff from `docs/` — do not make the user re-explain it.
- Each agent stays in its role; valid previous handoff → reuse.
- Delegate with exact file/diff/scope in the prompt.

## Maintaining configuration

Edit in `.agents/`; keep adapters per runtime. Run `python3 scripts/check-agent-config.py`. Copy the full shared structure when moving to another project.
