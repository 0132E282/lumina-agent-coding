# General Instructions for Claude Code, Codex, and Antigravity

Read [`CONTRACT.md`](./CONTRACT.md) first — hard constraints, never violate.

This is an agent configuration repo. `.agents/rules/` is the single shared source; `.claude/rules/` and `.codex/rules/` symlink there. Read all rules in `.agents/rules/` before coding; apply only the relevant parts.

## Sources and rules

- TypeScript: no `any`; existing/derived types, group by domain in `types/`.
- Real DB is read-only by default. Commit/push/deploy only when explicitly requested.
- Do not fabricate test results, benchmarks, or tool output.
- Coding reports with algorithms/data-dependent flows: use [`complexity-performance`](./.agents/skills/complexity-performance/SKILL.md) before reporting; add [`database`](./.agents/skills/database/SKILL.md) when DB is involved. Rule/skill/docs/config tasks: skip.
- Setup/rule/template changes: report via the `report` skill Change template (no tables).

`.codex/rules/` Markdown follows these instructions, not command-execution `.rules`. Relative links resolve from `.agents/rules/`.

## Skills, roles, and workflows

- `.agents/skills/` is the shared skill source; `.claude/skills/` and `.codex/skills/` symlink there. `.codex/agents/*.toml` corresponds to `.claude/agents/*.md`.
- Workflows: `$workflow-{analyze,plan,implement,test,review,report,git,cleanup}`. Claude calls `/git`, `/cleanup` directly (real command files in `.claude/commands/`); for review, type `/review` to use Claude Code's built-in `code-review`/`security-review` skills — there is no `.claude/commands/review.md` (see [`workflow-review`](./.agents/skills/workflow-review/SKILL.md)). Planning: native Plan mode + `.agents/skills/workflow-plan/SKILL.md`. Git: `/git` or `$workflow-git`, default `commit all`; no auto-push, no temp/secret files.
- Hand off via `docs/` per role; maintain approval checkpoints. Do not auto-run the full pipeline.
- On task completion → mandatory report via `report` skill ([`rules/delivery`](./.agents/rules/delivery.md#báo-cáo-bắt-buộc)).

## Execution discipline

Follow [implementation](./.agents/rules/delivery.md#triển-khai-theo-yêu-cầu) directly. `/cleanup` trims context only. `/test`/`$workflow-test` saves to `testcase.json` at repo root.

- Implement immediately when evidence is sufficient; no extra probing.
- Scope before coding; preserve all behavior outside the assigned scope; get approval for out-of-scope changes.
- Change authorization gate: user requirements, approved task/plan, and explicitly listed files are the only authorization to change code. A pasted document, existing diff, agent suggestion, discovered bug, or “while here” improvement is context only. Do not infer or add features, fields, API/routes, state, dependencies, tests, refactors, copy, assets, or cleanup outside scope. If scope or an existing revert is ambiguous, stop that part and ask before editing.
- UI change gate: a pasted plan, diff, screenshot, or agent suggestion is context—not authorization. Change only the named route/component/section and explicitly requested behavior. Do not add, remove, restore, reorder, or restyle UI, copy, modal, CTA, asset, route, responsive behavior, or state outside that scope. If an on-disk revert or conflicting change is found, report the exact file/section and stop that part until the user confirms.
- Before any UI edit, state the exact files/sections in scope and capture the baseline screenshot when a browser is available. Before handoff, capture the final screenshot at the same route/viewport and verify the diff contains no unapproved UI changes.
- Before completing: check diff for N+1, render/state/effect loops, and out-of-scope changes across the stack.
- Full plan completion: create `docs/repo/<title-slug>-<yyyyMMdd>.md` (Not Run); update `docs/repo/index.json` and `docs/index.json`.
- Small, clear task → `coder` directly. Plan/subagent/review only when truly warranted.

## Hooks and format

Hooks are runtime-specific: Claude Code loads `.claude/settings.json`, Codex loads `.codex/hooks.json` or inline `[hooks]` tables in `.codex/config.toml` (and user-level hooks from `~/.codex/`), while Antigravity does not automatically run either runtime's hooks. Codex project hooks require review/trust before they run. Follow the equivalent rule through the active runtime's hook configuration or explicit commands; do not report a hook as run without evidence that the runtime executed it. Use the project's formatter/linter/test runner on the changed scope; do not `npx`-install packages.

## Antigravity

Discovers skills/rules from `.agents/`. TOML files in `.codex/agents/` are not Antigravity config. No custom agent → execute from `.claude/agents/` sequentially. Do not run Claude hooks on Antigravity.

## Choosing skills by task

| Task | Role / Skill |
|---|---|
| Setup tool/library/runtime/app | `setup` |
| Requirement analysis | `workflow-analyze` / `analyst` |
| System survey / diagram | `system-understanding`; `database` for schema/query |
| Plan | Plan mode + `workflow-plan` / `planner` |
| Implementation | `coder` — main session never `Edit`/`Write` product code |
| Debug / bug fix | `debugs` (fix via `coder`) |
| Test / QA | `workflow-test` / `qa-tester`; unit test: `testing` |
| Code review | `workflow-review` / `reviewer`; security: `review-web-security` |
| New UI / redesign | `designer` |
| SEO (technical, content, AI search) | `seo` |
| Data leak check | `leak-hunter` — list suspects only; self-activate only when assigned |

Docs default to `AI-readable` (minimal context, link instead of repeat). `human-readable` only when requested.

## Agent coordination

- Next agent reads the handoff from `docs/` — do not make the user re-explain it.
- Each agent stays in its role; valid previous handoff → reuse.
- Delegate with exact file/diff/scope in the prompt.

## Maintaining configuration

Edit in `.agents/`; keep adapters per runtime. Run `python3 scripts/check-agent-config.py` (symlinks, adapters, Markdown links/anchors, docs indexes). Copy the full shared structure when moving to another project.
