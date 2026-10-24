# Lumina Agent

> Shared agent rules, skills and workflows for **Claude Code**, **Codex** and **Antigravity** — install them into any project with `npx`.

<pre align="center">
██╗     ██╗   ██╗███╗   ███╗██╗███╗   ██╗ █████╗
 ██║     ██║   ██║████╗ ████║██║████╗  ██║██╔══██╗
 ██║     ██║   ██║██╔████╔██║██║██╔██╗ ██║███████║
 ██║     ██║   ██║██║╚██╔╝██║██║██║╚██╗██║██╔══██║
 ███████╗╚██████╔╝██║ ╚═╝ ██║██║██║ ╚████║██║  ██║
 ╚══════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝

A G E N T</pre>

The CLI uses a compact version of this banner on terminals narrower than 60 columns, including mobile terminals.

<pre>
npx --yes --package='git+ssh://git@github.com/0132E282/lumina-agent.git' lumina-agent install
</pre>

## What gets installed

| Scope               | Contents                                                       |
| ------------------- | -------------------------------------------------------------- |
| Project             | `.agents/` rules & skills + runtime config for selected agents |
| Global (`--global`) | Claude Code and Codex user-level instructions under `~/`       |

- Re-running install asks before overwriting conflicting files
- The CLI fetches the private repository over SSH on each run (including dry runs)

After install finishes, **start a new agent session**. Claude hooks only run in Claude Code; Codex and Antigravity use the shared rules and skills through their own discovery mechanisms.

---

## Workflows

| Command | Claude Code      | Codex               | What it does                                                      |
| ------- | ---------------- | ------------------- | ----------------------------------------------------------------- |
| Plan    | native Plan mode | native Plan mode    | Adds task, acceptance-criteria and test handoffs                  |
| Debug   | `/debug`         | `$workflow-debug`   | Diagnoses and fixes a bug; also triggered by "sửa"/"fix" a bug    |
| Test    | `/test`          | `$workflow-test`    | Tests the active plan; use `repo` or `pr` for broader scope       |
| Review  | `/review`        | `$workflow-review`  | Reviews current changes, a repo snapshot, or a PR                 |
| Commit  | `/git`           | `$workflow-git`     | Commits eligible changes (does not push); supports merges and PRs |
| Cleanup | `/cleanup`       | `$workflow-cleanup` | Refreshes agent context (does not delete project files)           |

A **change report** is required when a task is complete. Implementation follows the shared implementation rule.

Antigravity reads the project `AGENTS.md` and shared `.agents/` resources directly.

---

## Development

```bash
npm run check                             # syntax check
npm test                                  # run test suite
python3 scripts/check-agent-config.py    # validate agent config
```

Design file checks:

```bash
npm run design:lint -- path/to/DESIGN.md  # lint a design file
npm run design:spec                        # print the design format spec
```

Claude Code can set up and run these with `/design path/to/DESIGN.md`.

Edit shared rules and skills in `.agents/`. Run the checks above after any configuration changes.

`docs/` is git-ignored except `docs/handoffs/`, so the `docs/**/index.json` checks run only locally, not in CI.

> The installer package is private and fetched from GitHub over SSH — it is not published to the public npm registry.

---

**License:** [MIT](./LICENSE)
