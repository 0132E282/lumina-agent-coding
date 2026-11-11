---
name: coding-standards
description: "Cross-stack code checklist: DRY/SOLID/SRP/fail-fast, comments, strict TypeScript, readability, KISS/YAGNI. Use when writing, modifying or reviewing code and checking against code standards."
---

# Coding standards

Read the invariants in [`coding-principles`](../../rules/coding.md#coding-principles), [`comments`](../../rules/coding.md#disciplined-comments), [`type-safety`](../../rules/coding.md#type-safety) and [`simplicity`](../../rules/coding.md#kiss-yagni-and-scope) before using this checklist.

## DRY, SOLID and responsibility

- Merge only logic with the same business meaning and the same reason to change. Rule of Three: tolerate two repetitions; refactor on the third.
- Before creating a new resource/config, look for one with the same purpose in code/config and reuse it when suitable.
- Prefer composition; use inheritance only for a real, stable `is-a` relationship. Create interfaces/DI only when real substitution is needed.
- In request flows, separate HTTP, validation, authorization and business logic. Business logic must not depend on HTTP/framework if it needs reuse or independent testing.
- Validate boundaries and business conditions before writing data; return specific errors. Use early returns, meaningful names and single-responsibility functions.
- Keep the codebase format. New/modified text files must have a final newline and keep the existing line ending; do not format files outside scope.

## Comment

- Never comment self-explanatory logic. Explain only `why`: business constraints, workarounds or surprising third-party behavior.
- Labels: `*` important info, `!` warning, `?` question needing confirmation, `TODO:` with context; `@param`/`@return` only when adding type info the signature lacks.
- Keep no commented-out code, context-free TODOs, banners, stale comments or PHPDoc/JSDoc repeating the signature.
- Max 180 characters per line, 1–3 lines per paragraph. Longer -> cut to the invariant/consequence, split the function or move to docs; multiple warnings each get their own `!` line.
- When changing code, update or delete comments that are no longer correct.

## TypeScript

- Never use `any`, implicit `any`, `as unknown as T`, `@ts-ignore` or disabling lint to bypass types. Use `unknown` for unknown data then validate/narrow.
- Find and reuse domain/SDK/schema types first; use inference when clear enough. Derive with `extends`, intersection, `Pick`, `Omit`, `Partial` when semantically right.
- Create new types only for truly different contracts/concepts. Group types by domain in `types/` or the module convention; never redeclare in components/services/hooks.
- Use `import type` where appropriate; import generated types from the source and derive only when needed.
- Run the existing type checker/lint; fix errors at the source, never use assertions to hide unverified data.

## KISS/YAGNI

- Choose the simplest solution for the current requirement; three repeated lines beat a premature abstraction.
- Do not add config/interfaces/layers or design patterns for hypothetical needs. If a solution needs a new diagram to explain, simplify it.
- On finding out-of-scope issues, note the file, impact and reason and ask for approval; continue the independent parts. Cleanup, accessibility, optimization or convention do not by themselves grant permission to change behavior.

## Handoff checklist

- Duplicate logic was distinguished by business meaning; new abstractions have real need.
- Boundary validation, authorization and side effects are in the right layer.
- Comments and types follow the items above.
- The diff has no out-of-scope changes; relevant formatter, lint and type checker were run or explicitly noted as not run.
