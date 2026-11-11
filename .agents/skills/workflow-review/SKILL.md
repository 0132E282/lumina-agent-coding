---
name: workflow-review
description: "Review code against backend/frontend checklists: syntax, rules/codebase, format, redundant code, logic, Big O/N+1 and security; review a diff, snapshot or PR, reply in chat by default, --comment posts to PR, --file exports JSON."
---

# workflow-review

Before handing off changes, run suitable static analysis then tests proportionate to scope. Check the final newline of each changed text file with `node .agents/hooks/scripts/ensure-final-newline.mjs --check <files...>` if the script exists (otherwise check the last byte), then run `git diff --check`; the diff command alone does not prove the final newline. Review diff, regression, render/state/effect loop and cross-stack N+1; count queries/requests when tools exist, otherwise state it was static review only. Never fix pre-existing out-of-scope bugs.

Claude has no separate `/review` command — typing `/review` uses Claude Code's built-in code-review/security-review directly. Codex uses `$workflow-review`, Antigravity uses `/workflow-review`; both read this skill as the source, with no command file to read.

- No argument: review staged/unstaged diff and valid untracked code of the current branch's working tree.
- `repo [.|branch]`: review the whole tracked code snapshot at HEAD or the given ref, without checkout/mixing uncommitted diff.
- `pr [URL|#number]`: review the PR at fixed base/head SHAs; if the target is missing find the current branch's PR, ask if several/none. `#1` means PR number 1, not a branch review convention.
- Default reply in chat. `pr --comment` allows posting comments to a specific PR; `--file` allows saving JSON per the [template](./assets/review-json-template.json) and updating the index. `pr --comment --file` may be combined with the same scope/SHA/findings. Never post/save on your own.
- If the review target is a **plan** or **test case** (not code) → use agent `reviewer` with its own plan/test case criteria, not the code checklist below.
- A request for **in-depth security review** (vulnerabilities, auth/authorization, upload, payment...) → run the full [`review-web-security`](../review-web-security/SKILL.md) process; normal review still applies that skill's security checklist for applicable parts as in the section below.

Use agent `reviewer` when the runtime supports delegation; otherwise work sequentially in the same scope and report the limit. Apart from Claude Code's built-in `/review`, use no external review plugin/tool (OCR or equivalent) — use `reviewer` or perform the checklist below yourself. Keep the review-only role, never editing artifacts. JSON findings have `id`, `severity` (`CRITICAL|WARNING|SUGGESTION|GOOD`), `location`, `evidence`, `impact`, `recommendation`, `verification`, `bigO` when applicable. Verification records real command/evidence/result; unrun writes `Not Run`. Leave no template placeholders in an exported report; null only for fields not applicable/undetermined, and record the limit.

Never simulate review/comment/tool; return results via skill `report`. Security review keeps the security template's specialized fields when additions are needed.

## Mandatory checklist for code review

- Read and apply the [backend/frontend checklist](./references/code-review-checklists.md). Apply the common part and each layer in scope; full-stack changes must check both and the frontend → API → database flow. Plan/testcase use the reviewer's own criteria.
- Check syntax/type, codebase conventions, each relevant rule, formatter/linter config and redundant code against real evidence; use available tools in check mode, never fix/install packages.
- Use [complexity-performance](../complexity-performance/SKILL.md) for every data-dependent flow and [database](../database/SKILL.md) when queries exist; assess time/space, query/API/I/O counts, N+1 and resource limits. Big O is reported even without a performance bug.
- Always use [review-web-security](../review-web-security/SKILL.md) and that skill's security checklist for applicable parts; never wait for a separate security review request. Report all evidenced findings in scope, never stopping at the first few or hiding low-severity ones.
- Report coverage per checklist ID, evidence and reason for `Checked` / `Confirmed bug` / `Not applicable` / `Not checked`. Record parts not accessed/not run; never claim all vulnerabilities were found. Return technical findings per the review template and security findings per the security template, losing no specialized fields; merge same-cause findings but keep every affected location/path.
- With `--file`, save coverage at `content.checklistCoverage`, Big O assessments at `content.complexityAssessments`; security findings keep all nine fields of the security template and a security severity separate from general review severity.
  - Coverage: `id`, `status`, `locations`, `evidence`, `reason`; use the checklist's IDs/statuses, never leave an applicable item missing without explanation.
  - Complexity: `location`, `flow`, `inputs`, `time`, `space`, `queryCount`, `apiCount`, `io`, `preprocessing`, `evidence`, `proposed`, `limitations`; `proposed` is null if no optimization is proposed, never invent measurements.
  - Security finding: keep general review fields, add `category: security`, `securitySeverity`, `verdict` (`Correct`/`Incorrect`), `rootCause`, `preconditions`, `reproduction`, `affectedScope`, `regressionTests`, `cweOwasp`; unverified mapping uses null with a reason. Review severity and security severity are assessed independently per the matching template.
