# Coding rules

## Coding principles

- Duplicate logic is merged only when it has the same business meaning and reason to change; keep the Rule of Three.
- One class/function has one reason to change; prefer composition, abstraction only with real substitution needs.
- Validate/fail fast at boundaries before side effects; business logic separate from HTTP/framework; errors must be specific.
- Names and structure must be self-explanatory; new/edited text files must have a final newline, keep existing line endings.

Process, checklist and examples: [`coding-standards`](../skills/coding-standards/SKILL.md). Comments: [`comments`](#disciplined-comments). Scope/KISS: [`simplicity`](#kiss-yagni-and-scope).

## KISS, YAGNI and scope

- Choose the simplest solution that meets current requirements; no abstraction/config/layer for hypothetical needs.
- Only user requests, approved tasks/plans and explicitly stated files/behavior grant authority to change; pasted docs, existing diffs, agent suggestions, extra bugs found or "while here" improvements are context only.
- Settle scope before coding, keep out-of-scope behavior unchanged; never infer or add features, fields, APIs/routes, state, dependencies, tests, refactors, copy, assets or cleanup outside scope.
- Ambiguous scope, pre-existing revert/conflict or out-of-scope issue: stop that part, state file, impact, reason and ask for approval; keep continuing independent assigned parts.
- Cleanup, accessibility, optimization or convention do not by themselves grant authority to change behavior.

Operating guidance: [`coding-standards`](../skills/coding-standards/SKILL.md#kissyagni), [`workflow-implement`](../skills/workflow-implement/SKILL.md) and [`design-patterns`](../skills/design-patterns/references/refactoring.md).

## Disciplined comments

- Default to no comments on self-explanatory logic; comment only the `why` the code cannot show.
- Forbidden: commented-out code, TODOs without context, stale comments and docblocks repeating the signature.
- Comments must be short; when editing code update or delete comments that are no longer correct.

Labels, length limits and checklist: [`coding-standards`](../skills/coding-standards/SKILL.md#comment).

## Type safety

- Absolutely never use `any`, implicit `any`, double assertion, `@ts-ignore` or disabling lint to dodge types; use `unknown` for unknown data then validate/narrow.
- Reuse and derive types from the source domain/SDK/schema; never copy or redeclare.
- Types belong to the domain owner, grouped by domain in `types/` or the existing module convention.

Process for finding, deriving, importing and verifying types: [`coding-standards`](../skills/coding-standards/SKILL.md#typescript).
