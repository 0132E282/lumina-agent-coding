# Code review criteria and Big O assessment

Use together with [code-review-checklists](./code-review-checklists.md) when reviewing code.

| Criterion | What to check |
|---|---|
| Syntax/type | Are parse/compile/import/export, type/nullability and async correct? Is there evidence from available tools or a stated static-check limit? |
| Rule/codebase/format | Does it follow applicable rules, existing conventions and real formatter/linter config? Cite the violated rule; checks do not auto-fix. |
| Meets requirements | Does the code solve the right business need? Any missed conditions or behavior changes beyond the request? |
| Correct logic | Are conditions, calculations, states and processing order right? Are null, empty data and boundary values handled? |
| Data safety | Any risk of data loss, duplicate writes or partial updates? Do related operations need a transaction? |
| Security | Is permission checked per resource? Input validated? Any sensitive information exposed or frontend data trusted? |
| Compatibility | Does it break APIs, response structure, database or features in use? |
| Readability | Are variable/function names meaningful? Is the flow easy to follow? Too many nested conditions? |
| Clear responsibility | Does each function/class have a clear purpose? Does the controller hold too much business logic? |
| Low complexity | Any redundant code, unreachable branches, unneeded abstraction or duplicated logic prone to drift? |
| Error handling | On failure, does the system respond clearly and keep data consistent? Any swallowed exceptions or fake success? |
| Performance | Any N+1 queries, queries in loops, oversized data fetches or missing pagination? |
| Testing | Is there evidence for the main flow, error cases, access permissions and easily affected features? |
| Change scope | Is the diff focused on the request? Any large refactor mixed in or unrelated edits? |

Mapping to existing repo rules when citing evidence: Correct logic/Error handling → [`rules/coding`](../../../../.claude/rules/coding.md#coding-principles); Data safety/Security → [`rules/backend`](../../../../.claude/rules/backend.md#data-safety); Clear responsibility → [`rules/coding`](../../../../.claude/rules/coding.md#coding-principles); Low complexity → [`rules/coding`](../../../../.claude/rules/coding.md#kiss-yagni-and-scope); Testing → [`rules/delivery`](../../../../.claude/rules/delivery.md#quality-and-evidence).

## Complexity assessment (Big O)

- Use [`complexity-performance`](../../../../.claude/skills/complexity-performance/SKILL.md) for every reviewed data-dependent flow, even when no bottleneck is seen; with queries also use [`database`](../../../../.claude/skills/database/SKILL.md). Config/docs or fixed sets write N/A with a reason.
- Identify `n`/`m`, time/space for the main path and worst case, preprocessing/allocation, lookup/sort/recursion; distinguish sequential loops from nested ones over independent sets. State assumptions about data structures/runtime, never infer complexity from syntax alone.
- Count API/requests and queries per record, check N+1 in both frontend and backend/ORM, render/state/effect loop, pagination/batch, timeout/retry and in-RAM data. Report call counts separately from processing cost; query cost depends on plan/index/rows, never inferred from code line count.
- Each assessment records location/flow, input, current time/space, query/API/I/O and basis. With a proposal, record current → expected with trade-off; if unmeasured state static analysis, never claim faster. Never use self-chosen input thresholds to skip the assessment.
