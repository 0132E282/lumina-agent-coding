---
name: git-workflow
description: "Enforce git rules (rules/git.md): commit, push, PR, resolve conflicts; commit only on explicit command, Conventional Commits message max 75 characters, Prettier format, conflict check. Use right before git commit, git push, creating or updating a PR, resolving conflicts; includes validate-commit-message.sh."
license: MIT
metadata:
  version: "1.4"
---

# 🔧 Git Workflow

Mandatory gatekeeper skill for **commit** and **pull request** — git actions that can change history/shared state with others. Applies in the main session or a subagent, independent of [`coder`](../../agents/coder.md).

## 1. Before `git commit` ([rules/git](../../rules/git.md))

Only `/git` and `$workflow-git` default to scope `all`; `change` when the user explicitly chooses it. Keep the exclusion of temp/junk/secret files per the `git` rule; this default does not permit pushing on its own.

1. **Is there an explicit command from the user?** No → stop, do not commit, whether or not the code is done.
2. **Group the right scope** — one commit for all changes within the scope, no fragmenting. Commit scope: `all` (default for `/git`/`$workflow-git`, all valid current changes) or `change` (only task-related parts — when the user explicitly chooses it, and the default when committing outside those two workflows). Push defaults to per-feature, push everything when the user says so explicitly — **in every scope, never include tmp/scratch/debug/trial-test files or junk files**. Run `git status` to re-check before `git add`; if you see junk files you created in the session, clean them with the [`cleanup-temp-files`](../cleanup-temp-files/SKILL.md) skill first, never add them to the commit.
3. **Reformat with Prettier before committing**: run Prettier on the staged files (`git diff --cached --name-only --diff-filter=ACMR`), then `git add` exactly those files again so the formatting lands in the same commit. Project has no Prettier (not in `PATH` and `npx` cannot resolve it) → skip, never install on your own without being asked.
4. **Conventional Commits**: subject `<type>: <short description>` (`feat`/`fix`/`refactor`/`docs`/`test`/`chore`/`style`/`perf`/`build`/`ci`), max **75 characters**; the body lists the main changes and states the problem solved.
5. **Run the check script** before the real commit:
   ```bash
   echo "feat: add hook to auto-format code with Prettier after edit" \
     | bash .claude/skills/git-workflow/scripts/validate-commit-message.sh -
   ```
   `exit 0` + `✅` if valid; `exit 1` + a specific error if the format is wrong or exceeds 75 characters. The script only checks machine-checkable format — the "why" in the body is the author's responsibility per the rule.

## 2. Before `git push`

Before every push, review the whole history about to be sent against the target remote, not just the final diff: tmp/scratch/debug/trial tests, temp logs/output, cache, `.DS_Store`, `.dssc`, `.bak`/`.orig` backups and secrets must never be pushed. Check both tracked files and files added then deleted in a later commit; `.gitignore` is not enough. Official tests remain valid. On finding a violation, stop and report, never rewrite history on your own.

1. **Reformat once** the files changed vs the remote tracking branch (`git diff --name-only @{upstream}...HEAD`) with Prettier, if the project has it installed — avoid pushing code whose format drifted from Edit/Write time (the `format-on-edit.sh` hook formats per edited file; this step is the final sweep over the whole diff before pushing).
2. Prettier formatting producing changes → those are **uncommitted** changes; merge them into the commit being prepared for push (see section 1) before pushing, never leave format fixes drifting to next time.
3. Project has no Prettier (not in `PATH` and `npx` cannot resolve it) → skip this step, never install on your own without being asked.

The [`format-before-push.sh`](../../hooks/scripts/format-before-push.sh) hook runs step 1 automatically whenever a `git push` command is detected and warns (does not block) if formatting produces uncommitted changes — see [`hooks/README.md`](../../hooks/README.md#format-before-push--reformat-before-pushing).

## 3. Before creating a Pull Request / on conflicts ([rules/git](../../rules/git.md))

1. Before creating a PR or resolving conflicts, update the remote ref by fetching the right remote/branch, fix the SHA/merge-base then check conflicts against the real target. Never blindly pull to integrate beyond the delegated permission; if the network fails, report not updated.
2. With conflicts: **read both sides** (`<<<<<<<`/`=======`/`>>>>>>>`) before deciding — never blank out one side without viewing its content.
3. Identify the side holding the user's changes, the incoming and the merge-base by SHA/diff; never infer from ours/theirs labels (especially rebase/cherry-pick). Parts the user did not change take incoming/remote; parts changed and conflicting prefer the user's version, including format conflicts. Keep non-conflicting incoming changes, never blindly pick whole files.
4. Lacking basis to identify the user's changes or at risk of losing important out-of-scope logic → ask first about that part. A dirty working tree/index must be protected, never stash/reset/overwrite on your own.
5. **Never pull extra logic from the target branch into the source branch** beyond what must be merged to resolve the conflict — even if the target branch has features/fixes that "seem needed". The user only assigned the task on the source branch; if something from another branch seems missing, report and ask, never decide to merge it on your own.
6. After resolving, rerun the relevant test/lint before considering it complete.

## Checklist

**Commit**: explicit command from the user · ran Prettier on staged files (if the project has it) · grouped the right scope (`all` or `change` — not mixed) · no tmp/test/junk files mixed in · subject in the format `<type>: <description>` ≤ 75 characters · body states the problem solved · ran `validate-commit-message.sh` and got `✅`.

**Push**: reformatted the diff vs remote with Prettier (if the project has it) · no format changes drifting outside the commit being pushed.

**Pull Request**: remote ref updated and SHA/merge-base fixed · read both sides · hunks the user did not change take incoming, changed hunks prefer the user's version · kept non-conflicting incoming and the assigned scope · reran test/lint after resolving.
