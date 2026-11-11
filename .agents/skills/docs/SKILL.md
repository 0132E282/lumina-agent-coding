---
name: docs
description: "Write or sync project docs (README.md, CLAUDE.md, docs/): sync when docs exist (compare with the codebase, fix outdated parts) or write new when none exist. AI-readable by default. Use when creating or updating docs; diagrams use system-understanding; never designs HLD/LLD on its own."
license: MIT
metadata:
  version: '1.4'
---

# 🔄 Docs

Write new or sync README, project guidance and `docs/`; verify all content against real sources ([`search-priority`](../../rules/search-priority.md)). Follow the schema and catalog flow in [`docs-sync`](../../rules/docs.md#docs-sync) and [`documentation-reading-and-toc`](../../rules/docs.md#docs-registry). Never design HLD/LLD; hand off to [`architect`](../../agents/architect.md). When a current-state diagram is needed, use [`system-understanding`](../system-understanding/references/diagrams.md).

## Contents

- [Reading docs by audience](#reading-docs-by-audience)
- [Mode 1 — Sync](#mode-1--sync-docs-exist)
- [Mode 2 — Write new](#mode-2--write-new-nothing-to-compare-against)
- [Templates by document type](#templates-by-document-type)

## Reading docs by audience

Write **AI-readable** by default (short, stable headings, facts/paths/contracts/verification results; never repeat a diagram in prose); switch to **human-readable** only when the user asks. Detailed rules and how to use Mermaid diagrams to reduce reading load: [references/writing-style.md](./references/writing-style.md).

## Mode 1 — Sync (docs exist)

Default scope: `README.md`, `CLAUDE.md` (if present), `docs/**/*.md` (if present). The user may limit it to a specific file.

1. Extract verifiable "claims": paths, agent/skill/command/hook names, counts/listings, specific behavior descriptions.
2. Check each claim against reality: paths → `Glob`; agent/skill/command names → the real list in `.claude/agents|skills|commands/` (read the frontmatter, never infer); behavior descriptions → read the exact source file to match.
3. Classify: **clearly wrong** (file no longer exists, renamed, wrong numbers) → fix immediately per the reality just read; **unsure** (ambiguous, not directly verifiable) → never delete on your own, put into "needs more info" (same as how [`workspace-auditor`](../../agents/workspace-auditor.md) handles uncertain items).
4. Directly fix the parts confirmed wrong, keeping the doc's tone/structure — never rewrite the whole file, never add features/new sections beyond fixing right vs wrong ([`rules/coding`](../../rules/coding.md#kiss-yagni-and-scope)).
5. Report per `change-report-template.md` of the [`report`](../report/SKILL.md) skill: each fix records _before → after_ + evidence, plus a "needs more info" list if any.

When a task changes an API and the repository has a related Postman collection/docs, update the existing requests and examples there in the same turn. Find and adjust the suitable collection/request first; never create a duplicate collection, request or new file when redoing docs. Add a new entry only if none exists and the task requires it.

## Mode 2 — Write new (nothing to compare against)

Use when a project/module/feature has no CLAUDE.md/README and it must be written first — similar to the built-in `/init` but **leaner and better optimized**: record only what is truly needed to work effectively in the repo, never list the whole file structure or repeat what Glob/Grep can look up.

1. Identify the main stack/language from real manifest files (`package.json`, `composer.json`, `pyproject.toml`, `go.mod`...) — never guess from directory names.
2. Read the **real** dev/build/test/lint commands in use (manifest scripts, `Makefile`, CI config) — record only commands verified to exist, never invent "common" commands for that stack.
3. Read a few representative sample files (not the whole codebase) to extract the conventions actually applied — naming, repeated module structure, test patterns — never impose the stack's generic convention when the real code does it differently.
4. Write in a lean structure, one short paragraph per section, drop inapplicable sections with a reason instead of leaving them empty:
   - **Project purpose** (1–2 sentences).
   - **Main directory structure** — only high-level, navigation-meaningful, not every file.
   - **Common commands** (dev/build/test/lint) — only commands verified runnable.
   - **Important conventions to know before changing code** — mandatory conventions/rules if any, patterns actually repeated.
5. Never design system architecture (HLD/LLD) — that belongs to agent [`architect`](../../agents/architect.md). If only existing structure/flow in the codebase needs illustrating, use [`system-understanding`](../system-understanding/references/diagrams.md).

## Templates by document type

Read the registry and existing files per the rule at the top of the skill before choosing a template; a template is only a frame to fill from verified sources. Detailed use of each type, schemas, menu update rules and pre-handoff checks: [references/templates.md](./references/templates.md).

- [Markdown document](assets/document-template.md) · [Repo-level testcase](assets/repo-testcase-template.md) · [Per-feature testcase](assets/feature-testcase-template.json) · [Implementation plan](assets/implementation-plan-template.json) · [Menu JSON](assets/menu-template.json)
