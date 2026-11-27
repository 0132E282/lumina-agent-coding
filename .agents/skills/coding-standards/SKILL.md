---
name: coding-standards
description: "Apply shared code quality rules when writing or reviewing code."
license: MIT
metadata:
  version: "1.0"
---

# Coding standards

Use [`coding-principles`](../../rules/coding.md#coding-principles), [`simplicity`](../../rules/coding.md#kiss-yagni-and-scope), [`comments`](../../rules/coding.md#disciplined-comments) and [`type-safety`](../../rules/coding.md#type-safety) as the source of truth. Open only sections relevant to the task.

Before changing code, check nearby implementations and project conventions. Reuse existing types, components and tools where suitable; run available format, lint, type and test commands for the changed scope. Do not install dependencies just to check.

## Reuse and design

- Look for an existing resource/config with the same purpose before creating one.
- Use interfaces and dependency injection only when real substitution is needed; use composition unless inheritance models a stable `is-a` relationship.

## Comments

- Explain only why; use `*`, `!`, `?` or contextual `TODO:` labels where useful. Add `@param`/`@return` only when the signature lacks the type information.
- Avoid commented-out code, context-free TODOs, banners, stale comments and docblocks that repeat signatures. Update or remove comments made incorrect by a change.
- Keep lines under 180 characters and paragraphs to 1–3 lines; condense, split the function or move detail to docs when needed.

## TypeScript

- Never use `any`, implicit `any`, `as unknown as T`, `@ts-ignore` or lint suppression to bypass types. Validate `unknown` at boundaries.
- Reuse or derive domain/SDK/schema types; create types only for distinct concepts and group them by domain. Use `import type` where appropriate.
- Run the existing type checker/linter and fix errors at the source; never use assertions to hide unverified data.
