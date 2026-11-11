---
name: design-patterns
description: "Reference for the 22 GoF design patterns (Creational/Structural/Behavioral), how to tell apart easily confused pairs, and a refactoring catalog by code smell (references/refactoring.md). Use when choosing or explaining a pattern, or choosing a refactoring technique for a specific smell. Never force patterns when not needed (rules/coding.md)."
license: MIT
metadata:
  version: "1.1"
---

# 🧩 Design Patterns (GoF)

Choose a pattern only when real substitution/extension is needed; prefer composition and KISS/YAGNI per [`coding-standards`](../coding-standards/SKILL.md).

Classification and descriptions follow Refactoring.Guru — the 22 patterns in that site's catalog, not every pattern that exists in programming.

> ⚠️ **Before applying any pattern in this skill**, re-read [`rules/coding.md`](../../rules/coding.md#kiss-yagni-and-scope): add a pattern only when it clearly solves a specific recurring or hard-to-change problem — never add patterns "in case of future extension". A project does not need all 22 patterns.

## Lookup by group

| Group | Patterns | Main purpose | Details |
|---|---|---|---|
| Creational | 5 | Control how objects are created when instantiation has many variants/configurations | [references/creational.md](./references/creational.md) |
| Structural | 7 | Combine objects/classes while staying easy to change and extend | [references/structural.md](./references/structural.md) |
| Behavioral | 10 | Divide responsibilities, organize algorithms, coordinate communication between objects | [references/behavioral.md](./references/behavioral.md) |

## Easily confused patterns — quick distinction

| Pair | How to tell apart |
|---|---|
| Factory Method / Abstract Factory | Factory Method lets a subclass decide **one** product to create; Abstract Factory creates a whole **family** of related products. |
| Strategy / State | Strategy swaps **how a task is done**; State swaps **behavior by state** and the state transition rules. |
| Strategy / Template Method | Strategy swaps the algorithm via a passed-in object; Template Method keeps the process skeleton and lets subclasses replace some steps. |
| Adapter / Facade | Adapter converts an interface for compatibility; Facade provides a simple entry point into a complex subsystem. |
| Decorator / Proxy | Decorator adds composable behavior; Proxy controls access to the real object. |
| Bridge / Adapter | Bridge deliberately separates two independently evolving dimensions from the start; Adapter connects already-existing incompatible interfaces. |

## Suggested learning order (backend)

`Strategy (pricing/discount) → Adapter (external API integration) → Observer (events) → Chain of Responsibility (request pipeline) → Factory Method/Template Method (import/export) → State (order workflow)`

## When to apply

- Refactoring duplicated or hard-to-extend code and wanting to know whether a pattern already solves this exact problem.
- Explaining a pattern to others, or during code review.
- Torn between two similar-looking patterns — check the "easily confused" table above before choosing.
- **Not** for adding patterns to code on your own when the task does not ask for it and no real problem exists — that is over-engineering (see [`rules/coding.md`](../../rules/coding.md#kiss-yagni-and-scope)).

## Refactoring catalog

Look up refactoring techniques by specific code smell (Extract Method, Decompose Conditional, Introduce Parameter Object...), when to and not to apply them: [references/refactoring.md](./references/refactoring.md).
