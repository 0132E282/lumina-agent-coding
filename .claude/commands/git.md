---
description: Default commit all; merge/conflict and create PR to the base branch or a specified target branch
argument-hint: "[commit [all|change] | merge source [into target] | pr [into target] [from source] | main [repo name] [into current|main] [from source] | help]"
---

Perform the specified Git operation: $ARGUMENTS. Read the [`git-workflow`](../skills/git-workflow/SKILL.md) skill and related rules before changing Git.

## Choose operation

- `/git`, `/git commit` or `/git commit all [note]`: commit all valid changes in the working repository; `all` is the default scope. This is an explicit commit request when the user actually invokes the command, not when only asked to edit this command's docs.
- `/git commit change [note]`: commit only changes belonging to the current task when `change` is explicitly specified.
- `/git merge <source-branch> [into <target-branch>]`: merge the source branch into the target branch, default the branch checked out when the command is called; resolve conflicts per the rules and verify before finishing. This is a local Git merge, not a command to create a PR.
- `/git pr [into <target-branch>] [from <source-branch>]`: shorthand to create/update a pull request in the existing repo. Source defaults to the checked-out branch; base follows the priority in the Choose base for PR section. `into` with a branch name uses that name; `into main` means the real main branch, `into current` means the current branch and needs a different source.
- `/git main [repo name] [into current|main] [from source-branch]`: prepare the repository if absent, then create/update a PR. The repo name is only for choosing/creating the repository, not a branch name. An existing repo is reused; a passed name not matching the remote → ask before changing the target. Creating a repo does not authorize commit/push or merge.
- `into main` (default): base is the real main branch of the remote, taken from GitHub metadata or `origin/HEAD`; if undeterminable, ask, never guess `main`/`master`. Source defaults to the checked-out branch, or the branch specified by `from`.
- `into current`: base is the branch checked out when the command is called. Source comes from `from`; if missing, ask for the source branch before creating/updating the PR. Never switch branches to infer source/base; on detached HEAD, ask for a concrete target branch.
- `/git help`: show syntax and repo state, never commit, create a repo or merge on its own.

Choose only one mode at a time (`commit`, `merge`, `pr`, `main` or `help`); with no argument choose `commit all`. `from` is used with `pr`/`main`; `into` is used with `pr`/`main`/`merge`. With `main`, `into` accepts `current`/`main`; other modes accept a concrete target branch. Unknown syntax or multiple combined modes → report guidance and stop. Do not use the `--` prefix for this command's syntax; real Git/gh options keep tool syntax. Never interpolate `$ARGUMENTS` into shell code; pass repo/branch/path names as separate arguments.

## Commit

1. Check repo/branch, `git status`, staged diff and unstaged diff. `all` still excludes secrets, junk files and scratch per rules; `change` does not include edits outside the task. If the index contains out-of-scope changes, keep that index and commit only the right scope safely; never silently commit or unstage others' parts. If scope is undeterminable, ask before staging.
   Absolutely never commit/push tmp/scratch/debug/experimental test files, temp logs/output, cache, `.DS_Store`, `.dssc`, `.bak`/`.orig` backups or secrets. Decide by content/purpose and project rules; do not ban all of `tests/` or `*.test.*` since official tests are deliverables. Stage with a reviewed path list, never blind `git add .`/`git add -A`. Recheck the staged diff before commit, including already-tracked files; `.gitignore` does not protect tracked files. A file unclear whether junk stays out of the commit and is asked about, never deleted on your own.
2. One commit for all related changes, not fragmented. No valid changes → report and stop.
3. Before committing, run Prettier on staged files (`git diff --cached --name-only --diff-filter=ACMR`) then `git add` those exact files again; if the project has no Prettier installed, skip, never install it.
4. Conventional Commits message, title `<type>: <description>` ≤ 75 characters, body stating the problem and main changes. Run the script [`validate-commit-message.sh`](../skills/git-workflow/scripts/validate-commit-message.sh), commit only when the validator passes.
5. Invoking `commit` permits creating a commit in the right scope, never push/create PR/merge on its own. Report hash, branch and committed files.

## Local merge and conflict resolution

1. Settle source and target; target defaults to the branch checked out when the command is called, not the main branch. Detached HEAD or missing source → ask. Confirm refs exist, source differs from target, working tree/index clean and no other merge/rebase running. Never stash, reset or overwrite existing changes on your own. If the specified target differs from the current branch, switch only after these checks pass.
2. If a related remote exists, fetch the right fresh ref before merge, settle source/target SHA and merge-base then review the incoming diff, file scope, temp/junk/secret files per the Commit section. Never treat a stale remote ref as latest or pull blindly. Fetch does not replace the specified local branch with the remote branch or integrate beyond the assigned source/target. Perform the source-into-target merge with Git; the user invoking `merge` permits the merge and necessary merge commit, not push or commits outside the merge. A request to edit this workflow is not a call to perform a merge.
3. With conflicts, read both source/target and the diff from merge-base per hunk: parts the user did not edit take incoming, parts the user edited prefer the user's version; keep non-conflicting incoming. Identify the user's side by scope/SHA, not by defaulting to source/target or ours/theirs. Lacking basis or risking loss of important out-of-scope logic → keep the conflict, report file/impact and ask; never abort/reset on your own.
4. After resolving, check leftover markers, each hunk, run checks suited to affected files/behavior then stage the resolved files separately and finish the merge. For conflict-free merges also run relevant checks before reporting completion. If checks fail report the real state; do not push, self-rollback or conclude the merge passed. Do not use commit all to bundle parts not belonging to the merge. Report source/target, SHAs, resolved conflict files, checks and the actual merge commit or fast-forward.

## Preparing the repository for `main`

1. Check which repo the project is in, remotes and whether the target repository exists. If a suitable repo/remote exists, reuse it and go to the PR step. Never create a nested repo, overwrite a remote or recreate an existing repo. If repo/remote is missing, ask for missing info on name, owner, local/GitHub creation location and visibility before dependent steps; if only local is chosen and no PR-capable remote exists, report that the PR part cannot be done.
2. For a local repo, use `git init` with the specified main branch or existing Git config. For GitHub, check `gh auth status`, owner/name/visibility and access before creating with `gh repo create`; do not use `--push` without a push request.
3. Create exactly the determined repo, connect the remote only if within the request scope; report URL/path and branch. Never fabricate a created repo when the tool fails; never ask for tokens in chat.
4. A new repo needs a base commit, a source branch and a diff to create a PR. If insufficient, report the missing step, ask permission to commit/push or create the needed branch; never create empty commits or fake PRs. Continue to the PR step when conditions and permissions are met.

## Choose base for PR

Applies to `pr`; `main` still chooses the main branch or `current` as specified by existing syntax. Settle and report source → base with basis before creating the PR:

1. The target branch the user specifies via `into` or an explicit request has top priority.
2. If source already has a suitable PR keep that PR's base; multiple PRs/bases → ask to choose, never retarget on your own.
3. If there is credible evidence of the origin branch from which source was created (explicitly recorded project/branch metadata or reflog with enough basis), create the PR to that origin branch. A branch split from `developer`/`develop` goes into that branch; split from another branch goes into that other branch. Git does not always store the parent branch name; upstream tracking or two branches sharing an ancestor does not prove the origin branch. Never guess the origin from the branch name alone.
4. No determined origin branch: prefer the real development branch `developer` or `develop` if it exists. If both exist and the project defines no integration branch → ask to choose. No development branch → use the remote's real main branch; never hardcode `main`/`master`.
5. Base deleted, ref missing, contradictory metadata or source equals base → ask for another target/source branch; never create a PR into itself or create a branch to hide missing info.

## Pull request and merge

1. Determine source/base per `from` and `into` before creating/updating a PR; check remote, unpushed commits and that the existing PR matches this source/base pair. Source equals base → report a PR cannot be created from a branch into itself; never switch branches or reset history on your own. Never change the base of an existing PR not matching the request; ask before retargeting.
2. Fetch the right remote/base/source before the conflict check, settle SHA/merge-base; if fresh data could not be fetched, report Unverified, never treat a stale ref as updated. Resolve per `git-workflow`: read both sides and the diff against merge-base; parts the user did not edit take incoming/remote, parts edited with conflicts keep the user's version, keep non-conflicting incoming within the assigned operation. Suspect loss of out-of-scope fixes or unclear user side → ask. After resolving run relevant checks.
3. If a push is needed to create the PR, state source/remote and ask push permission if the session has not allowed it. Before pushing review all commits to be sent versus the target remote, not just the working tree or last commit: absolutely never send temp/junk/secret files listed in the Commit section, including files added then deleted in a later commit. If forbidden files are found in the history to push → stop and report; never rewrite history on your own. Perform the `git-workflow` format step with the existing formatter, never download packages. No force push.
4. Create/update the PR with title/body reflecting the final diff, explicitly passing the head/source and base settled per the invocation mode. Use a body-file or structured argument to keep newlines; report PR URL, source/base and real checks/conflict results.
5. **After the specific PR is created/updated and verified**, ask the user whether to merge that PR into base, with URL, source/base and check results. Merge only with explicit confirmation, mandatory checks passing and no conflict; recheck state before merge. Waiting or no reply is not consent. Do not bypass checks or delete the branch unless asked.

With `main`, run sequentially prepare repo → PR → ask merge; if the repo is ready skip the create step. On completion report via the `report` skill; never move from `commit` to `main` on your own.
