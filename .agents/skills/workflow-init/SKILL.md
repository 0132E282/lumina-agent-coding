---
name: workflow-init
description: "Initialize a project for the active Claude or Codex runtime by reading its real structure, creating missing project guidance and an agent architecture tree, securing its contract, documenting design, and building the first Graphify index."
---

# workflow-init

Use this workflow when the user invokes Claude `/init` or Codex `$workflow-init`. The invocation identifies the active runtime; never infer it from installed global configuration. Claude uses `.claude/commands/init.md`; Codex invokes this shared skill directly.

## Scope and safety

- Operate on the current project root. Resolve it from the Git root when available; otherwise use the current directory. In a monorepo, use the current package unless the user names the whole repository.
- Read existing project guidance, `CONTRACT.md`, manifests/lockfiles, representative source files, tests and CI configuration. Do not read secret values or scan `.env`, credential, key, generated, cache or dependency directories.
- Create only missing files. Read and preserve existing `CLAUDE.md`, `AGENTS.md`, `CONTRACT.md`, `DESIGN.md`, `ARCHITECTURE.md` and `AGENT_ARCHITECTURE.md`; never replace them wholesale. If an existing contract lacks security protections, report the gaps without silently changing its terms.
- Do not install dependencies, modify databases, deploy, publish, commit or push. Never include secrets or PII in generated instructions, design documents or Graphify output.

## Agent architecture tree

- During every initialization, inspect the actual agent definitions and routing in the target project, whether or not the runtime instruction file already exists. Check applicable entrypoints and agent configuration (for example `AGENTS.md`, `CLAUDE.md`, `.agents/`, `.claude/agents/`, `.codex/agents/`), plus referenced dispatch rules, workflows and handoff/artifact locations. Read only files relevant to the map; do not scan secrets, generated content or dependency directories.
- Create a concise root-level `AGENT_ARCHITECTURE.md` as an ASCII tree. Show the verified entrypoint/orchestrator, actual custom agents and their responsibilities, how work is routed or handed off, and the relevant file paths. Keep roles, skills, workflows, tools and runtime adapters clearly distinguished; do not present a skill or tool as an agent.
- Infer the tree from repository evidence; never invent agents or hierarchy. If the project has no custom agent definitions, state that and show the verified runtime entrypoint/workflow structure instead.
- Create the file only when missing. Preserve an existing `AGENT_ARCHITECTURE.md`; report its presence and any material mismatch with the inspected structure without silently rewriting it.

## Runtime-specific project instructions

- `/init` in Claude Code creates only a missing project `CLAUDE.md`; `$workflow-init` in Codex creates only a missing project `AGENTS.md`. Do not create the other runtime's entrypoint unless the user asks. If the matching file already exists, preserve it and report its relevant content instead of replacing it.
- Keep instructions brief and factual: project purpose, verified stack, high-level structure, verified development/build/test/lint commands, project conventions, and links to applicable `CONTRACT.md` and design docs. Record assumptions explicitly; never invent commands or architecture.

## Contract and design documents

1. If `CONTRACT.md` is missing, create a concise project contract grounded in the inspected project. Include scope boundaries; secrets and PII handling; authorization/tenant checks where applicable; real database read-only by default; approval for schema/data writes and external or irreversible side effects; and honest reporting of checks. Use placeholders only, never real credentials.
2. If a contract exists, preserve it. Check it for the protections above and report any gaps or conflicts; do not silently rewrite project terms.
3. Create a lean, evidence-based `DESIGN.md` from the real UI, routes and design system. Select only applicable sections from [`system-understanding/references/design-sets.md`](../system-understanding/references/design-sets.md); state assumptions and unknowns. Create `ARCHITECTURE.md` only when the project's type and complexity warrant it.
4. Place the main design documents beside the project's external `CLAUDE.md` and `CONTRACT.md`, outside the project root, as specified by [`rules/system-design`](../../rules/system-design.md). If that guidance directory cannot be identified, ask for its location before writing design documents; do not guess a parent path.

## Graphify

- The user-requested initialization authorizes the first full Graphify build. Use the installed Graphify skill if available; do not install it or fabricate output if unavailable.
- Use the project root as input and `docs/graphify-out/` as output. Exclude secrets, PII, generated files, dependencies, caches and `docs/graphify-out/` itself. Do not hand-edit generated graph artifacts.
- If a graph already exists, preserve it and use the installed skill's update mode only when needed. Report the actual command and result.

## Run order

1. Identify runtime from the entrypoint and settle the project/package root.
2. Survey project instructions, contract, stack, representative code and available commands without reading secrets.
3. Inspect agent definitions, dispatch/routing, relevant workflows and handoff paths; determine the verified tree and whether `AGENT_ARCHITECTURE.md` is missing. Determine the complete set of other missing files and the design-document destination before writing. Ask only if a material location, contract or runtime ambiguity remains.
4. Create the missing runtime instructions, contract, design documents and agent architecture tree in scope; build/update Graphify as above.
5. Verify paths, links, tree accuracy against source files, secret exclusion and rerun idempotency. Report files created, preserved existing files (including an existing agent architecture map), security gaps, Graphify result and any blocked items. Never claim that unavailable checks ran.

Claude command: [`/init`](../../../.claude/commands/init.md). Codex entrypoint: `$workflow-init`.
