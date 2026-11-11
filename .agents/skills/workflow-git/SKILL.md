---
name: workflow-git
description: "Shared Git workflow for Codex: commit all by default, merge and resolve conflicts, or prepare repo and PR into the current/main branch."
---

# workflow-git

Read the source workflow `.claude/commands/git.md`; pass the user's argument into the matching mode, resolving links from `.claude/commands/`. Codex uses `$workflow-git`, Claude uses `/git`; never simulate registering Claude slash commands on Codex.

- No argument or `commit`: `commit all`. `commit change` only when the user chooses it explicitly.
- `merge <source-branch> [into <target-branch>]`: local merge, default into the checked-out branch; resolve conflicts with enough basis, keep out-of-scope changes and verify before completing. Never push on your own.
- `pr [into <target-branch>] [from <source-branch>]`: create/update PR; prefer the specified target, existing PR, a grounded base branch, development branch `developer`/`develop`, then the main branch. Never guess the parent branch from upstream/branch name; if source equals base or there are several options, ask.
- `main [repo name] [into current|main] [from source-branch]`: prepare repo and PR, default main branch; ask before merge.
- `help`: guidance/repo status only.

All remaining rules (excluding temp/junk/secret files, commit validator, history check before push, PR merge approval point, merge-base conflict handling) come from the source workflow `.claude/commands/git.md` and [`git-workflow`](../git-workflow/SKILL.md); not repeated here. A request to edit this workflow is not a command to commit/push/merge.
