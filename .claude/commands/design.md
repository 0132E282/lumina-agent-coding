---
description: Set up DESIGN.md tooling in the project, view the spec and lint design docs
argument-hint: "[path to DESIGN.md; default DESIGN.md in the current project]"
---

Assign the `setup` role to set up DESIGN.md tooling for the **currently open project**: $ARGUMENTS

The agent reads the [`setup`](../agents/setup.md) role, project guidance and relevant rules before acting. If the runtime does not support delegation, execute sequentially in the same role and state the limit clearly.

## Scope

- This command permits installing the devDependency `@google/design.md` and adding the two npm scripts below to the open project's package. Keep the existing package manager, versions, lockfile, scripts and other dependencies; never install globally into `~/` even though the command is installed at home.
- If the project has no `package.json`, create a minimal manifest with `private: true` for tooling; do not change the parent workspace manifest. In a monorepo, use the package being worked on; if the target package cannot be determined, ask for the path before installing.
- Do not recreate UI, theme or generate/overwrite `DESIGN.md` on your own. Only read the specified file; if no file, do setup + spec and report that lint did not run for lack of a file.

## Steps

1. Read `package.json`, lockfile and project guidance. Identify the package manager, compatible runtime and installed dependencies. Reuse existing tooling; do not bump versions if the package already declares it.
2. If the dependency is missing, use the existing package manager to add `@google/design.md` as a devDependency. With npm: `npm install --save-dev @google/design.md@^0.4.0`. If declared but the binary is missing, install per the lockfile/project guidance instead of downloading via `npx`. Keep peer dependencies and default TLS checks; do not use `--force`.
3. Add missing keys to `scripts`:

   ```json
   {
     "design:lint": "designmd lint",
     "design:spec": "designmd spec"
   }
   ```

   If a key already has different content, keep it and report the conflict; do not run a conflicting script as if it were this tooling. Do not replace the whole `scripts`.
4. Run spec via the existing package manager's script (npm: `npm run design:spec`). Use the output as the basis for format, do not guess the schema.
5. For the `$ARGUMENTS` file or `DESIGN.md` in the target package if no path is passed, check the file exists then lint (npm: `npm run design:lint -- "path/to/DESIGN.md"`). Pass the path as one argument, never interpolate input into shell code. Keep real exit code/findings; do not edit the doc to make lint pass.
6. Check the manifest/lockfile diff stays in scope. Report dependency/version, target package, scripts added, spec/lint results and remaining errors via the `report` skill. No commit/push.
