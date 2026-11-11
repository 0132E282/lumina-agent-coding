---
name: cleanup-temp-files
description: "Clean up temp/scratch/debug files Claude itself created during the task (delete directly; they are not deliverables). Never delete official tests or files of unknown origin (that is workspace-auditor's job). Use right before reporting task completion or when the user asks to clean temp files."
license: MIT
metadata:
  version: "1.0"
---

# 🧹 Cleanup Temp Files

Cleans up temp files **Claude itself created** during the current task — one-off scripts, intermediate outputs, drafts before consolidation, test files written only for manual self-checking (not part of the official test suite).

## Scope — delete only when both conditions hold

1. **Created by you in the current session** (you clearly remember when/why you `Write`-created it).
2. **Not a deliverable**: not requested code, not an official test (see below), not a requested doc.

Unsure about either -> **do not delete**. Scanning for files of unknown origin/pre-existing in the workspace is the scope of agent [`workspace-auditor`](../../agents/workspace-auditor.md) (always lists + waits for user confirmation), not this skill.

## Do not delete — official tests

Per [`rules/delivery.md`](../../rules/delivery.md#quality-and-evidence), tests in the project's test suite (files in the framework's proper test structure, run by the official test command, especially regression tests written after a bug fix) are **deliverables**, not junk — keep them in the codebase after the task is done.

How to tell junk test files (delete) from official ones (keep):

| | Junk — delete | Official — keep |
|---|---|---|
| Location | Outside the project's test structure, or in scratchpad/`/tmp` | Proper framework test dir/convention |
| Purpose | One-off manual self-check while debugging | Regression/unit/integration test locking in behavior |
| In the official test command | No (`npm test`, `pytest`... never reach it) | Yes |

## Process

1. Get candidates via the script (more reliable than memory, especially after context compaction):
   ```bash
   bash .claude/skills/cleanup-temp-files/scripts/find-session-scratch-files.sh "$SESSION_ID"
   ```
   The script reads `.agents/storage/logs/logs.jsonl` and the latest rotated `logs-<timestamp>.jsonl` (written by the `audit-log` hook), takes only files `Write`-n **in the current session**, **within the project** (matching `cwd`), still on disk, and matching temp file name patterns (name starts with `tmp`/`scratch`/`debug`/`draft`/`sandbox`/`test-output`, or extension `.tmp`/`.bak`/`.orig`), skipping project config/docs dirs (`.agents/rules/`, `.agents/skills/`, `.agents/agents/`, `.claude/`, `.codex/`, `docs/`). Deletes nothing, never scans outside the project.
2. For each candidate returned, re-confirm using the table above — which is junk, which to keep. The script suggests by file name only and can be wrong (e.g. a file named "draft" that is a real deliverable) — Claude always confirms before deleting, never mechanically follows the script.
3. Delete confirmed junk files directly (no confirmation needed — you own self-created files).
4. Report briefly: which files were deleted, which were kept as deliverables/official tests.

Prefer not creating temp files in the repo at all — use the scratchpad directory or `/tmp` when possible. The `remind-cleanup` hook (see [`hook/README.md`](../../hooks/README.md)) reminds automatically when the session context window is ≥ 80% used and uncleaned candidates are found; each file is reminded once per session.

## When to apply

- Before reporting "task complete", if temp/scratch/debug/trial test files were created along the way.
- When the user asks to clean up junk files Claude created.
- **Not** for files where it's unclear whether Claude created them, or files that existed in the workspace before the task started — hand off to `workspace-auditor`.
