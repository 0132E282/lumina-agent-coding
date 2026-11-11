# Output template

Use only the sections needed for the size of the request.

## 1. Requirements and data

State engine/version, semantics, input/output, confirmed schema/index, assumptions and missing information.

## 2. Proposed query

Give the native query in the right dialect, bindings or driver payload. For Redis use commands and key/arguments; for MongoDB use filter/pipeline; never force every engine to return SQL. State whether it is runnable or only a sample needing schema adjustment. Provide ORM if requested.

## 3. Assessment

| Query/fingerprint | Finding | Evidence | Expected/measured impact | Confidence |
|---|---|---|---|---|
| ... | ... | SQL/plan/metrics | ... | Observed/Hypothesis/Undetermined |

Explain operators, cardinality, scan/sort/join/fan-out and conditional complexity. Without a plan, never give imaginary latency or optimizer cost.

## 4. Optimization proposals

| Priority | Change | Why | Tradeoff | How to verify |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

Separate query rewrites, index/data model and architectural changes. Provide DDL/index commands as proposals, never apply them yourself. Point out existing duplicate/redundant indexes if there is basis.

## 5. Results and limits

Record the checks actually run, correctness results and before/after, missing numbers, risks and next steps. If only static analysis was done, state it was not executed.

## Sample prompts

> From requirement [business], schema [path] and engine [name/version], write a parameterized query. Analyze correctness, complexity and heavy-query risks; propose an index or rewrite with tradeoffs. Do not run the query or change the database.

> Review the attached queries and execution plans. Rank by the available metrics, identify the bottleneck and propose optimizations. Do not guess missing numbers.
