---
title: "<Repo-level testcases — plan name>"
description: "<When the AI should consult this repo testcase set>"
tags:
  - repo-testcase
  - "<feature-kebab-case>"
---

# <Repo-level testcases — plan name>

Design only after coding of all the plan's tasks is complete; this testcase set has not been executed.

## Contents

- [Scope and sources](#scope-and-sources)
- [Testcases](#testcases)
- [Reconciliation and limits](#reconciliation-and-limits)

## Scope and sources

- Plan: <link to the completed plan>.
- Requirement/AC source: <link to the real source>.
- Code, routes, APIs, flows checked: <paths and real evidence>.
- Out of scope: <parts not assigned>.

## Testcases

### <Stable ID> — <Title>

- ID: <unique ID, keep the old ID if any>.
- Requirement ID: <REQ/BR/AC that really exists in the source>.
- Title: <specific behavior>.
- Priority: <High / Medium / Low>.
- Preconditions: <state before the test>.
- Test data: <fake data, no real secrets/PII>.
- Steps:
  1. <specific action>.
- Expected result: <observable output/checkpoint, tied to the matching step>.
- Postconditions / Cleanup: <state after the test/how to clean up, or not applicable>.
- Actual result: Not run yet.
- Status: Not Run
- Evidence / Bug ID: None yet (when run: screenshots or API per [testcase section 7.2](../../testing/references/testcase.md#72-evidence-and-api-results)).
- API (when applicable): `METHOD URL` · parameters · Result: Not run yet.

## Reconciliation and limits

- Total modules/cases: <real numbers>; Not Run: <total cases>; the testcase set has not been executed.
- IDs/traceability: <real reconciliation result>.
- Missing information: <Draft/TBD and the source needing confirmation, or None>.
- Menus to update in the same turn: `docs/repo/index.json` and `docs/index.json`.
