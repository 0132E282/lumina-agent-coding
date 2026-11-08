# 🪝 Hooks

Auxiliary hooks for the subagents in [`agents/`](../agents) -- they automate steps that should be done but are easy to forget.

## rtk — cut token use of common Bash commands

Before each `Bash` command, this hook calls the [`rtk`](https://github.com/rtk-ai/rtk) CLI to rewrite common dev commands (read file, grep, git...) into a more token-efficient form -- it is not a script written in this repo.

- **Command**: `command -v rtk >/dev/null 2>&1 || exit 0; rtk hook claude`
- **Hook type**: `PreToolUse`, matcher `Bash`
- **Difference from the other hooks**: this is an **external tool**, not shipped with the framework -- if `rtk` is not installed the hook skips itself (exit 0, no error). Install per the [official guide](https://github.com/rtk-ai/rtk/blob/master/INSTALL.md), then run `rtk init -g` (or `rtk init` in one project) to register the hook.
- **Check savings**: `rtk gain`.

## format-on-edit — auto-format with Prettier

After each **Edit/Write** by Claude Code (or a subagent), this hook runs `prettier --write` on exactly the edited file -- matching [`rules/delivery.md`](../rules/delivery.md#quality-and-evidence) (uniform format, no whitespace arguments in review).

- **Script**: [`scripts/format-on-edit.sh`](./scripts/format-on-edit.sh)
- **Hook type**: `PostToolUse`, matcher `Edit|Write`
- **File scope**: formats Prettier supports (`.js .jsx .ts .tsx .json .css .scss .less .html .vue .md .yaml .yml ...`). Other files are skipped without error.
- **Safety**: always `exit 0` -- if the project has no Prettier (not in `PATH` and `npx` cannot resolve it), the hook skips quietly instead of blocking the agent.
- **Dependency**: needs `jq` in `PATH` to parse the hook JSON input (`brew install jq` / `apt install jq`).

### Install into another project

1. Copy this folder into the target project's `.claude/hooks/`:
   ```bash
   cp -r .claude/hooks /path/to/project/.claude/hooks
   ```
2. Merge the `hooks` key of [`.claude/settings.json`](../settings.json) into the target project's `.claude/settings.json` (the `lumina-agent` installer merges automatically). If the project already has other `hooks`, merge the arrays instead of overwriting.
3. Make sure the project has Prettier (local `devDependencies` or global) -- otherwise the hook does nothing (no error).

### Use another formatter (Black, gofmt, dotnet format, PHP-CS-Fixer...)

`format-on-edit.sh` currently handles only files Prettier supports. For multi-language projects, add a matching `case` branch in the script, following the `automator.py` pattern of `tester-agent` (auto-detect the project type then call the right formatter).

## audit-log — audit trail for every tool call

Before each time Claude Code (or a subagent) calls **any tool** (Edit, Write, Bash, Grep...), this hook writes one JSON line to the log -- for tracing "who/when/what", see [`rules/backend.md`](../rules/backend.md#data-safety).

- **Script**: [`scripts/audit-log.sh`](./scripts/audit-log.sh)
- **Hook type**: `PreToolUse`, matcher `.*` (every tool)
- **Log file**: `.agents/storage/logs/logs.jsonl` (JSON Lines, append-only) -- the whole `.agents/storage/` folder is in `.gitignore`, so it is not committed by mistake.
- **Rotation**: before each write, the shared helper [`scripts/_log-rotate.sh`](./scripts/_log-rotate.sh) (sourced, not registered in settings) renames `logs.jsonl` to `logs-<UTC yyyyMMdd-HHmmss>[-N].jsonl` when the file is ≥ `LUMINA_LOG_MAX_BYTES` (default 1048576 = 1 MiB) and writes the new line to the new file; keeps only the newest `LUMINA_LOG_KEEP` rotated files (default 5) and deletes only files matching exactly that name pattern, never the active file or other files in the folder. Rename uses `mv -n` (atomic rename, no overwrite); if another hook rotated first it skips, and the line being written is not lost (a writer that already opened the old file writes into the rotated file). Best-effort, always `exit 0`; without the helper it still logs, just does not rotate. Rotated files created before secret masking may still contain unmasked secrets -- retention deletes them gradually; to delete sooner, delete the old `logs-*.jsonl` files by hand.
- **Line content**: `ts` (UTC ISO8601), `session_id`, `tool`, `cwd`, `input` (summary -- only `file_path`/`command` (≤200 characters, common secret forms such as `token=`/`password=`/`Bearer`/URL credentials/prefixes `ghp_`, `sk_live_`, `AKIA`... masked to `***` before the cut -- heuristic, not guaranteed to mask everything)/`pattern`/`skill` (skill name when the tool is `Skill`) depending on tool type, **never** the full Write/Edit file content, to keep the log small and avoid leaking sensitive data). Adds `agent_id` when the tool runs in a subagent (Claude Code only sends this field for subagents; the main session has none). The [`turn-log`](#turn-log--one-summary-line-per-turn) hook adds one `type: "turn"` line per turn to the same file.
- **Safety**: always `exit 0`; broken JSON input, missing `jq`, or empty `tool_name` are skipped quietly, no junk line is written. The log folder comes from `CLAUDE_PROJECT_DIR` (always the project root, even if the agent `cd`'d into a subfolder), falling back to `cwd` in the payload then `pwd` if that variable is missing -- avoids stray logs in subfolders when the session changes cwd. The `cwd` field in each log line keeps the original payload value for tracing.
- **Dependency**: needs `jq`.

### View the log

```bash
# Follow in real time, each line pretty-printed
tail -f .agents/storage/logs/logs.jsonl | jq .

# Read the whole current log as one readable JSON array (e.g. to open in an editor)
jq -s '.' .agents/storage/logs/logs.jsonl

# Include rotated files (old -> new)
cat .agents/storage/logs/logs-*.jsonl .agents/storage/logs/logs.jsonl | jq -s '.'
```

## commit-msg-guard — block wrongly formatted commit messages

Before each `git commit` (via the Bash tool), this hook extracts the message about to be used and validates it with the `git-workflow` skill's own `validate-commit-message.sh`, denying if it is not Conventional Commits -- enforces [`rules/git.md`](../rules/git.md) automatically, without relying on Claude's discipline.

- **Script**: [`scripts/commit-msg-guard.sh`](./scripts/commit-msg-guard.sh)
- **Hook type**: `PreToolUse`, matcher `Bash`
- **Commit detection**: the shared helper [`scripts/_shell-command.sh`](./scripts/_shell-command.sh) splits a Bash command into single commands (after `;`/`&&`/`||`/`|`/`&`/`(`/`)`/newline), strips quotes and heredoc bodies, then accepts only `git commit` as an executed command -- including after the assignment prefix `X=1`, wrappers `sudo`/`env`/`command`/`time`/`nohup`/`exec`/`nice -n`/`timeout [opts] <n>`/`xargs [opts]`/`stdbuf`/`ionice`/`flock <file>`, `!`, keywords `if`/`then`/`do`/`else`/`elif`/`while`/`until`/`{` and git global options (repeated `-C <dir>`, `-c <kv>`, `--git-dir`, `--work-tree`, `--no-pager`…). Sub-scripts are analysed like commands (up to 4 levels, in one awk process): the content of `$(...)`/backtick, the strings of `bash|sh|zsh|dash|ksh -c` and `eval`. A static `cd <dir>` earlier in the same command chain changes the git directory (a dynamic dir such as `cd "$x"` is ignored). The words `git commit` inside heredoc bodies/strings (e.g. a `python3 - <<'EOF'` script writing Markdown) are ignored; `<<` in `((...))`/`$((...))`/`let` does not open a heredoc, and a heredoc missing its terminator line does not swallow the following commands. Fail-safe: a dynamic subcommand (`git "$x"`, `git $(...)`) is checked as the subcommand under consideration.
- **Message extraction**: only from the arguments of the `git commit` command itself -- `-m`/`--message` (repeated ones are joined with blank lines; `-m "$(cat <<'EOF' ... EOF)"` takes the heredoc body) or `-F -` with a heredoc; never the heredoc/`-m` of other commands (`cat <<EOF`, `git tag -m`). Each `git commit` in the chain is checked separately.
- **Safety**: best-effort -- if the message cannot be extracted (commit opens an editor, uses `-F`, missing `jq`/validator) it does not block and lets git handle it.
- **Dependency**: needs `jq` and `skills/git-workflow/scripts/validate-commit-message.sh`.

## bugfix-test-reminder — remind to include a regression test when committing a fix

Before each `git commit` whose Conventional Commit type is `fix` (`fix:`, `fix(scope):`, `fix!:`), if the list of files to commit has no test file, this hook reminds via `additionalContext`: per [`rules/bug-fix.md`](../rules/bug-fix.md) a regression test reproducing the bug is needed; if it cannot be automated, state the before/after check in the report. Separate from `commit-msg-guard` because that hook denies on message format, while this one only reminds based on staged content.

- **Script**: [`scripts/bugfix-test-reminder.sh`](./scripts/bugfix-test-reminder.sh)
- **Hook type**: `PreToolUse`, matcher `Bash`
- **Commit detection and message extraction**: same as `commit-msg-guard` (same `_shell-command.sh` helper, including `-am`); only considers the first `git commit` with a static subcommand, reads staged files in `<dir>` when using `git -C <dir>`. Treated as a bug fix when the type is `fix` or the message has `Fixes|Closes|Resolves #<number>`.
- **Files considered**: `git diff --cached --name-only`; plus modified tracked files with `-a`/`--all`; plus files the `git add` in the same command will stage -- pathspecs (paths with spaces, directories like `tests`, unexpanded globs) are truly resolved with `git ls-files --modified --others --exclude-standard -- <pathspec>` in the command's directory, not guessed from strings (`-A`/`-u` count all modified and untracked files). Test file: name contains `.test.`/`.spec.`/`_test.`/starts with `test_`, or lives in `tests/`/`test/`/`__tests__/`.
- **Safety**: reminds only, no deny/ask; not a fix commit, message not extractable (editor, `-F`), missing `jq`/`git`, not in a git repo, or the `cd`/`-C` directory cannot be entered → silent; always `exit 0`. Staying silent when the directory cannot be entered is deliberate: the hook is advisory, not a protective guard.
- **Dependency**: needs `jq`, `git`.

## secret-scan — ask for confirmation on suspected secret leaks

Before each `git add`/`git commit`, this hook scans the paths about to be added (directories, globs, `.`, `-A`/`-u` are listed into files via `git ls-files`) or the diff about to be committed (staged; plus tracked changes with `commit -a`/pathspec) for secret-like patterns (private key, AWS key, `api_key=...`, unquoted `*_KEY/*TOKEN/*SECRET/*PASSWORD=` assignments, tokens `ghp_`/`github_pat_`/`xox?-`/`sk_live_`/`AIza`/JWT) and `.env` file names -- see [`rules/backend.md`](../rules/backend.md#data-safety).

- **Script**: [`scripts/secret-scan.sh`](./scripts/secret-scan.sh)
- **Hook type**: `PreToolUse`, matcher `Bash`
- **Command detection**: same helper [`scripts/_shell-command.sh`](./scripts/_shell-command.sh) as `commit-msg-guard` -- accepts the same prefix forms/global options, ignores the words `git ...` in heredocs/strings, reads arguments with quotes removed (paths with spaces still work); `git -C <dir>` is taken from the executed git command itself, git runs in `<dir>`. If `<dir>` cannot be entered the guard asks with a reason instead of skipping (only `format-before-push` deliberately skips quietly, since it is just an advisory format step, not a guard).
- **Behavior on detection**: `permissionDecision: "ask"` (not `"deny"`) -- the regex heuristic may false-positive, so ask the user again instead of hard blocking.
- **Dependency**: needs `jq`.

## protected-branch-guard — warn before high-risk pushes

Before each `git push`, this hook warns (ask) when pushing straight to `main`/`master` (refspec targets like `HEAD:main`, `x:refs/heads/main`; with no refspec it follows the current branch), deleting `main`/`master` (`:main`, `--delete`/`-d`), `--mirror`/`--all`, glob/`:` refspecs, using `--force`/`--force-with-lease`/a `+` refspec, or `--no-verify`/`--no-gpg-sign` -- a second line of defense for the Git Safety Protocol.

- **Script**: [`scripts/protected-branch-guard.sh`](./scripts/protected-branch-guard.sh)
- **Hook type**: `PreToolUse`, matcher `Bash`
- **Command detection**: same helper [`scripts/_shell-command.sh`](./scripts/_shell-command.sh) as `commit-msg-guard` -- accepts the same prefix forms/global options, ignores the words `git ...` in heredocs/strings, reads arguments with quotes removed (paths with spaces still work); `git -C <dir>` is taken from the executed git command itself, git runs in `<dir>`. If `<dir>` cannot be entered the guard asks with a reason instead of skipping (only `format-before-push` deliberately skips quietly, since it is just an advisory format step, not a guard).
- **Behavior on detection**: `permissionDecision: "ask"` -- there are valid cases that need pushing straight to main/force push which the user already agreed to, so ask again instead of hard blocking.
- **Dependency**: needs `jq`, `git`.

## format-before-push — reformat before pushing

Before each `git push`, this hook runs `prettier --write` **once** on files changed versus the remote tracking branch (`@{upstream}...HEAD`) -- the last sweep before pushing, complementing `format-on-edit` (which formats only the just-edited file and does not rescan the whole diff). See skill [`git-workflow`](../skills/git-workflow/SKILL.md) section "Before `git push`" and [`rules/delivery.md`](../rules/delivery.md#quality-and-evidence).

- **Script**: [`scripts/format-before-push.sh`](./scripts/format-before-push.sh)
- **Hook type**: `PreToolUse`, matcher `Bash`
- **Command detection**: same helper [`scripts/_shell-command.sh`](./scripts/_shell-command.sh) as `commit-msg-guard` -- accepts the same prefix forms/global options, ignores the words `git ...` in heredocs/strings, reads arguments with quotes removed (paths with spaces still work); `git -C <dir>` is taken from the executed git command itself, git runs in `<dir>`. If `<dir>` cannot be entered the guard asks with a reason instead of skipping (only `format-before-push` deliberately skips quietly, since it is just an advisory format step, not a guard).
- **No auto-commit**: only `prettier --write` on the working tree. If formatting produces changes → `permissionDecision: "ask"` warns that those files are NOT committed yet (the current push still pushes the old version) -- the user decides whether to commit more or ignore; it never commits on their behalf.
- **Safety**: always `exit 0` when no warning is needed; missing `jq`/`git`, not a `git push` command, no remote tracking branch, missing Prettier, or no file in the diff needing format → skip quietly.
- **Dependency**: needs `jq`, `git`; Prettier (optional -- skipped if missing, like `format-on-edit`).

## lint-on-edit — static analysis after Edit/Write

After each Edit/Write, this hook runs the linter/type-checker matching the file type (`tsc` for `.ts/.tsx`, `eslint` for `.js/.jsx`, `ruff`/`flake8` for `.py`, `phpstan` for `.php`) and returns errors to Claude via `additionalContext` -- see [`rules/delivery.md`](../rules/delivery.md#quality-and-evidence). Advisory only, does not block because the tool already finished.

- **Script**: [`scripts/lint-on-edit.sh`](./scripts/lint-on-edit.sh)
- **Hook type**: `PostToolUse`, matcher `Edit|Write`
- **Safety**: no matching linter, unsupported file type, or output with only a 0-error summary (`Found 0 errors`, `no errors`, `0 problems`...) → skip quietly.
- **Dependency**: needs `jq`; the language's linter (optional, skipped if missing).

## test-reminder — run the matching test or remind to write one after editing a source file

After each Edit/Write of a source file, this hook finds the matching test file by common naming conventions (`foo.test.ts`, `foo.spec.ts`, `__tests__/foo.test.ts`, `test_foo.py`, `foo_test.py`, `tests/test_foo.py`) and reports via `additionalContext` -- see [`rules/delivery.md`](../rules/delivery.md#quality-and-evidence):

- **Test exists**: runs that test automatically and reports the result (regression test right after the edit).
- **No test yet**: reminds to consider writing a test with skill [`testing`](../skills/testing/references/unit-testing.md).

- **Script**: [`scripts/test-reminder.sh`](./scripts/test-reminder.sh) -- one process per Edit/Write, sharing the test-finding logic for both branches.
- **Hook type**: `PostToolUse`, matcher `Edit|Write`
- **Scope**: only JS/TS (`jest`/`vitest`) and Python (`pytest`) -- the two most common stacks, not trying to cover every language (see [`rules/coding.md`](../rules/coding.md#kiss-yagni-and-scope)). Skips test files. The reminder branch also skips files in `node_modules/vendor/dist/build/migrations/__tests__/tests`, `*.d.ts` and config/entry-point files (`index.*`, `main.*`, `config.*`, `settings.*`).
- **Safety**: missing test runner or a test printing nothing → skip quietly; the reminder branch is advisory only, blocks nothing; always `exit 0`.
- **Dependency**: needs `jq`; the matching test runner (optional).

## dependency-audit-reminder — auto-audit dependencies after install

After each command that installs/adds dependencies (`npm install`, `yarn add`, `pnpm add`, `composer require`, `pip install`...) via the Bash tool, this hook runs the matching **read-only** audit of the package manager itself (`npm audit`, `composer audit`, `pip-audit`...) and reports back to Claude via `additionalContext`, pointing to skill [`dependency-audit`](../skills/dependency-audit/SKILL.md) -- see [`rules/backend.md`](../rules/backend.md#database-read-only-by-default) (similar spirit applied to package managers: free to audit, never auto-upgrade).

- **Script**: [`scripts/dependency-audit-reminder.sh`](./scripts/dependency-audit-reminder.sh)
- **Hook type**: `PostToolUse`, matcher `Bash`
- **Command detection**: same helper [`scripts/_shell-command.sh`](./scripts/_shell-command.sh) (`command_invocations`) -- accepts a package manager only as a truly executed command: `npm install|i|add`, `yarn add|install`, `pnpm add|install|i`, `composer require|update`, `pip|pip3 install`, `python|python3 -m pip install`, including after `cd x &&`, assignment prefixes, wrappers, `bash -c`, `eval`. Install words inside heredoc bodies, quoted strings, commit messages, `echo`/`grep` are ignored. The first install command in the chain decides the audit; the audit runs in the hook's cwd.
- **Runs only the audit command** (no `--fix`/`--force`, no extra install/update); skips quietly if the tool reports no vulnerabilities.
- **Safety**: always `exit 0`; missing `jq`, no dependency-install command matched, or missing audit tool → skip quietly.
- **Dependency**: needs `jq`; the ecosystem's audit tool (optional, skipped if missing).

## ci-workflow-lint — lint CI workflow files after editing

After each Edit/Write of a CI workflow file (`.github/workflows/*.yml`, `.gitlab-ci.yml`, `azure-pipelines.yml`), this hook runs the matching YAML linter (`actionlint` for GitHub Actions, `yamllint` fallback) and reports errors via `additionalContext`, pointing to skill [`ci-pipeline`](../skills/ci-pipeline/SKILL.md) -- see [`rules/delivery.md`](../rules/delivery.md#quality-and-evidence). Advisory only, does not block.

- **Script**: [`scripts/ci-workflow-lint.sh`](./scripts/ci-workflow-lint.sh)
- **Hook type**: `PostToolUse`, matcher `Edit|Write`
- **Safety**: file is not a CI workflow, or missing `actionlint`/`yamllint` → skip quietly.
- **Dependency**: needs `jq`; `actionlint` or `yamllint` (optional, skipped if missing).

## remind-cleanup — remind to clean temp files when context is nearly full

When Claude Code ends a turn and the session's context window has used **≥ 80%**, this hook finds files `Write`n in the current session (via `.agents/storage/logs/logs.jsonl` and the newest rotated file, prefiltered by `session_id` with `grep`), limited to the project scope (matching `cwd`), still on disk and matching temp-file name patterns (name starts with `tmp`/`scratch`/`debug`/`draft`/`sandbox`/`test-output`, or ends in `.tmp`/`.bak`/`.orig`), excluding files in the project's config/docs folders (`.agents/rules/`, `.agents/skills/`, `.agents/agents/`, `.claude/`, `.codex/`, `docs/`) -- if any, it reminds via `additionalContext` (with the context %, e.g. `Context used 82% (164k/200k)`) so Claude sees it and decides whether to use skill `cleanup-temp-files` to clean temp files; `/cleanup` only trims context. Below the threshold it does not remind. Each file is reminded only once per session: reminded paths are appended to `.agents/storage/state/<session_id>.cleanup-reminded`, and only new, never-reminded paths are reminded (and counted); an empty state file is skipped (BSD grep treats an empty `-f` as matching every line); a state write failure does not block the hook. See skill [`cleanup-temp-files`](../skills/cleanup-temp-files/SKILL.md).

- **Script**: [`scripts/remind-cleanup.sh`](./scripts/remind-cleanup.sh) -- calls `skills/cleanup-temp-files/scripts/find-session-scratch-files.sh`
- **Context measurement**: [`scripts/remind-cleanup-context.mjs`](./scripts/remind-cleanup-context.mjs) reads the whole `transcript_path`; the context in use is the `message.usage` of the last assistant message with usage: `input_tokens + cache_read_input_tokens + cache_creation_input_tokens`; broken JSON lines are skipped. Limit: `CLAUDE_CONTEXT_LIMIT` if it is a positive integer; if missing/invalid, infer from the transcript -- if any assistant message exceeds 200000 use 1000000 (1M-context model), otherwise 200000; the threshold is fixed at 80%.
- **Hook type**: `Stop`
- **Reminds only, never deletes**: uses `hookSpecificOutput.additionalContext`, not `decision`/`reason` (which would block Claude from stopping).
- **Safety**: always `exit 0`; below the threshold, missing transcript/unreadable usage, no candidates, missing `jq`/`node`, or missing file-finding script → silent, reports nothing.
- **Dependency**: needs `jq` and `node`; relies on the `audit-log` hook's log, so that hook must be enabled too.

## report-reminder — remind to use skill `report` if changes are unreported

When Claude Code ends a turn, this hook looks in `.agents/storage/logs/logs.jsonl` and the newest rotated file (prefiltering the session's lines with `grep -F`, not slurping the whole log; if the session spans more than one rotation, Edit/Write older than the newest rotated file are not counted) for main-session `Edit`/`Write` calls in the current session (limited to the project `cwd`; entries with `agent_id` are dropped because subagent Edit/Write are merged by the main session into the overall report) that happened **after** the most recent `report` skill call (or from the session start if never called) -- if any, it reminds via `additionalContext`. This is the mechanism enforcing [`rules/delivery.md`](../rules/delivery.md#mandatory-reporting), instead of relying only on Claude remembering to call skill `report`.

- **Script**: [`scripts/report-reminder.sh`](./scripts/report-reminder.sh)
- **Hook type**: `Stop`
- **Reminds only, never calls the skill for you**: uses `hookSpecificOutput.additionalContext`, not `decision`/`reason` (which would block Claude from stopping).
- **Safety**: always `exit 0`; no unreported Edit/Write, missing `jq`, or missing log → silent, reports nothing.
- **Dependency**: needs `jq`; relies on the `audit-log` hook's log (fields `input.skill`, `agent_id`), so that hook must be enabled too.
- **Tokens and waste**: provided by the [`report-usage`](#report-usage--real-tokens-and-waste-issues-when-calling-skill-report) hook, no longer in this hook.

## report-usage — real tokens and waste issues when calling skill `report`

When skill `report` is called, the hook reads `transcript_path` with [`task-usage.mjs`](../skills/report/scripts/task-usage.mjs) and puts the real token numbers (input, output, cache read, cache create) plus violations of the waste criteria with evidence into the context, so the report always states `Token:` and states `Waste issue:` only when there are violations (with no violation the hook prints no `Waste issue:` line).

- **Script**: [`scripts/report-usage.sh`](./scripts/report-usage.sh)
- **Hook type**: `PostToolUse`, matcher `Skill`; handles only skill `report` (not `workflow-report`).
- **Thresholds**: [`waste-criteria.json`](../skills/report/assets/waste-criteria.json) -- default: re-read the same file ≥ 3 times, repeat the same command ≥ 3 times, one tool result > 20,000 characters, ≥ 3 subagent calls, cache create > cache read when ≥ 50,000 tokens.
- **Measurement window**: from the previous `report` call (marker stored in `.agents/storage/state/<session_id>.json`); the first time is the whole session.
- **Format**: `📈 Token: input 18 | output 4.4k | cache read 912k | cache create 13.4k | total 930k (since previous mark).` -- `total` = input + output + cache read + cache create; numbers are shortened by the [`compact-number.mjs`](./scripts/compact-number.mjs) CLI (reads `{ usage }` from stdin; < 1000 unchanged; k/M, below 100 keep 1 decimal, from 100 round to an integer); label `whole session` or `since previous mark`. The `<session_id>.emitted.json` file still stores raw numbers, plus `total`.
- **Safety**: always `exit 0`, never blocks; missing `jq`/`node`/script or unreadable transcript → silent, no N/A or estimates.
- **Scope**: Claude Code only (Codex has no such hook, so drop those two lines from the report).
- **Latency**: the transcript at hook time does not yet include the current turn's messages, so numbers are counted up to the skill call; the first turn of a headless session has no messages yet, so the hook is silent. Interactive sessions were verified: the hook inserts real numbers when calling `report`; the measured deviation on a long session versus the end-of-turn numbers is only about 0.7-2.6% (input +1.45%, output +1.81%, cache read +2.59%, cache create +0.72%).

## report-usage-check — compare the Token line in the report with the numbers the hook inserted

Prevents filling in unsourced Token numbers: the `report-usage` hook writes the inserted numbers to `.agents/storage/state/<session_id>.emitted.json`, and this hook compares the `Token:` line in the final message with them.

- **Script**: [`scripts/report-usage-check.sh`](./scripts/report-usage-check.sh) (logic in [`report-usage-check.mjs`](./scripts/report-usage-check.mjs))
- **Hook type**: `Stop`; reads the payload's `last_assistant_message`, falling back to the last message from the transcript.
- **How it compares**: extracts the 4 numbers after `input`, `output`, `cache read`, `cache create`; accepts raw numbers (`.` `,` and spaces are thousands separators, must equal the hook number exactly) or shortened `4.4k`/`1.2M` (k/M case-insensitive, must equal the exact string [`compact-number.mjs`](./scripts/compact-number.mjs) produces from the hook number); `total` is optional and if present must match `total` by the same rules; the warning shows the hook numbers in shortened form; on a mismatch or when no hook numbers exist it warns once per mismatch kind (`<session_id>.checked`), via `additionalContext`, without blocking.
- **Silent when**: no Token line, numbers match, `stop_hook_active` is true, missing `node`/`jq`, or unparseable.
- **Limit**: assumes the template wording (`input … output … cache read … cache create …`); written differently the hook stays silent, never misreports.

## turn-log — one summary line per turn

When Claude Code ends a turn, the hook reads `transcript_path` and writes **one** `type: "turn"` line to `.agents/storage/logs/logs.jsonl` (the same file as `audit-log`, rotated by the same [`_log-rotate.sh`](./scripts/_log-rotate.sh) helper -- `turn-log.mjs` `stat`s the file first and runs `bash _log-rotate.sh <log_dir>` only once `LUMINA_LOG_MAX_BYTES` is reached; per-tool-call lines are unchanged):

```json
{"ts":"2026-10-22T03:00:00Z","type":"turn","session_id":"…","request":"Fix Stop hook","tools":{"Bash":2,"Edit":2,"Write":1,"Agent":1},"files":["/repo/a.js","/repo/b.js"],"tokens":{"input":17,"output":31,"cacheRead":413,"cacheCreate":49,"total":510},"subagentTokens":{"input":4,"output":9,"cacheRead":300,"cacheCreate":10,"total":323}}
```

- **Script**: [`scripts/turn-log.sh`](./scripts/turn-log.sh) (logic in [`turn-log.mjs`](./scripts/turn-log.mjs); tokens measured with `measure` of [`task-usage.mjs`](../skills/report/scripts/task-usage.mjs))
- **Hook type**: `Stop`; prints nothing to stdout, never blocks.
- **Current turn**: the lines after the user's last real prompt -- a main-session `type: "user"` line, not `isMeta`/`isCompactSummary`, `origin.kind` is `human` (or no `origin`), not containing `tool_result`, not starting with `<task-notification>`, `<local-command-`, `<command-name>` (local commands like `/clear`), `<bash-input>`/`<bash-stdout>`/`<bash-stderr>` or `[Request interrupted by user`.
- **Fields**: `request` -- the prompt with whitespace collapsed, obvious secrets masked (`Bearer …`, `password=`/`token=`/`secret=`/`api_key=`…, `sk_live_`, `sk-…`, `ghp_`/`github_pat_`, `AKIA…`, `xox…-`, JWT, private key) then cut to 200 characters; a slash command is written `/<command> <arguments>`. `tools` -- call count per tool name (deduplicated by `tool_use` id). `files` -- `file_path`/`notebook_path` of `Edit`/`Write`/`NotebookEdit`, unique, in order. `tokens` -- sum of the main session's `message.usage` in the turn (keeping the newest usage per `message.id`), raw numbers, `total` = input + output + cacheRead + cacheCreate. Never writes file content or tool output.
- **Subagents**: `subagentTokens` (same shape as `tokens`) is summed from the separate transcript `<transcript without .jsonl suffix>/subagents/agent-<agentId>.jsonl` of subagents called in the turn and finished (tool result `status: "completed"` or `agent-<id>.meta.json` with `finished: true`); `totalTokens` on the tool result is not used because it is only the context of the last request. Background subagents still running at Stop are counted in `subagentsPending`, with no tokens added. Missing data drops the field.
- **Dedup**: stores the line/uuid of the turn's first prompt already written in `.agents/storage/state/<session_id>.turn.json`; if Stop reruns for the same turn (including `stop_hook_active`) it skips.
- **Safety**: always `exit 0`; missing `node`, `task-usage.mjs`, transcript, prompt, or a broken payload → silent, writes nothing. The log folder comes from `CLAUDE_PROJECT_DIR`, falling back to `cwd` in the payload then the current directory.
- **Limits**: a turn continued after Stop without a new prompt (e.g. a background subagent's `<task-notification>` reply) writes no extra line; subagent Edit/Write and tools are not counted in `tools`/`files`; a background subagent finishing in a later turn is not added to any turn; nested subagents (a subagent calling a subagent) are not summed. Prompt detection relies on Claude Code's current transcript shape.
- **Filter the log**: `jq -c 'select(.type == "turn")' .agents/storage/logs/logs.jsonl`

## notify-done — play a sound when a task is done

When Claude Code ends a turn (finished answering, nothing still running), this hook plays a short notification sound so you know the task is done without watching the screen.

- **Script**: [`scripts/notify-done.sh`](./scripts/notify-done.sh)
- **Hook type**: `Stop` (no `matcher` needed -- this hook is not tied to a specific tool)
- **Sound per OS**: `afplay` (macOS, uses `Glass.aiff`) → `paplay`/`aplay` (Linux) → `powershell.exe [console]::beep` (Windows/WSL). If no tool is available it skips quietly.
- **Safety**: always `exit 0`, runs in the background (`&`) so it does not slow Claude Code stopping.

## condense-planner-input — safety net against overly long prompts when calling planner

Before each Agent tool call with `subagent_type: planner`, this hook checks the `prompt` length -- if it exceeds a very large threshold (e.g. a whole long `architect` document pasted verbatim by mistake), it cuts it down (keeping the head + tail, cutting the middle) before `planner` receives it. **This is only a final safety net, not the main context-shrinking mechanism** -- bash has no semantic understanding, so it cannot know which parts really need keeping; choosing the relevant parts is the responsibility of the step that calls `planner` (see [`workflow-plan`](../skills/workflow-plan/SKILL.md)).

- **Script**: [`scripts/condense-planner-input.sh`](./scripts/condense-planner-input.sh)
- **Hook type**: `PreToolUse`, matcher `Agent`
- **Mechanism**: uses `hookSpecificOutput.updatedInput` to replace `tool_input.prompt` before the tool runs -- keeping other fields (`subagent_type`, `description`...) intact.
- **Threshold**: cut when `prompt` > 20000 characters, keeping the first 13000 + last 6000 characters, inserting a marker line for the cut part.
- **Safety**: `prompt` under the threshold, not the `Agent` tool, not `subagent_type: planner`, or missing `jq` → change nothing.
- **Dependency**: needs `jq`.

## agent-role-reminder — report the agent being called + remind on likely over-delegation

On every Agent tool call, this hook always reports the `subagent_type` being used. For "heavy" roles (`analyst`, `planner`, `architect`, `reviewer`, `qa-tester`, `researcher`) with a very short `prompt` -- a mechanical signal of possibly over-delegating a small task -- the hook switches to asking for confirmation instead of just notifying. See [Execution discipline](../../AGENTS.md#execution-discipline)/[Agent coordination](../../AGENTS.md#agent-coordination).

- **Script**: [`scripts/agent-role-reminder.sh`](./scripts/agent-role-reminder.sh)
- **Hook type**: `PreToolUse`, matcher `Agent`
- **Mechanism**: `permissionDecision: "allow"` + `permissionDecisionReason` reporting the agent name (does not block) for every call; switches to `"ask"` when `subagent_type` is in the "heavy" group **and** `prompt` < 150 characters -- the user confirms whether to continue.
- **Limit**: only checks `prompt` length, no task semantics -- a small text task that genuinely needs that role (e.g. reviewing 1 high-risk file) is still asked about; confirming to continue is normal.
- **Safety**: missing `jq` or not the `Agent` tool → do nothing.
- **Dependency**: needs `jq`.

## ensure-final-newline — final newline of text files

- **Script**: [`scripts/ensure-final-newline.mjs`](./scripts/ensure-final-newline.mjs), needs no Prettier or new package.
- **Trigger condition**: Claude `PostToolUse`, matcher `Edit|Write`; only adds a missing newline to a text file just edited in the project, preserving LF/CRLF and existing content. Does not touch binaries, symlinks, empty files or files outside the project.
- **Check**: `node .agents/hooks/scripts/ensure-final-newline.mjs --check <file...>`; a missing newline returns exit 1, without modifying files. `--write <file...>` fixes the given paths; it does not scan/fix the whole repo.
- **Other runtimes**: Codex/Antigravity run the checker per quality-assurance; the Claude hook does not run there automatically. `.editorconfig` enables `insert_final_newline` for editors that support it.
- **Limit**: check the list of files in the task; no guarantee for unchecked files. Fixtures deliberately missing a newline must be excluded from the list with a reason.

## copy-browser-screenshot — bring browser screenshots from the temp folder into the project

The Claude in Chrome tool saves screenshots in the system temp folder (e.g. `/var/folders/.../T/claude-chrome-screenshots-<id>/screenshot-<number>-<n>.jpg`), which the OS may clean. The hook copies the image into the project's `.agents/storage/evidence/browser/<yyyyMMdd>/` and reports the new path via `additionalContext` so the agent cites that path instead of the temp path -- see [`rules/frontend.md`](../rules/frontend.md).

- **Script**: [`scripts/copy-browser-screenshot.sh`](./scripts/copy-browser-screenshot.sh)
- **Hook type**: `PostToolUse`, matcher `mcp__claude-in-chrome__.*`
- **Image detection**: scans every string in `tool_response` with the `.png`/`.jpg`/`.jpeg`/`.webp` file regex (independent of field name); accepts only regular files (symlinks dropped) whose real directory is under `$TMPDIR`, `/tmp`, `/private/tmp`, `/var/folders`, `/private/var/folders` and not already inside the project.
- **Copy, not move**: keeps the file name; on a name clash adds suffix `-1`, `-2`..., never overwrites.
- **Safety**: always `exit 0`, never blocks the tool; missing `jq`, no valid image, or a copy failure → silent.
- **Dependency**: needs `jq`. Claude Code only (Codex has no such tool).
- **Limit**: not verified against a real Chrome `tool_response`; an image returned only as base64 (no file path) cannot be copied.

## General limits (best-effort)

The git-command-detecting hooks (`commit-msg-guard`, `bugfix-test-reminder`, `secret-scan`, `protected-branch-guard`, `format-before-push`) statically analyse the Bash command string with [`scripts/_shell-command.sh`](./scripts/_shell-command.sh), without running a real shell. These forms still cannot be scanned:

- Git aliases (`git ci`, aliases in `~/.gitconfig`) and shell functions/aliases wrapping git.
- Script files calling git (`bash deploy.sh`, `make release`, `npm run release`), git hooks, other programs calling git themselves.
- Commands built from variables or results (`$CMD push`, `cd "$dir"`, `git -C "$dir"` with a dynamic dir); a dynamic subcommand is checked as the subcommand under consideration but a dynamic message/argument cannot be read.
- `$(...)` in an unquoted-delimiter heredoc body, `bash -s`/`sh < file`, `env -S`, `xargs sh -c` with a script from stdin; sub-scripts nested deeper than 4 levels.
- Hooks run git in the session's cwd (or a static `cd`/`-C` directory), not following `--git-dir`/`--work-tree`.

## _dedupe-guard — avoid hooks running twice

When installed globally, hooks are registered in both `~/.claude/settings.json` (absolute path) and the project's `.claude/settings.json` (`$(git rev-parse --show-toplevel)`). The two command strings differ, so Claude Code runs both on every event, duplicating logs and results.

- **File**: [`scripts/_dedupe-guard.sh`](./scripts/_dedupe-guard.sh), `source`d at the top of every `.sh` hook; `ensure-final-newline.mjs` has an equivalent check in hook mode.
- **Mechanism**: a copy running from a directory other than `<project>/.claude/hooks/scripts` exits immediately (`exit 0`, reads no stdin, prints nothing) if the project already has the same script; if another project has no such script the user-level copy runs normally. Compared by physical path (`pwd -P`), so going through the `.agents/hooks` symlink still counts as the project copy.
- **Verification**: one skill call wrote 2 `audit-log` lines before the guard and 1 line after (measured in a real Claude session).
- Not registered in settings because it is only `source`d.

## Already enabled in this repo

`hook/` lives in `.claude/hooks/` of this repo, and `.claude/settings.json` already points all 21 self-written hooks (`audit-log`, `commit-msg-guard`, `bugfix-test-reminder`, `secret-scan`, `protected-branch-guard`, `format-before-push`, `condense-planner-input`, `agent-role-reminder`, `format-on-edit`, `ensure-final-newline`, `lint-on-edit`, `test-reminder`, `dependency-audit-reminder`, `ci-workflow-lint`, `copy-browser-screenshot`, `remind-cleanup`, `report-reminder`, `report-usage`, `report-usage-check`, `turn-log`, `notify-done`) at the exact `.claude/hooks/scripts/...` paths -- nothing more to install to use them right away in this repo. Only the `rtk hook claude` hook calls an external tool and runs only if [`rtk`](https://github.com/rtk-ai/rtk) is installed (see its own section above). When copying to another project, use the `lumina-agent` installer or merge the `hooks` key of `.claude/settings.json` per the instructions above.
