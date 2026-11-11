# 🔨 Refactoring Catalog

When refactoring, apply Rule of Three, SRP, comment/readability and KISS/YAGNI from [`coding-standards`](../../coding-standards/SKILL.md); never use the catalog to expand scope.

Unlike [`design-patterns`](../SKILL.md) (creating new structure for extension needs), this skill **improves existing code** without changing observable behavior — input/output stay the same, only the internal organization changes.

## Mandatory principles

- Never change behavior — a different output is a bug fix/new feature, not a refactor.
- Tests must cover the code before refactoring ([`rules/delivery`](../../../rules/delivery.md#quality-and-evidence)); missing tests -> first write tests pinning current behavior (use [`testing`](../../testing/references/unit-testing.md)).
- Small steps, rerun tests after each step — never pile many techniques into one big change.
- Rule of Three ([`rules/coding`](../../../rules/coding.md#coding-principles)): a smell repeated twice is tolerable; refactor on the third.
- Keep scope ([`rules/coding`](../../../rules/coding.md#kiss-yagni-and-scope)): refactor only what the assigned task needs.

## Code smell → refactoring technique

| Code smell | Technique |
|---|---|
| Function too long, doing many things (name has "and": `validateAndSave`) | **Extract Method/Function** |
| Complex conditional/computation expression hard to read | **Extract Variable** |
| Deeply nested `if/else` | **Decompose Conditional** / Guard Clauses (early return, [`rules/coding`](../../../rules/coding.md#coding-principles)) |
| `switch`/`if-else` by object type, repeated in **≥3 places** | **Replace Conditional with Polymorphism** — only one place, keep the `if` ([`rules/coding`](../../../rules/coding.md#kiss-yagni-and-scope)) |
| Repeated "magic" numbers/strings with unclear meaning | **Replace Magic Number/String with Symbolic Constant** |
| Function takes too many parameters describing one concept | **Introduce Parameter Object** (`street, city, zip` → `Address`) |
| Data clump — same group of fields + handling functions repeated in many places | **Extract Class** ([`rules/coding`](../../../rules/coding.md#coding-principles)) |
| Temp variable only used to call back an expression once | **Replace Temp with Query** — be careful if the expression is a heavy query (DB/network) |
| Comment explaining "what this block does" | **Extract Method + clear name** instead of a comment ([`rules/coding`](../../../rules/coding.md#disciplined-comments)) |

## When to apply

- You see a specific code smell from the table above — look up to choose the right technique, confirm tests cover it before refactoring.
- Not for refactors spilling beyond the task scope ([`rules/coding`](../../../rules/coding.md#kiss-yagni-and-scope)), or when the problem needs a new architectural pattern (→ [`design-patterns`](../SKILL.md)).
