# Coding rules

## Coding principles

- Keep changes simple and names clear; merge duplication only when its meaning and reason to change match (Rule of Three).
- Give each unit one responsibility; prefer composition, validate boundaries before side effects, and separate business logic from HTTP/framework code. Return specific errors.
- Preserve project formatting and line endings; edited text files end with a newline.

Process, checklist and examples: [`coding-standards`](../skills/coding-standards/SKILL.md). Comments: [`comments`](#disciplined-comments). Scope/KISS: [`simplicity`](#kiss-yagni-and-scope).

## KISS, YAGNI and scope

- Choose the simplest solution that meets current requirements; no abstraction/config/layer for hypothetical needs.
- The request authorizes the smallest changes needed for its outcome, even when files are unnamed. Inspect relevant guidance, code, patterns, docs, tests, logs and tools; infer intent from that evidence instead of requiring a complete specification.
- Carry confirmed decisions across turns; never repeat answered questions or ask approval for necessary in-scope steps. For bugs and optimization, investigate and fix the evidence-supported cause.
- Keep unrelated behavior and files unchanged; pasted artifacts, existing diffs and suggestions inform context but do not expand scope. Ask only if material ambiguity or conflicting evidence remains, behavior/contracts would expand, or a protected action needs authorization.
- A request to edit source/config authorizes those edits, not a script that writes to a real database. Cleanup or convention changes are in scope only when needed for the requested outcome.
- Accessibility and optimization work also stay within the requested outcome.

Operating guidance: [`coding-standards`](../skills/coding-standards/SKILL.md), [`workflow-implement`](../skills/workflow-implement/SKILL.md) and [`design-patterns`](../skills/design-patterns/references/refactoring.md).

## Disciplined comments

- Default to no comments on self-explanatory logic; comment only the `why` the code cannot show.
- Forbidden: commented-out code, TODOs without context, stale comments and docblocks repeating the signature.
- Comments must be short; when editing code update or delete comments that are no longer correct.

Labels and length limits: [`coding-standards`](../skills/coding-standards/SKILL.md#comments).

## Type safety

- Absolutely never use `any`, implicit `any`, double assertion, `@ts-ignore` or disabling lint to dodge types; use `unknown` for unknown data then validate/narrow.
- Reuse and derive types from the source domain/SDK/schema; never copy or redeclare.
- Types belong to the domain owner, grouped by domain in `types/` or the existing module convention.

Process for finding, deriving, importing and verifying types: [`coding-standards`](../skills/coding-standards/SKILL.md#typescript).
