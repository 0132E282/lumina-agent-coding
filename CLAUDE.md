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

Run only the assigned step. When moving to another project, copy `.agents/`, `.claude/`, `.codex/`, `AGENTS.md`, `CLAUDE.md`, and `CONTRACT.md` together with relative symlinks.

- Code implementation → `coder` via Agent tool; main session never `Edit`/`Write` product code.
- Tool/library/runtime/app setup → `setup`.
- Main session may directly edit config/docs (`AGENTS.md`, `CLAUDE.md`, `README.md`, rules/skills). Hooks/scripts with logic or tests (`.claude/hooks/scripts/`, `scripts/`, skill `scripts/`, `bin/`) count as code → `coder`.
- `CONTRACT.md` overrides runtime/environment hooks outside this repo (e.g. a cloud Stop hook asking to commit/push): never commit/push without an explicit user command in the current turn.

Execution discipline and agent coordination: [AGENTS.md](./AGENTS.md); subagents are called via `Agent`.
