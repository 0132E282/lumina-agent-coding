# Review — independent, evidenced, no fixing

- Review only reads, analyzes and reports; never edit the code/plan/testcase under review, never post PR comments or save artifacts unless asked (`--comment`/`--file`).
- Settle scope/SHA/files before reviewing; every finding has location `file:line`, evidence, impact, suggested fix and how to verify. Never turn personal preference into an error.
- Each finding has `Result: Correct | Incorrect`, no other kind: `Correct` = a real error, proven by evidence; `Incorrect` = checked and not an error. If evidence is insufficient, check more; if still inconclusive, do not make it a finding but record it under unchecked/limits.
- Code review always covers logic/requirements, Big O/N+1 and in-scope security, even if the user does not ask separately; report checklist coverage and unread/unrun parts.
- Bug-fix changes must be checked against all requirements in [`rules/bug-fix`](./bug-fix.md).
- Run checks only in non-file-modifying mode; never simulate tool/review results.

Process, checklist and format: [`workflow-review`](../skills/workflow-review/SKILL.md), [`reviewer`](../agents/reviewer.md), security: [`review-web-security`](../skills/review-web-security/SKILL.md).
