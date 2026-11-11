## Summary

<!-- Main changes and reason. -->

## Verification

- [ ] `npm test`
- [ ] Ran: failing case, normal case, edge case, related regression (record command/result)
- [ ] `python3 scripts/check-agent-config.py`
- [ ] UI: before/after images of the same route/viewport (remove if no UI)

## Bug fix (remove if not a bug fix)

Per [`rules/bug-fix`](../.agents/rules/bug-fix.md); reviewer checks item C10 in the [review checklist](../.agents/skills/workflow-review/references/code-review-checklists.md).

- Severity: S1 | S2 | S3 | S4
- Source: code | data | config/environment | user input | dependency
- Root cause and evidence:
- Regression test (`file:line`): fails on base (paste `verify-regression.sh` output), passes after fix, fails again when the fix alone is removed
- UI before/after images (if UI bug):
- Security: yes/no (if yes it went through `review-web-security`, no exploit payload recorded)
