import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const scripts = path.join(repoRoot, '.claude/hooks/scripts');
// Giá trị giả, dựng bằng nối chuỗi để chính file test không khớp pattern secret.
const fakeSecret = `AKIA${'A'.repeat(16)}`;
const fakeAwsKey = 'AKIA' + 'EXAMPLEEXAMPLE12';
const fakePrivateKeyHeader = '-----BEGIN RSA ' + 'PRIVATE KEY-----';
const fakeApiKeyAssignment = 'api_key' + ' = "' + 'example'.repeat(3) + '"';

function git(cwd, ...args) {
  const result = spawnSync('git', ['-c', 'user.email=t@example.com', '-c', 'user.name=t', ...args], { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}

function temporaryDirectory(context, prefix = 'bash-hooks-') {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function repository(context, branch = 'main') {
  const root = temporaryDirectory(context);
  git(root, 'init', '-q', '-b', 'main');
  fs.writeFileSync(path.join(root, 'README.md'), 'hello\n');
  git(root, 'add', 'README.md');
  git(root, 'commit', '-q', '-m', 'chore: init');
  if (branch !== 'main') git(root, 'checkout', '-q', '-b', branch);
  return root;
}

// Repo chưa có commit nào, chỉ stage sẵn các file được truyền vào.
function repositoryWithStagedFiles(context, stagedFiles) {
  const root = temporaryDirectory(context);
  git(root, 'init', '-q');
  for (const file of stagedFiles) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), 'export const value = 1;\n');
  }
  if (stagedFiles.length > 0) git(root, 'add', ...stagedFiles);
  return root;
}

function repositoryWithUpstreamAndFakePrettier(context) {
  const remote = temporaryDirectory(context, 'bash-hooks-remote-');
  git(remote, 'init', '-q', '--bare');
  const root = repository(context, 'feature');
  git(root, 'remote', 'add', 'origin', remote);
  git(root, 'push', '-q', '-u', 'origin', 'feature');
  fs.writeFileSync(path.join(root, 'app.js'), 'const a=1\n');
  git(root, 'add', 'app.js');
  git(root, 'commit', '-q', '-m', 'feat: app');
  const prettier = path.join(root, 'node_modules/.bin/prettier');
  fs.mkdirSync(path.dirname(prettier), { recursive: true });
  fs.writeFileSync(prettier, '#!/usr/bin/env bash\nfor f in "$@"; do [ -f "$f" ] && echo "// formatted" >> "$f"; done\n');
  fs.chmodSync(prettier, 0o755);
  return root;
}

function runHook(script, cwd, command, toolName = 'Bash') {
  const environment = { ...process.env };
  delete environment.CLAUDE_PROJECT_DIR;
  const result = spawnSync('bash', [path.join(scripts, script)], {
    cwd,
    input: JSON.stringify({ tool_name: toolName, tool_input: { command }, cwd }),
    encoding: 'utf8',
    env: environment,
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim() === '' ? null : JSON.parse(result.stdout).hookSpecificOutput;
}

const decision = (script, cwd, command) => runHook(script, cwd, command)?.permissionDecision ?? null;
const guardCommit = (command) => decision('commit-msg-guard.sh', repoRoot, command);

// bugfix-test-reminder chỉ nhắc (additionalContext), không bao giờ ra permissionDecision.
function reminder(cwd, command, toolName = 'Bash') {
  const output = runHook('bugfix-test-reminder.sh', cwd, command, toolName);
  if (output === null) return null;
  assert.equal(output.hookEventName, 'PreToolUse');
  assert.equal(output.permissionDecision, undefined);
  return output.additionalContext;
}

const heredocWith = (text) => `cat > notes.md <<'EOF'\n${text}\nEOF`;

const wrappedForms = [
  (sub) => `git -c core.pager=cat ${sub}`,
  (sub) => `git --no-pager ${sub}`,
  (sub) => `git --git-dir=.git ${sub}`,
  (sub) => `git --work-tree . ${sub}`,
  (sub) => `sudo git ${sub}`,
  (sub) => `env X=1 git ${sub}`,
  (sub) => `X=1 git ${sub}`,
  (sub) => `command git ${sub}`,
  (sub) => `time git ${sub}`,
  (sub) => `! git ${sub}`,
  (sub) => `if git ${sub}; then echo ok; fi`,
  (sub) => `{ git ${sub}; }`,
  (sub) => `(git ${sub})`,
  (sub) => `git -C . -C . ${sub}`,
  (sub) => `if true\nthen git ${sub}\nfi`,
  (sub) => `for x in a; do git ${sub}; done`,
  (sub) => `if false; then :; else git ${sub}; fi`,
  (sub) => `echo start\ngit ${sub}`,
];

// commit-msg-guard

test('commit-msg-guard ignores git commit text inside heredoc data of another command', () => {
  const command = [
    "python3 - <<'EOF'",
    "p='docs/repo/example.md'; s=open(p).read()",
    "s += 'Run: git commit -m \"fix: handle empty cart\"\\n'",
    "open(p,'w').write(s)",
    'EOF',
  ].join('\n');
  assert.equal(guardCommit(command), null);
});

test('commit-msg-guard ignores git commit text inside a quoted argument', () => {
  assert.equal(guardCommit("echo 'remember to git commit -m \"bad message\"'"), null);
  assert.equal(guardCommit("grep -n 'git commit' README.md"), null);
});

test('commit-msg-guard denies an invalid message on an executed git commit', () => {
  assert.equal(guardCommit('git commit -m "bad message"'), 'deny');
  assert.equal(guardCommit('git add a.txt && git commit -m "bad message"'), 'deny');
  assert.equal(guardCommit('cd repo; git commit -m "bad message"'), 'deny');
  assert.equal(guardCommit('git -C repo commit -m "bad message"'), 'deny');
  assert.equal(guardCommit("git commit -m \"$(cat <<'EOF'\nbad message\nEOF\n)\""), 'deny');
});

test('commit-msg-guard allows a valid message on an executed git commit', () => {
  assert.equal(guardCommit('git commit -m "fix: handle empty cart"'), null);
  assert.equal(guardCommit("git commit -m \"$(cat <<'EOF'\nfix(api): reject empty payload\n\nBody.\nEOF\n)\""), null);
});

test('W2 commit-msg-guard recognises prefixes, keywords and git global options', () => {
  for (const form of wrappedForms) {
    assert.equal(guardCommit(form('commit -m "bad message"')), 'deny', form('commit'));
    assert.equal(guardCommit(form('commit -m "feat: ok"')), null, form('commit ok'));
  }
});

test('W4 commit message comes only from the git commit arguments', () => {
  assert.equal(guardCommit("cat <<EOF > notes.md\nfeat: ok\nEOF\ngit commit -m \"bad message\""), 'deny');
  assert.equal(guardCommit('git tag -m "x" v1 && git commit -m "feat: ok"'), null);
  assert.equal(guardCommit("git commit -F - <<'EOF'\nbad message\nEOF"), 'deny');
  assert.equal(guardCommit("git commit -F - <<'EOF'\nfeat: ok\nEOF"), null);
  assert.equal(guardCommit('git commit --message="bad message"'), 'deny');
  assert.equal(guardCommit('git commit -m "feat: ok" -m "body text"'), null);
});

// secret-scan

test('secret-scan ignores git add/commit text inside heredoc data or quotes', context => {
  const root = repository(context);
  fs.writeFileSync(path.join(root, 'leak.txt'), `${fakeSecret}\n`);
  git(root, 'add', 'leak.txt');
  assert.equal(decision('secret-scan.sh', root, heredocWith('git commit -m "chore: x"')), null);
  assert.equal(decision('secret-scan.sh', root, "echo 'git add .env'"), null);
  assert.equal(decision('secret-scan.sh', root, heredocWith('git add .env')), null);
});

test('secret-scan still asks on executed git add of an env file', context => {
  const root = repository(context);
  assert.equal(decision('secret-scan.sh', root, 'git add .env'), 'ask');
  assert.equal(decision('secret-scan.sh', root, 'git status && git add config/.env.local'), 'ask');
});

test('W1 secret-scan reads quoted git add paths, including spaces', context => {
  const root = repository(context);
  fs.mkdirSync(path.join(root, 'a b'));
  fs.writeFileSync(path.join(root, 'a b/key.txt'), `key=${fakeAwsKey}\n`);
  assert.equal(decision('secret-scan.sh', root, 'git add ".env"'), 'ask');
  assert.equal(decision('secret-scan.sh', root, "git add 'config/.env.prod'"), 'ask');
  assert.equal(decision('secret-scan.sh', root, "git add 'a b/.env'"), 'ask');
  assert.equal(decision('secret-scan.sh', root, 'git add "a b/key.txt"'), 'ask');
  assert.equal(decision('secret-scan.sh', root, 'git add -- README.md'), null);
});

test('secret-scan asks when added files or staged diff contain secret-like content', context => {
  const root = repository(context);
  fs.writeFileSync(path.join(root, 'aws.txt'), `key=${fakeAwsKey}\n`);
  fs.writeFileSync(path.join(root, 'id_rsa.txt'), `${fakePrivateKeyHeader}\n`);
  fs.writeFileSync(path.join(root, 'plain.txt'), 'hello world\n');
  assert.equal(decision('secret-scan.sh', root, 'git add aws.txt'), 'ask');
  assert.equal(decision('secret-scan.sh', root, 'git add id_rsa.txt'), 'ask');
  assert.equal(decision('secret-scan.sh', root, 'git add plain.txt'), null);

  fs.writeFileSync(path.join(root, 'config.py'), `${fakeApiKeyAssignment}\n`);
  git(root, 'add', 'config.py');
  assert.equal(decision('secret-scan.sh', root, 'git commit -m "chore: config"'), 'ask');
});

test('secret-scan stays silent on a commit whose staged diff is ordinary', context => {
  const root = repository(context);
  fs.writeFileSync(path.join(root, 'plain.txt'), 'hello world\n');
  git(root, 'add', 'plain.txt');
  assert.equal(decision('secret-scan.sh', root, 'git commit -m "chore: plain"'), null);
});

test('secret-scan inspects the repository and paths given by git -C', context => {
  const root = repository(context);
  const other = repository(context);
  fs.writeFileSync(path.join(other, 'aws.txt'), `key=${fakeAwsKey}\n`);
  assert.equal(decision('secret-scan.sh', root, `git -C ${other} add aws.txt`), 'ask');
  assert.equal(decision('secret-scan.sh', root, `git -C "${other}" add aws.txt`), 'ask');
  fs.writeFileSync(path.join(other, 'config.py'), `${fakeApiKeyAssignment}\n`);
  git(other, 'add', 'config.py');
  assert.equal(decision('secret-scan.sh', root, 'git commit -m "chore: x"'), null);
  assert.equal(decision('secret-scan.sh', root, `git -C '${other}' commit -m "chore: x"`), 'ask');
});

// protected-branch-guard

test('protected-branch-guard ignores git push text inside heredoc data or quotes', context => {
  const root = repository(context);
  assert.equal(decision('protected-branch-guard.sh', root, "echo 'git push origin main'"), null);
  assert.equal(decision('protected-branch-guard.sh', root, heredocWith('git push --force origin main')), null);
});

test('protected-branch-guard still asks on executed git push, including git -C', context => {
  const root = repository(context);
  assert.equal(decision('protected-branch-guard.sh', root, 'git push origin main'), 'ask');
  assert.equal(decision('protected-branch-guard.sh', root, `git -C ${root} push origin main`), 'ask');
});

test('protected-branch-guard only reads push flags from the executed push', context => {
  const root = repository(context, 'feature');
  const dataThenPush = `${heredocWith('git push --force --no-verify origin main')}\ngit push origin feature`;
  assert.equal(decision('protected-branch-guard.sh', root, dataThenPush), null);
  assert.equal(decision('protected-branch-guard.sh', root, 'echo "--force" && git push origin feature'), null);
  assert.equal(decision('protected-branch-guard.sh', root, 'git push --force origin feature'), 'ask');
  assert.equal(decision('protected-branch-guard.sh', root, 'git push --no-verify origin feature'), 'ask');
});

test('protected-branch-guard reads the branch of the git -C repository', context => {
  const root = repository(context, 'feature');
  const other = repository(context);
  assert.equal(decision('protected-branch-guard.sh', root, 'git push origin feature'), null);
  assert.equal(decision('protected-branch-guard.sh', root, `git -C ${other} push origin main`), 'ask');
  assert.equal(decision('protected-branch-guard.sh', other, `git -C "${root}" push origin feature`), null);
});

test('W2 protected-branch-guard recognises prefixes, keywords and git global options', context => {
  const root = repository(context, 'feature');
  for (const form of wrappedForms) {
    assert.equal(decision('protected-branch-guard.sh', root, form('push --force origin feature')), 'ask', form('push'));
    assert.equal(decision('protected-branch-guard.sh', root, form('push origin feature')), null, form('push plain'));
  }
});

test('W2 dynamic git subcommand is checked as if it were the guarded subcommand', context => {
  const root = repository(context, 'feature');
  assert.equal(decision('protected-branch-guard.sh', root, 'git "$action" --force origin feature'), 'ask');
  assert.equal(decision('protected-branch-guard.sh', root, 'git $(echo push) --force origin feature'), 'ask');
  assert.equal(decision('protected-branch-guard.sh', root, 'git --version'), null);
  assert.equal(decision('protected-branch-guard.sh', root, 'echo git push --force'), null);
});

// format-before-push

test('format-before-push ignores git push text inside heredoc data or quotes', context => {
  const root = repositoryWithUpstreamAndFakePrettier(context);
  assert.equal(decision('format-before-push.sh', root, "echo 'git push'"), null);
  assert.equal(decision('format-before-push.sh', root, heredocWith('git push')), null);
  assert.equal(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), 'const a=1\n');
});

test('format-before-push still formats on executed git push', context => {
  const root = repositoryWithUpstreamAndFakePrettier(context);
  assert.equal(decision('format-before-push.sh', root, 'git push'), 'ask');
  assert.match(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), /formatted/);
});

test('format-before-push formats the git -C repository', context => {
  const root = repositoryWithUpstreamAndFakePrettier(context);
  const caller = temporaryDirectory(context, 'bash-hooks-caller-');
  assert.equal(decision('format-before-push.sh', caller, `git -C ${root} push`), 'ask');
  assert.match(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), /formatted/);
});

// bugfix-test-reminder

test('bugfix-test-reminder: fix commit without staged test file gets an advisory reminder', context => {
  const root = repositoryWithStagedFiles(context, ['src/cart.js']);
  const message = reminder(root, 'git commit -m "fix: handle empty cart"');
  assert.match(message, /regression test/);
  assert.match(message, /bug-fix/);
  assert.match(message, /trước\/sau/);
});

test('bugfix-test-reminder: fix commit with a staged test file stays silent', context => {
  const root = repositoryWithStagedFiles(context, ['src/cart.js', 'tests/x.test.mjs']);
  assert.equal(reminder(root, 'git commit -m "fix: handle empty cart"'), null);
});

test('bugfix-test-reminder: feat commit without test stays silent', context => {
  const root = repositoryWithStagedFiles(context, ['src/cart.js']);
  assert.equal(reminder(root, 'git commit -m "feat: add cart"'), null);
});

test('bugfix-test-reminder: scoped and breaking fix types are recognised, including heredoc messages', context => {
  const root = repositoryWithStagedFiles(context, ['src/api.js']);
  assert.match(reminder(root, 'git commit -m "fix(api): reject empty payload"'), /regression test/);
  assert.match(reminder(root, "git commit -m 'fix!: drop legacy field'"), /regression test/);
  const heredoc = "git commit -m \"$(cat <<'EOF'\nfix(api): reject empty payload\n\nBody.\nEOF\n)\"";
  assert.match(reminder(root, heredoc), /regression test/);
  assert.equal(reminder(root, 'git commit -m "fixup: not a fix type"'), null);
});

test('bugfix-test-reminder: commit -a includes tracked modified files when looking for tests', context => {
  const root = repositoryWithStagedFiles(context, ['src/cart.js', 'tests/cart.test.mjs']);
  git(root, 'commit', '-q', '-m', 'chore: init');
  fs.writeFileSync(path.join(root, 'src/cart.js'), 'export const value = 2;\n');
  assert.match(reminder(root, 'git commit -am "fix: cart total"'), /regression test/);
  fs.writeFileSync(path.join(root, 'tests/cart.test.mjs'), 'export const value = 2;\n');
  assert.equal(reminder(root, 'git commit -am "fix: cart total"'), null);
});

test('bugfix-test-reminder: test paths added in the same command count as staged', context => {
  const root = repositoryWithStagedFiles(context, ['src/cart.js']);
  fs.mkdirSync(path.join(root, 'test'), { recursive: true });
  fs.writeFileSync(path.join(root, 'test/cart_test.py'), 'x = 1\n');
  assert.equal(reminder(root, 'git add test/cart_test.py && git commit -m "fix: cart"'), null);
});

test('bugfix-test-reminder: non commit commands and other tools stay silent', context => {
  const root = repositoryWithStagedFiles(context, ['src/cart.js']);
  assert.equal(reminder(root, 'git status'), null);
  assert.equal(reminder(root, 'echo "fix: something"'), null);
  assert.equal(reminder(root, 'git commit -m "fix: x"', 'Read'), null);
});

test('bugfix-test-reminder: git -C reads staged files and add paths from the target repository', context => {
  const caller = repositoryWithStagedFiles(context, ['src/cart.js']);
  const target = repositoryWithStagedFiles(context, ['src/api.js', 'tests/api.test.mjs']);
  assert.equal(reminder(caller, `git -C ${target} commit -m "fix: api"`), null);
  assert.match(reminder(target, `git -C "${caller}" commit -m "fix: cart"`), /regression test/);
  fs.mkdirSync(path.join(caller, 'tests'), { recursive: true });
  fs.writeFileSync(path.join(caller, 'tests/cart.test.mjs'), 'x\n');
  assert.equal(reminder(target, `git -C ${caller} add tests/cart.test.mjs && git -C ${caller} commit -m "fix: cart"`), null);
});

test('bugfix-test-reminder: git commit text inside heredoc data or quotes stays silent', context => {
  const root = repositoryWithStagedFiles(context, ['src/cart.js']);
  const heredocData = "cat > notes.md <<'EOF'\nfix: cart total note\nRun git commit -m \"fix: handle empty cart\"\nEOF";
  assert.equal(reminder(root, heredocData), null);
  assert.equal(reminder(root, "echo 'git commit -m \"fix: x\"'"), null);
});

test('W4 W5 bugfix-test-reminder reads message and add paths from the executed commands', context => {
  const root = repository(context);
  fs.mkdirSync(path.join(root, 'src'));
  fs.writeFileSync(path.join(root, 'src/cart.js'), 'x\n');
  git(root, 'add', 'src/cart.js');
  assert.equal(reminder(root, "cat <<EOF > notes.md\nfix: note\nEOF\ngit commit -m \"feat: x\""), null);
  assert.equal(reminder(root, 'git tag -m "fix: x" v1 && git commit -m "feat: y"'), null);
  assert.match(reminder(root, 'git commit -m "feat: cart" -m "Fixes #12"'), /regression test/);
  assert.match(reminder(root, 'git commit -m "chore: cart" -m "closes #7"'), /regression test/);
  fs.mkdirSync(path.join(root, 'tests'));
  fs.writeFileSync(path.join(root, 'tests/a b.test.js'), 'x\n');
  assert.equal(reminder(root, 'git add "tests/a b.test.js" && git commit -m "fix: y"'), null);
  assert.match(reminder(root, 'git add "src/*" && git commit -m "fix: y"'), /regression test/);
});

test('S3 bugfix-test-reminder resolves git add directories and globs through git', context => {
  const root = repository(context);
  fs.mkdirSync(path.join(root, 'src'));
  fs.writeFileSync(path.join(root, 'src/cart.js'), 'x\n');
  git(root, 'add', 'src/cart.js');
  fs.mkdirSync(path.join(root, 'tests'));
  fs.writeFileSync(path.join(root, 'tests/cart.test.mjs'), 'x\n');
  assert.equal(reminder(root, 'git add tests && git commit -m "fix: cart"'), null);
  assert.equal(reminder(root, 'git add tests/*.mjs && git commit -m "fix: cart"'), null);
  assert.match(reminder(root, 'git add tests/missing && git commit -m "fix: cart"'), /regression test/);
  assert.match(reminder(root, 'git add docs && git commit -m "fix: cart"'), /regression test/);
});

// Phân tích lệnh shell dùng chung (_shell-command.sh) qua nhiều hook

test('W3 git -C comes from the executed git command, not heredoc data', context => {
  const feature = repository(context, 'feature');
  const onMain = repository(context);
  const command = `cat > notes.md <<'EOF'\ngit -C ${onMain} push origin main\nEOF\ngit push origin feature`;
  assert.equal(decision('protected-branch-guard.sh', feature, command), null);
});

test('W3 guards ask when the git -C directory cannot be entered', context => {
  const root = repository(context, 'feature');
  const push = runHook('protected-branch-guard.sh', root, 'git -C /nonexistent/repo push origin feature');
  assert.equal(push.permissionDecision, 'ask');
  assert.match(push.permissionDecisionReason, /-C/);
  const commit = runHook('secret-scan.sh', root, 'git -C /nonexistent/repo commit -m "feat: x"');
  assert.equal(commit.permissionDecision, 'ask');
  assert.match(commit.permissionDecisionReason, /-C/);
});

test('W6 reasons do not end with a dangling separator', context => {
  const root = repository(context);
  const push = runHook('protected-branch-guard.sh', root, 'git push --force origin main');
  assert.doesNotMatch(push.permissionDecisionReason, /;\s*\./);
  const add = runHook('secret-scan.sh', root, 'git add .env');
  assert.doesNotMatch(add.permissionDecisionReason, /;\s*\./);
});

test('N1 arithmetic shifts and let are not heredocs, so a following git push is still checked', context => {
  const root = repository(context);
  assert.equal(decision('protected-branch-guard.sh', root, '(( n = 1 << 3 ))\ngit push origin main'), 'ask');
  assert.equal(decision('protected-branch-guard.sh', root, 'echo $(( 1 << 3 ))\ngit push origin main'), 'ask');
  assert.equal(decision('protected-branch-guard.sh', root, 'let x=1<<3\ngit push origin main'), 'ask');
  assert.equal(guardCommit('let x=1<<3\ngit commit -m "bad message"'), 'deny');
});

test('N1 heredoc without a closing delimiter does not swallow the rest of the command', context => {
  const root = repository(context);
  assert.equal(decision('protected-branch-guard.sh', root, 'cat <<EOF\ngit push origin main'), 'ask');
  assert.equal(guardCommit('cat <<EOF\ngit commit -m "bad message"'), 'deny');
});

test('S2 wrapper commands are skipped before git', context => {
  const root = repository(context);
  for (const command of [
    'timeout 5 git push origin main',
    'timeout -s KILL -k 2 5 git push origin main',
    'xargs git push origin main',
    'xargs -n 1 -I {} git push origin main',
    'stdbuf -o L git push origin main',
    'nice -n 5 git push origin main',
    'ionice -c 3 git push origin main',
    'flock /tmp/lock git push origin main',
    'flock -w 5 /tmp/lock git push origin main',
  ]) {
    assert.equal(decision('protected-branch-guard.sh', root, command), 'ask', command);
  }
});

test('S2 shell -c, eval and command substitutions are analysed as nested commands', context => {
  const root = repository(context);
  assert.equal(decision('protected-branch-guard.sh', root, 'bash -c "git push origin main"'), 'ask');
  assert.equal(decision('protected-branch-guard.sh', root, "bash -lc 'git push origin main'"), 'ask');
  assert.equal(decision('protected-branch-guard.sh', root, 'eval git push origin main'), 'ask');
  assert.equal(decision('protected-branch-guard.sh', root, 'x=$(git push origin main)'), 'ask');
  assert.equal(decision('protected-branch-guard.sh', root, 'echo `git push origin main`'), 'ask');
  assert.equal(guardCommit(`sh -c 'git commit -m "bad message"'`), 'deny');
  assert.equal(guardCommit('echo $(git commit -m bad)'), 'deny');
  assert.equal(guardCommit('echo "$(git commit -m bad)"'), 'deny');
  assert.equal(guardCommit("git commit -m \"$(cat <<'EOF'\nfeat: ok\nEOF\n)\""), null);
  assert.equal(decision('protected-branch-guard.sh', root, 'bash -c "echo git push"'), null);
});

test('S3 git runs in the directory of a static cd earlier in the command', context => {
  const feature = repository(context, 'feature');
  const onMain = repository(context);
  assert.equal(decision('protected-branch-guard.sh', feature, `cd ${onMain} && git push origin main`), 'ask');
  assert.equal(decision('protected-branch-guard.sh', onMain, `cd ${feature} && git push origin feature`), null);
  assert.equal(decision('protected-branch-guard.sh', onMain, `cd ${feature}; bash -c "git push origin feature"`), null);
  assert.equal(decision('protected-branch-guard.sh', feature, 'cd "$somewhere" && git push origin feature'), null);
  fs.writeFileSync(path.join(onMain, 'aws.txt'), `key=${fakeAwsKey}\n`);
  assert.equal(decision('secret-scan.sh', feature, `cd ${onMain} && git add aws.txt`), 'ask');
});
