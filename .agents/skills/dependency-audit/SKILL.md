---
name: dependency-audit
description: "Audit dependencies (npm, composer, pip, cargo, go mod...) for outdated versions or CVEs using the ecosystem's audit tool, and propose minimal upgrades. Use before adding a dependency, when reviewing a PR that changes manifests/lockfiles, or when asked whether a dependency is safe. Never runs upgrade/install on its own."
license: MIT
metadata:
  version: "1.1"
---

# 📦 Dependency Audit

A **read-only** skill for dependencies — same spirit as [`rules/backend`](../../rules/backend.md#database-read-only-by-default) applied to package managers: audit freely, **never** `install`/`update`/`upgrade` without being explicitly asked.

## Process

1. Identify the ecosystem + real lockfile in the project (`package-lock.json`/`yarn.lock`/`pnpm-lock.yaml`, `composer.lock`, `poetry.lock`/`requirements.txt`, `Cargo.lock`, `go.sum`) — in a monorepo, audit each part separately.
2. Run the matching read-only audit tool, without `--fix`/`--force`: `npm|yarn|pnpm audit`, `composer audit`, `pip-audit`, `cargo audit`, `govulncheck ./...`. Tool missing from `PATH` -> state clearly that it cannot be audited, never invent results ([`rules/search-priority`](../../rules/search-priority.md)).
3. Take severity exactly from the tool's real output; never set a different level yourself.
4. For each vulnerability record: package, current version, minimum fix version, patch/minor/major per SemVer — a major jump warns of possible breaking changes.
5. **Only propose concrete commands** (`npm install pkg@x.y.z`...), never run them — like the Explicit Authorization of [`rules/git`](../../rules/git.md) applied to package managers; lockfile changes after an upgrade also go through the proper commit process, never auto-committed along.
6. Exception: the user explicitly asks for *both* (audit **and** running the upgrade) -> may run exactly the proposed commands. Never extend "check dependencies" into installing/updating on your own.

## When to apply

- Before adding a new dependency; when reviewing a PR that changes manifests/lockfiles; when the user directly asks whether a dependency is safe.
- Not for blanket `npm update`/`composer update` when only asked to check.
