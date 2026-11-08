# Git — authorization and conflict safety

- Absolutely never commit/push/deploy without an explicit command in the current turn; finishing code does not grant Git mutation authority.
- Meaningful commits; the `commit` workflow defaults to commit all (all valid changes in the repo, except forbidden files), only commits the task's own changes (`commit change`) when the user explicitly chooses; a commit does not grant push authority.
- Never commit/push secrets, temp/junk/debug files or experimental tests; must review the staged diff and the whole history about to be pushed, never rely on `.gitignore`.
- Push by feature by default or push everything when the user says so explicitly; both exclude forbidden files.
- Commit messages must follow Conventional Commits, title at most 75 characters, body preferably stating the reason.
- Before resolving conflicts or creating/updating a PR: `git fetch` the right remote/branch, settle SHA and merge-base, check conflicts against the real target and read both sides; never blind `git pull` causing merge/rebase beyond the assigned operation; fetch does not mean code is integrated; if fetch fails, report not updated, never use a stale ref as fresh.
- Resolve per hunk, identify the user/incoming side by SHA/diff and task scope (not by ours/theirs labels, branch name, timestamp, author): parts the user did not edit take incoming, parts edited with conflicts keep the user's version, keep non-conflicting incoming, never choose a whole file; merge only mandatory parts, never pull out-of-scope logic. With uncommitted changes never stash/reset/overwrite, ask; lacking basis or risking logic loss → ask first.

Commit/push/PR/conflict process and checklist: [`git-workflow`](../skills/git-workflow/SKILL.md); runtime entry point: [`workflow-git`](../skills/workflow-git/SKILL.md).
