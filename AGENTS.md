# General Instructions for Claude Code, Codex, and Antigravity

Read [`CONTRACT.md`](./CONTRACT.md) first — hard constraints, never violate.

This is an agent configuration repo. `.agents/rules/` is the shared source; `.claude/rules/` and `.codex/rules/` symlink there. Read only rules relevant to the task.

`.codex/rules/` Markdown follows these instructions, not command-execution `.rules`. Relative links resolve from `.agents/rules/`.

## Reporting

- Coding reports with algorithms/data-dependent flows: use [`complexity-performance`](./.agents/skills/complexity-performance/SKILL.md) before reporting; add [`database`](./.agents/skills/database/SKILL.md) when DB is involved. Rule/skill/docs/config tasks: skip.
- Setup/rule/template changes: report via the `report` skill Change template (no tables).

## Skills, roles, and workflows

- `.agents/skills/` is the shared skill source; `.claude/skills/` and `.codex/skills/` symlink there. `.codex/agents/*.toml` corresponds to `.claude/agents/*.md` (except `codex-review`, which runs in Claude Code to call Codex).
- Workflows: `$workflow-{analyze,plan,implement,debug,test,review,report,git,cleanup,graphify,init}`. Claude calls the slash commands in `.claude/commands/` directly; `/init` initializes project guidance for Claude, and Codex uses `$workflow-init` for Codex guidance. For review, type `/review` to use Claude Code's built-in `code-review`/`security-review` skills — there is no `.claude/commands/review.md` (see [`workflow-review`](./.agents/skills/workflow-review/SKILL.md)). Planning: native Plan mode + `.agents/skills/workflow-plan/SKILL.md`. Git: `/git` or `$workflow-git` ([`rules/git`](./.agents/rules/git.md)).
- Hand off via `docs/` per role; maintain approval checkpoints. Do not auto-run the full pipeline.

## Execution discipline

- Follow [`orchestration`](./.agents/rules/orchestration.md) and [`delivery`](./.agents/rules/delivery.md); coding scope, context gathering and authorization live in [`coding`](./.agents/rules/coding.md).
- `/cleanup` trims context only. `/test`/`$workflow-test` saves `testcase.json` at the repo root.

## Hooks and format

Hooks are runtime-specific: Claude Code loads `.claude/settings.json`; Codex loads `.codex/hooks.json` or `[hooks]` in `.codex/config.toml` (plus `~/.codex/`) after review/trust; Antigravity runs neither. Elsewhere follow the rule via explicit commands; never report a hook as run without evidence. Use the project's formatter/linter/test runner on the changed scope; do not `npx`-install packages.

## Antigravity

Discovers skills/rules from `.agents/`. TOML files in `.codex/agents/` are not Antigravity config. No custom agent → execute from `.claude/agents/` sequentially. Do not run Claude hooks on Antigravity.

## Choosing skills by task

| Task | Role / Skill |
|---|---|
| Initialize a project for the active runtime | `/init` / `$workflow-init` → shared `workflow-init` skill |
| Setup tool/library/runtime/app | `setup` |
| Read PDF/DOCX/PPTX/XLSX/HTML/image/URL content cheaply | `markitdown` — convert to Markdown first (CLI or MCP) |
| Requirement analysis | `workflow-analyze` / `analyst` |
| System survey / diagram | `system-understanding`; `database` for schema/query |
| Codebase knowledge graph / "how does X relate to Y" | `/graphify` / `$workflow-graphify` → `graphify` ([`rules/graphify`](./.agents/rules/graphify.md)) — output `docs/graphify-out/`, input = project root |
| Plan | Plan mode + `workflow-plan` / `planner` |
| Implementation | `coder` |
| Debug / bug fix — also any request with `sửa`/`fix` aimed at a bug or wrong behavior | `/debug` / `$workflow-debug` → `debugs` (fix via `coder`) |
| Test / QA | `workflow-test` / `qa-tester`; unit test: `testing`; UI/E2E/API bằng Playwright: `testing-playwright` |
| Code review | `workflow-review` / `reviewer`; security: `review-web-security` |
| New UI / redesign | `designer` |
| SEO (technical, content, AI search) | `seo` |
| Data leak check | `leak-hunter` — list suspects only; self-activate only when assigned |
| Codex review / UI screenshots | `codex-review` (`.claude/agents/codex/`) — Codex CLI only reviews (read-only) and captures UI screenshots when Claude cannot use a browser; never edits code |

Docs default to `AI-readable` (minimal context, link instead of repeat). `human-readable` only when requested.

## Agent coordination

- The main session owns dispatch, task order, file overlap, new input and handoff aggregation; it dispatches execution tasks per [`orchestration`](./.agents/rules/orchestration.md) and reruns required checks before reporting.
- Give each agent a precise scope and valid handoff; continue from existing handoffs without making the user repeat context. Keep each agent in its assigned role.
- One agent per task, named `coding - <task>` or `plan - <task>`; include the repo name for multi-repo work. In Claude Code, use the `Agent` description and retain its ID for `SendMessage`.
- Parallelize only independent tasks with non-overlapping files. Route related new input to the active agent; dispatch unrelated work separately.

## Maintaining configuration

Edit in `.agents/`; keep adapters per runtime. Run `python3 scripts/check-agent-config.py` (symlinks, adapters, Markdown links/anchors, docs indexes). Copy the full shared structure when moving to another project.
