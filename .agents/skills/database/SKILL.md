---
name: database
description: "Turn business requirements into SQL/NoSQL queries, review correctness, analyze complexity/load, find heavy queries and propose evidence-based optimizations. Use when writing queries, aggregations, filters, indexes, pagination or investigating performance (MySQL, PostgreSQL, MongoDB, Redis...)."
---

# Database Query Analyzer

## General process

1. Identify engine, version, driver/ORM, connection, environment — never treat NoSQL as one dialect.
2. Read the schema/document model, relationships, indexes, partition/shard key, data types; collect input/output, ordering, pagination, tenant permissions to keep. When illustrating relationships, combine with the [`system-understanding`](../system-understanding/references/diagrams.md) skill to draw an ERD from the verified schema.
3. Identify scale, data distribution, selectivity, call frequency, concurrency, latency/resource limits — if numbers are missing, mark them missing, never set thresholds yourself.
4. Write native parameterized queries; never invent fields/indexes — without a schema, provide a sample stating assumptions. Provide an equivalent ORM version when needed, and check the real query the ORM generates.
5. Review correctness before performance: duplicates, null/missing, join cardinality, counts, rounding, timezone, stable ordering, pagination, tenant filter, consistency, error handling.
6. Statically analyze the access path and expected cost — read [analysis.md](references/analysis.md) to distinguish complexity, execution cost, system-wide load.
7. If permitted and a suitable environment exists, collect the execution plan/profiler/metrics for the right engine — read [engines.md](references/engines.md), check official docs for the version before using uncertain features.
8. Rank queries by evidence (data processed, latency, resources, fan-out, frequency) — never call a query heavy just because it is long/has many JOINs/does not use an index.
9. Propose the smallest change preserving semantics (query rewrite, index, data model, batch, pagination, cache, precompute) with write/storage/freshness/consistency tradeoffs.
10. Verify before/after with representative data, varied parameters, the same environment/cache — compare correctness and metrics, never invent improvement percentages.

## Related

Designing a new data model at the conceptual level (entities/relationships, before a concrete schema exists) is the job of agent [`architect`](../../agents/architect.md) section "Data & API". This skill applies once a concrete schema for a real engine exists (or is being drafted) — confirm with engine-specific details: DDL syntax, index strategy, query cost.

## Input and questions

Prefer existing data: requirements, queries, bindings with sensitive data masked, schema/index, plan, cardinality, aggregated logs and measurement goals. Ask for missing information that directly matters in one batch. Continue static analysis without connection permission; state it is unverified.

## Scope and data protection

- Writing a query does not mean permission to run it. Access only engines/environments within the permitted scope.
- Never run DDL, update/delete, backfill, cache flush, index/config changes or benchmark workloads on production yourself.
- Actual plan/analyze can execute the query and consume resources; verify semantics per engine, use a suitable environment. Never assume transaction rollback removes all side effects.
- Never infer read-only safety from query text: check stored functions, procedures, scripts and related execution features.
- Parameterize values; allowlist identifiers, dynamic sort fields/operators. For NoSQL, never take a whole object/operator from untrusted input to splice in directly.
- Never read all data or log secrets when only plans, statistics or anonymized samples are needed.
- Keep tenant/authorization filters. For Redis keyspace and NoSQL partitions, check key scope and access rights.

## Docs by situation

- Read [analysis.md](references/analysis.md) when evaluating complexity, heavy queries, ranking and verification.
- Read [engines.md](references/engines.md) to choose metrics and approach for SQL/NoSQL.
- Read [output.md](references/output.md) when writing a report or query handoff.

## Completion criteria

Return the query and bindings/assumed schema clearly; describe the semantics correctly; tie each finding to evidence or a hypothesis; give recommendations and how to verify. If the query was not run or there is no plan, state it. Never promise support for every feature of every database: for an unknown engine, consult official docs and keep conclusions conditional.
