# Change report template

- One section per file. Between two sections exactly **one** `-` separator line; never two adjacent separators. Separators only at the list start, between sections and after the last section. Several files with the same change still get one `Path` per section. No `Title`, `Description` or tables.
- Change labels: `Modified:`, `Added:`, `Deleted:`; show only groups with changes. One change goes on the label line; several use bullets, with a blank line before the list.
- Short description of the change and problem solved. Links use real line numbers/ranges as label, absolute path opening at the first line: `[3–27](/absolute/path/file:3)`. Deleted content states the real reason, no link when the location is gone; never invent line numbers.
- `Big O:` sits in the file's section, after the change lines, in English, one line **bold entire line**: `**Big O: <complexity> — Good | needs optimization**`. E.g. `**Big O: O(2n) — Good**`, `**Big O: N+1 — needs optimization**`. Only for files with data-dependent code (algorithm, loop, query/API); rule/skill/docs/template/config/test **omit the line entirely**, no "Not applicable", "None" or any substitute sentence.
- After the last separator write `Verification:`, `Limits:`, `Assessment:`, then `Token:` (and `Waste issue:` only if the hook lists violations) when the `report-usage` hook (run when invoking the `report` skill) put real numbers in context — copy exact numbers and scope label (whole session or since previous mark) from this turn's hook injection — never previous numbers, never self-computed; to get fresh numbers call the `report` skill again this turn; no data means omit the line, no N/A, no estimates. Final results only, no process narration (test-first, attempts, which subagent did what); add old/new code or deep explanation only when requested.
- UI/frontend changes (including clone-website): add `URL:` (route checked in a real browser) and `Evidence image:` (real screenshot path, e.g. `.agents/storage/evidence/<task-slug>/...png`; state `before` if any and `result` required) — see [`rules/frontend`](../../../rules/frontend.md). Omit when no UI.
- API changes: add `API:` only when an API is touched (otherwise omit, no blank line) — real request (`METHOD URL` + input values) and real response (status, body) actually run, checked against expectation. Not run: write `Not run`, never invent responses.
- Output outside a code fence; separator is 24 `-` in inline code (fits mobile).

`------------------------`

Path: path/to/file.ext

Modified: [3–27](/absolute/path/to/file.ext:3): Main change and problem solved.

**Big O: O(2n) — Good**

`------------------------`

Path: path/to/other.ext

Modified: [5](/absolute/path/to/other.ext:5): Main change and problem solved.

`------------------------`

**Verification**: Final command and result (e.g. `npm test` 91/91 pass); state what was not checked.

**URL**: Route opened in a real browser (only when UI).

**Evidence image**: `.agents/storage/evidence/<task-slug>/...png` (only when UI).

**Limits**: What was not done or measured; `None` when appropriate.

**Assessment**: Conclusion, trade-offs and remaining risks; `None` when appropriate.

**Token**: input X | output Y | cache read Z | cache create W | total T (scope per hook) — copy the shortened numbers the hook gives, e.g. `input 18 | output 4.4k | cache read 912k | cache create 13.4k | total 930k (since previous mark)` (only with real data; omit this line otherwise).

**Waste issue**: Each violated criterion with evidence (re-read file, repeated command, oversized tool result, many subagents, high cache creation) — only when the hook lists violations; otherwise omit the line, never write `None found`. Thresholds in `assets/waste-criteria.json`.
