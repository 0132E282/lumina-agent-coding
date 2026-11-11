# Dependency audit report template

Use after skill `dependency-audit` ran a read-only audit. Text, no tables; only list commands for the user to run, never upgrade.

`------------------------`

Package: `pkg-name`
Severity: critical | high | medium | low (per tool)
Version: `x.y.z` → `x.y.z` (minimal fix)
Change type: patch | minor | major

- Suggested command: `npm install pkg@x.y.z`
- Breaking risk (if the fix jumps major): [changes needing retest]

`------------------------`

**Ecosystem / Tool run**: [npm/composer/pip/cargo/go] — `[audit command]`

**Could not audit**: [packages/ecosystems missing a tool, or `None`; never invent results]

**Assessment**: [conclusion, suggested upgrade order]
