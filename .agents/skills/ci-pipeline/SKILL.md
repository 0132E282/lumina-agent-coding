---
name: ci-pipeline
description: "Write/review CI pipelines (GitHub Actions, GitLab CI...) so lint + test + build run before merge: fail-fast jobs, cache, sensible triggers, secrets via CI variables. Use when adding or changing CI workflows, or reviewing a PR that changes .github/workflows. Writes config files only; never triggers deploys or real workflow runs."
license: MIT
metadata:
  version: "1.2"
---

# ⚙️ CI Pipeline

Write/review **CI config files** (no real workflow runs, no deploys) — ensure every code change passes lint + test + build before merge; automation layer on top of [`rules/delivery`](../../rules/delivery.md#quality-and-evidence).

## Process

1. Identify the platform from existing repo files (`.github/workflows/*.yml`, `.gitlab-ci.yml`, `azure-pipelines.yml`) — no CI and no platform specified -> ask before choosing.
2. Identify the real stack from manifests (`package.json`, `composer.json`, `requirements.txt`, `go.mod`) to pick the right setup action + dependency cache.
3. Standard job order, **fail fast** ([`rules/coding`](../../rules/coding.md#coding-principles)): `install → lint → test → build` — if lint/test fails, stop; do not run build.
4. Triggers: `pull_request` runs the full suite; `push` to the main branch uses separate jobs (build/deploy) apart from lint/test ([`rules/coding`](../../rules/coding.md#coding-principles)).
5. Secrets always via CI variables (`secrets.*`, CI/CD Variables) — never hardcode in YAML, never log to output ([`rules/backend`](../../rules/backend.md#data-safety)).
6. Least privilege: declare `permissions:` at workflow/job level (default `contents: read`), grant more only to jobs that need it; do not rely on default token permissions.
7. Never run untrusted PR code with secrets or write access: avoid `pull_request_target`/`workflow_run` checking out and running fork PR code; if unavoidable, do not check out the PR head, or split into a job without secrets.
8. Pin third-party actions to the full commit SHA, with the tag in an adjacent comment; never use `@main`/`@master`.
9. When reviewing an existing workflow, flag: missing lint/test, missing cache, matrix versions not matching the real runtime, steps on self-hosted runners of unknown origin, missing `permissions`, actions pinned by tag/branch, `pull_request_target` running PR code.

## Do not, on your own

- Add production deploy jobs, run real migrations, or change the real repo's secrets/env — shared infrastructure changes need user confirmation first.
- Trigger real workflow runs (`gh workflow run`, push to remote) when only asked to write/review config files.

## When to apply

- Adding/changing CI workflows, reviewing PRs that change `.github/workflows`/`.gitlab-ci.yml`, or setting up a basic lint/test/build pipeline for a repo without CI.
- Not for running deploys or changing real secrets on the CI platform.
