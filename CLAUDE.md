# Claude Code

@CONTRACT.md

Read and follow [AGENTS.md](./AGENTS.md) before working. `.agents/rules/` and `.agents/skills/` are the single shared source; `.claude/rules/` and `.claude/skills/` symlink there.

## Project-specific configuration

- `.claude/agents/*.md`: roles, tools, and model for Claude Code.
- `.claude/commands/*.md`: slash commands `/git`, `/cleanup`, `/test`, `/report`, `/design`. No custom `/review` command file — typing `/review` uses Claude Code's built-in `code-review`/`security-review` skills directly (see [`workflow-review`](./.agents/skills/workflow-review/SKILL.md)). Planning uses native Plan mode + `.agents/skills/workflow-plan/SKILL.md`.
- `.claude/settings.json` and `.claude/hooks/`: Claude hooks; do not run automatically on Codex or Antigravity.
- `.agents/storage/` is ignored; do not commit logs/temp files. `docs/` handoffs are deliverables.
- Docs default to `AI-readable`; `human-readable` only when requested.

## Pipeline

User request → Plan mode + `workflow-plan` (when needed) → implement → `/test` → `/review` → `/git commit` → `/git main`.

Run only the assigned step. When moving to another project, copy `.agents/`, `.claude/`, `AGENTS.md`, and `CLAUDE.md` together with relative symlinks.

- Code implementation → `coding-agent` via Agent tool; main session never `Edit`/`Write` product code.
- Tool/library/runtime/app setup → `setup-agent`.
- Main session may directly edit config/docs (`AGENTS.md`, `CLAUDE.md`, `README.md`, rules/skills).
- Any task completion → mandatory report via `report` skill ([`rules/delivery`](./.agents/rules/delivery.md#báo-cáo-bắt-buộc)).

## Execution discipline

Same as [AGENTS.md § Execution discipline](./AGENTS.md). Scope before coding; approve out-of-scope changes before touching them; check diff for N+1 and loops before finishing.

## Subagent coordination

- Next subagent reads the handoff from `docs/` via `Agent` — do not make the user re-explain it.
- Each subagent stays in its role; valid previous handoff → reuse.
- Delegate with exact file/diff/scope in the prompt.
