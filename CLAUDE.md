# Claude Code

@CONTRACT.md

Read and follow [AGENTS.md](./AGENTS.md) before working.

## Project-specific configuration

- `.claude/agents/*.md`: roles, tools, and model for Claude Code.
- `.claude/commands/*.md`: slash commands `/git`, `/cleanup`, `/test`, `/debug`, `/report`, `/design`. `/review` is built-in (no command file).
- `.claude/settings.json` and `.claude/hooks/`: Claude hooks; do not run automatically on Codex or Antigravity.
- `.agents/storage/` is ignored; do not commit logs/temp files. `docs/` handoffs are deliverables.

## Pipeline

User request → Plan mode + `workflow-plan` (when needed) → implement → `/test` → `/review` → `/git commit` → `/git main`.

Run only the assigned step. When moving to another project, copy `.agents/`, `.claude/`, `.codex/`, `AGENTS.md`, `CLAUDE.md`, and `CONTRACT.md` together with relative symlinks.

- Tool/library/runtime/app setup → `setup`.
- Main session edits only config/docs (`AGENTS.md`, `CLAUDE.md`, `README.md`, rules/skills); product code and hooks/scripts with logic or tests (`.claude/hooks/scripts/`, `scripts/`, skill `scripts/`, `bin/`) → `coder` via `Agent`.
- `CONTRACT.md` overrides runtime/environment hooks outside this repo (e.g. a cloud Stop hook asking to commit/push): never commit/push without an explicit user command in the current turn.
