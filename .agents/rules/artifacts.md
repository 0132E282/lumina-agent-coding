# Verification artifacts

- Keep generated evidence and temporary verification output inside the active project's `.agents/storage/`; use one direct task folder, `.agents/storage/<task-slug>/`, for screenshots, logs, HAR/traces, API captures and test-run output.
- Do not create verification files in the repository root, `docs/`, `test-results/`, `/tmp` or another project/global directory. If a tool forces an external temporary output, copy only needed evidence into the task folder and remove the task-created temporary output before handoff.
- Runtime hook logs and state may use `.agents/storage/logs/` and `.agents/storage/state/`; these remain under the same storage root. Keep all storage project-local, never under `~/.agents/`.
- Keep durable project docs, testcase definitions and product assets in their established source locations. Do not move existing history unless asked; storage artifacts are ignored and must not be committed.
