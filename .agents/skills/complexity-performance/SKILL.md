---
name: complexity-performance
description: Analyze algorithmic complexity, loops, queries/APIs, memory and resources when implementing, modifying or reviewing code; use when computing Big O, finding bottlenecks or verifying performance.
license: MIT
metadata:
  version: "1.1"
---

# Complexity & Performance

Evaluate processing cost with evidence from code, data and measurements; never conclude performance from Big O alone or without benchmarking/profiling.

## Process

1. Identify the processing section, its input and what data `n`/`m` represent.
2. Check loops, traversals, lookups, sorts, allocations, database queries, network, I/O and retries. If a database is involved, also read and apply the [`database`](../database/SKILL.md) skill and the [`database-read-only`](../../rules/backend.md#database-read-only-by-default) rule.
3. Compute time/space complexity for the main path, worst case and initialization/preprocessing if any.
4. For nested loops, determine each set's size; use `O(n × m)` when independent, never default to `O(n²)`.
5. Look for N+1 queries/API calls, loading all data into RAM, infinite retries and missing page/batch/upload/input limits.
6. For database queries, count queries per request/job on a many-record dataset; check whether the query count grows with the record count, lazy loading/N+1, join/eager loading, `WHERE`, `JOIN`, `ORDER BY` conditions, pagination, columns read, indexes and the number of records scanned/returned. Applies across frameworks/ORMs (Laravel/Eloquent, EF Core, raw SQL and other stacks). Use query logs/profilers/test instrumentation and `EXPLAIN`/query plans when possible; without tools, state what was not measured.
7. Evaluate cyclomatic complexity, function length, parameter count and nesting depth as review signals.
8. Suggest suitable optimizations: `Map`/`Set`, eager loading, batching, pagination, chunking, cursors, streaming, queues/jobs, cache or indexes; state trade-offs.
9. Verify with tests, benchmarks, query logs, `EXPLAIN` or a profiler; state what was not measured.

## Thresholds to watch

- Prefer `O(n)` or `O(n log n)` when processing lists.
- `O(n²)` or higher must explain the reason, input limit and optimization direction.
- Retries must have a bounded count, timeout and stop condition.
- Target cyclomatic complexity no more than 10; functions over 50 logic lines, more than 3–4 parameters or nesting beyond 3 levels need simplification review.
- Never set resource limits on your own without a requirement or evidence.

## Reporting

For data-dependent code/flows, use the [`change-report-template.md`](../report/assets/change-report-template.md) template and write `**Big O: ...**` in bold in the file section (in English, `<complexity> — Good | needs optimization`; N+1 is written `N+1 — needs optimization`); internal analysis still uses Before/After, `n`/`m`, query count, query shape, records scanned/returned, index/query plan if any, I/O/memory, preserved behavior, verification and coding assessment. With a database, combine results from the [`database`](../database/SKILL.md) skill; never run write/DDL operations or change indexes yourself.

For pure rules, skills, docs, templates or config, drop the Big O line from the report; never infer Big O from the agent reading files or the number of files.

## Limits

- Never claim an improvement level without measuring.
- Never merge loops/queries just because they look alike when inputs differ.
- Suggest only refactors tied to the bottleneck or the current requirement.
