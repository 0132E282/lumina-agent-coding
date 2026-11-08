# Choosing analysis by engine

This is a directional checklist, not a compatibility table for all versions. Verify syntax, permissions and whether a command executes the workload against official docs for the exact version. Prefer estimated plans before actual execution when sufficient for the question.

| Engine | Evidence to examine | What to investigate |
|---|---|---|
| MySQL | EXPLAIN; actual analysis when the version supports it and it is permitted; slow query/performance metrics | access path, key, rows/filtered, loops, sort/temp, join fan-out, lock waits |
| PostgreSQL | EXPLAIN; ANALYZE/BUFFERS when execution is permitted | estimated vs actual rows, loops, buffers, spill, scan/join, statistics |
| SQLite | EXPLAIN QUERY PLAN; timing in a suitable environment | scan/search, temporary B-tree, composite index, concurrency limits |
| SQL Server | estimated/actual plan and I/O/time metrics from the right tool | logical reads, estimates, seek/scan, spill, parameter sensitivity, waits |
| MongoDB | appropriate explain verbosity; execution statistics if permitted | keys/docs examined vs nReturned, stage order, lookup/unwind, sort, shard fan-out |
| Redis | slowlog/latency and command characteristics per docs | blocking work, key/value size, hot key, round-trip, batch limits; SCAN is not a snapshot and may repeat keys |
| DynamoDB | consumed capacity, latency/throttle, key/index schema, evaluated/returned items | Query vs Scan, partition key, hot partition, GSI and consistency; a filter does not by itself reduce items read |
| Cassandra | data model per access pattern, partition size, tombstones, tracing/metrics within suitable scope | partition fan-out, hot partition, filtering, clustering order, consistency |
| Elasticsearch | mapping, shard count, query/profile metrics where appropriate | text vs keyword, filter/query semantics, aggregation, deep pagination, shard fan-out; profiling adds overhead |

For other engines: read official docs for the query language, access path, index/data model, plan/profiler, consistency and limits. Never carry SQL optimizations over to that engine unchanged.

## Laravel and multiple connections

Identify the connection and the real SQL/bindings, global scopes, soft-delete, tenant filter, eager loading and N+1. Use Query Builder/Eloquent when it fits convention; keep parameter binding. A transaction on one connection does not create atomicity across MySQL, SQLite or another NoSQL connection. Check the target engine instead of only testing SQLite and claiming MySQL equivalence.
