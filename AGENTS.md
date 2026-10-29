# General Instructions for Claude Code, Codex, and Antigravity

Read [`CONTRACT.md`](./CONTRACT.md) first — hard constraints, never violate.

This is an agent configuration repo. `.agents/rules/` is the single shared source; `.claude/rules/` and `.codex/rules/` symlink there. Read all rules in `.agents/rules/` before coding; apply only the relevant parts.

`.codex/rules/` Markdown follows these instructions, not command-execution `.rules`. Relative links resolve from `.agents/rules/`.

## Reporting

- Coding reports with algorithms/data-dependent flows: use [`complexity-performance`](./.agents/skills/complexity-performance/SKILL.md) before reporting; add [`database`](./.agents/skills/database/SKILL.md) when DB is involved. Rule/skill/docs/config tasks: skip.
- Setup/rule/template changes: report via the `report` skill Change template (no tables).

## Skills, roles, and workflows

- `.agents/skills/` is the shared skill source; `.claude/skills/` and `.codex/skills/` symlink there. `.codex/agents/*.toml` corresponds to `.claude/agents/*.md` (except `codex-review`, which runs in Claude Code to call Codex).
- Workflows: `$workflow-{analyze,plan,implement,debug,test,review,report,git,cleanup}`. Claude calls the slash commands in `.claude/commands/` directly; for review, type `/review` to use Claude Code's built-in `code-review`/`security-review` skills — there is no `.claude/commands/review.md` (see [`workflow-review`](./.agents/skills/workflow-review/SKILL.md)). Planning: native Plan mode + `.agents/skills/workflow-plan/SKILL.md`. Git: `/git` or `$workflow-git` ([`rules/git`](./.agents/rules/git.md)).
- Hand off via `docs/` per role; maintain approval checkpoints. Do not auto-run the full pipeline.

## Execution discipline

Follow [implementation](./.agents/rules/delivery.md#triển-khai-theo-yêu-cầu) directly. `/cleanup` trims context only. `/test`/`$workflow-test` saves to `testcase.json` at repo root.

- Implement immediately when evidence is sufficient; no extra probing.
- Gates: scope/authorization → [`coding`](./.agents/rules/coding.md#kiss-yagni-và-phạm-vi); UI → [`frontend`](./.agents/rules/frontend.md); before handoff → [`delivery`](./.agents/rules/delivery.md#chất-lượng-và-bằng-chứng); full plan completion → [`docs`](./.agents/rules/docs.md#đồng-bộ-tài-liệu).
- Small, clear task → `coder` directly. Plan/subagent/review only when truly warranted.

## Hooks and format

Hooks are runtime-specific: Claude Code loads `.claude/settings.json`; Codex loads `.codex/hooks.json` or `[hooks]` in `.codex/config.toml` (plus `~/.codex/`) after review/trust; Antigravity runs neither. Elsewhere follow the rule via explicit commands; never report a hook as run without evidence. Use the project's formatter/linter/test runner on the changed scope; do not `npx`-install packages.

## Antigravity

Discovers skills/rules from `.agents/`. TOML files in `.codex/agents/` are not Antigravity config. No custom agent → execute from `.claude/agents/` sequentially. Do not run Claude hooks on Antigravity.

## Choosing skills by task

| Task | Role / Skill |
|---|---|
| Setup tool/library/runtime/app | `setup` |
| Requirement analysis | `workflow-analyze` / `analyst` |
| System survey / diagram | `system-understanding`; `database` for schema/query |
| Plan | Plan mode + `workflow-plan` / `planner` |
| Implementation | `coder` |
| Debug / bug fix — also any request with `sửa`/`fix` aimed at a bug or wrong behavior | `/debug` / `$workflow-debug` → `debugs` (fix via `coder`) |
| Test / QA | `workflow-test` / `qa-tester`; unit test: `testing` |
| Code review | `workflow-review` / `reviewer`; security: `review-web-security` |
| New UI / redesign | `designer` |
| SEO (technical, content, AI search) | `seo` |
| Data leak check | `leak-hunter` — list suspects only; self-activate only when assigned |
| Codex review / UI screenshots | `codex-review` (`.claude/agents/codex/`) — Codex CLI only reviews (read-only) and captures UI screenshots when Claude cannot use a browser; never edits code |

Docs default to `AI-readable` (minimal context, link instead of repeat). `human-readable` only when requested.

## Agent coordination

- Next agent reads the handoff from `docs/` — do not make the user re-explain it.
- Each agent stays in its role; valid previous handoff → reuse.
- Delegate with exact file/diff/scope in the prompt. Subagents hand back with the [handoff template](./.agents/skills/report/assets/subagent-handoff-template.md); only the orchestrator reports to the user.
- One agent per task: `coder` named `coding - <task>`, `planner` named `plan - <task>` (e.g. `coding - login form`); when the work spans several repos, include the repo: `coding - <repo> - <task>` (e.g. `coding - web-app - login form`). In Claude Code set the name as the `Agent` call's `description` and keep the returned agent ID for `SendMessage`. Never reuse an agent for an unrelated task.
- Every plan task and every bug fix is implemented by a `coder` agent, never by the main session. Plan: one `coder` per `content.codingGroups` entry (`coding - <group name>`) with that group's tasks/files, run in `dependsOnGroups` order. Bug fix: one `coder` (`coding - fix <bug>`) after diagnosis via `/debug`.
- New user input (text, image, feedback) while agents run: the orchestrator decides itself, without asking, whether it relates to or affects a running agent's task/files.
  - Yes → `SendMessage` to each affected agent (images by file path; a finished agent is resumed the same way, keeping its context).
  - No (e.g. a separate bug) → spawn a new `coder` immediately (bugs: diagnose via `/debug` first), without waiting for the others.
- Run agents in parallel only when they have no dependency and their file sets do not overlap; otherwise run sequentially or isolate with a worktree (`isolation: worktree`).
- After a hand-back, the orchestrator re-runs the required checks itself before reporting; a subagent's self-reported result is not evidence.

## Maintaining configuration

Edit in `.agents/`; keep adapters per runtime. Run `python3 scripts/check-agent-config.py` (symlinks, adapters, Markdown links/anchors, docs indexes). Copy the full shared structure when moving to another project.
