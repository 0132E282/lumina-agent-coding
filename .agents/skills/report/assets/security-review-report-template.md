# Security review report template

Present results reviewed per skill `review-web-security`; never invent fields. Text, no tables; keep all nine labels per finding.

`------------------------`

Finding #1: [Title]
Severity: Critical | High | Medium | Low
Result: Correct | Incorrect
Location: `path/to/file.ext:line` or route

- Root cause: [violated data flow/permission]
- Exploit conditions: [preconditions + minimal reproduction scenario in a test environment]
- Impact: [scope of data/accounts/tenants]
- Fix: [patch or handling direction]
- Regression test: [valid case still passes / out-of-permission case blocked / side effects to avoid]
- CWE/OWASP: [mapping if verifiable, omit if unsure]

`------------------------`

**Overview**: [X] confirmed bugs, highest severity [level], reviewed scope [...].

**Conclusion**: Tested [...] | Not tested/insufficient data [...]. Suggested fix order: [...].

No confirmed bug → write `No bug found in the checked scope`, never `No vulnerabilities`.
