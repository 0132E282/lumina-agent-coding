# Cost and heavy query analysis

## Three kinds of conclusions

- Observation: real plan/metrics exist; state the source, parameters and environment.
- Hypothesis: risk based on the query/data model; state the conditions under which the risk occurs.
- Undetermined: missing cardinality, index, plan or workload.

Never score complexity by JOIN/subquery count or query length. Never infer milliseconds from Big-O or optimizer cost. Engine cost is usually a model unit, not arbitrarily comparable across engines or configurations.

## Conditional complexity

If the user asks for Big-O, define n/m/k and assume physical operators. For example, a scan is usually O(n); a comparison sort usually O(k log k); a nested loop without a suitable lookup can be O(n*m); an index lookup usually has an O(log n + k) component, but depends on index type, I/O and data layout. Hash join, spill, parallelism and distributed fan-out change the model. This is an algorithmic estimate, not a latency prediction.

For NoSQL, analyze documents/keys examined, partition/shard fan-out, payload, network round-trips, read/write capacity, hot partitions and consistency. Never assign one Big-O to all NoSQL.

## Signs to investigate

- SQL: non-sargable predicates, implicit casts, joins multiplying rows, repeated correlated subqueries, sort/hash spill, deep offsets, large counts, over-fetched columns, N+1, lock waits.
- Document/search: scanning many documents, late filtering, lookup/unwind duplication, sorts without a suitable access path, large aggregations, deep pagination, many shards and large payloads.
- Key/value/wide-column: unbounded keyspace scans, hot key/partition, fan-out, many round-trips, oversized values/collections, tombstones or costly filtering where the engine applies.

A scan can be reasonable on a small table or a query reading most of the data. An index can cost more than a scan. Covering/composite/partial/expression indexes depend on engine and version; verify instead of applying fixed formulas.

## Ranking

If telemetry exists, group queries by fingerprint to keep structure and hide literals. Use count, latency p50/p95/p99, total time, CPU/I/O, rows/docs examined, bytes, waits, spill or capacity. Count × mean latency is only an approximation of total execution time, not CPU and not a substitute for available aggregate data. A very slow rare query and a fast query called extremely often have different impact.

If there is only one query or no workload, never claim to have found the system's heaviest query. State the scope and confidence level.

## Optimization and verification

1. Measure a baseline with common and skewed parameters; record row count, cache state, concurrency, configuration.
2. Check equivalent results by data type and semantics: set/multiset, duplicates, ordering, null/missing, pagination, timezone, consistency. Never treat row order as stable when the query does not specify ordering.
3. Change one isolatable factor at a time; measure multiple times in a suitable environment.
4. Compare latency distribution and resources, including write overhead/storage when adding indexes.
5. For cache/precompute, state invalidation, TTL/freshness, failure and consistency; for cursor pagination, state any contract change.
6. Report the limits of sample data; never extrapolate confidently to production.
