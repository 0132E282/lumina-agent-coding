# Internal handoff template (subagent → orchestrator)

Subagents use this instead of a user report; the orchestrator merges into one final report. Short text, no tables, no process narration, no repeated passed checklist.

`------------------------`

**Result**: one sentence — done | partly done | blocked (reason)

**Files changed**:
- `path/to/file.ext` (added | modified | deleted): main change, one line

**Checks run**:
- `command` → real result (e.g. `npm test` 251/251 pass); unrun checks write `Not run` + reason

**Not done / ❌**: unmet items, blockers, unverified parts; `None` when appropriate

**Out of scope**: extra bugs/suggestions found (location, impact), not fixed; `None` when appropriate
