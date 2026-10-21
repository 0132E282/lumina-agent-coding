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
const fakeAwsKey = 'AKIA' + 'EXAMPLEEXAMPLE12';

function git(cwd, ...args) {
  const result = spawnSync('git', ['-c', 'user.email=t@example.com', '-c', 'user.name=t', ...args], { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}

function repository(context, branch = 'main') {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'shell-command-hooks-')));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  git(root, 'init', '-q', '-b', 'main');
  fs.writeFileSync(path.join(root, 'README.md'), 'hello\n');
  git(root, 'add', 'README.md');
  git(root, 'commit', '-q', '-m', 'chore: init');
  if (branch !== 'main') git(root, 'checkout', '-q', '-b', branch);
  return root;
}

function runHook(script, cwd, command) {
  const environment = { ...process.env };
  delete environment.CLAUDE_PROJECT_DIR;
  const result = spawnSync('bash', [path.join(scripts, script)], {
    cwd,
    input: JSON.stringify({ tool_name: 'Bash', tool_input: { command }, cwd }),
    encoding: 'utf8',
    env: environment,
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim() === '' ? null : JSON.parse(result.stdout).hookSpecificOutput;
}

const decision = (script, cwd, command) => runHook(script, cwd, command)?.permissionDecision ?? null;
const guardCommit = (command) => decision('commit-msg-guard.sh', repoRoot, command);

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

test('W2 commit-msg-guard recognises prefixes, keywords and git global options', () => {
  for (const form of wrappedForms) {
    assert.equal(guardCommit(form('commit -m "bad message"')), 'deny', form('commit'));
    assert.equal(guardCommit(form('commit -m "feat: ok"')), null, form('commit ok'));
  }
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

test('W4 commit message comes only from the git commit arguments', () => {
  assert.equal(guardCommit("cat <<EOF > notes.md\nfeat: ok\nEOF\ngit commit -m \"bad message\""), 'deny');
  assert.equal(guardCommit('git tag -m "x" v1 && git commit -m "feat: ok"'), null);
  assert.equal(guardCommit("git commit -F - <<'EOF'\nbad message\nEOF"), 'deny');
  assert.equal(guardCommit("git commit -F - <<'EOF'\nfeat: ok\nEOF"), null);
  assert.equal(guardCommit('git commit --message="bad message"'), 'deny');
  assert.equal(guardCommit('git commit -m "feat: ok" -m "body text"'), null);
});

test('W4 W5 bugfix-test-reminder reads message and add paths from the executed commands', context => {
  const root = repository(context);
  fs.mkdirSync(path.join(root, 'src'));
  fs.writeFileSync(path.join(root, 'src/cart.js'), 'x\n');
  git(root, 'add', 'src/cart.js');
  const remind = (command) => runHook('bugfix-test-reminder.sh', root, command)?.additionalContext ?? null;
  assert.equal(remind("cat <<EOF > notes.md\nfix: note\nEOF\ngit commit -m \"feat: x\""), null);
  assert.equal(remind('git tag -m "fix: x" v1 && git commit -m "feat: y"'), null);
  assert.match(remind('git commit -m "feat: cart" -m "Fixes #12"'), /regression test/);
  assert.match(remind('git commit -m "chore: cart" -m "closes #7"'), /regression test/);
  fs.mkdirSync(path.join(root, 'tests'));
  fs.writeFileSync(path.join(root, 'tests/a b.test.js'), 'x\n');
  assert.equal(remind('git add "tests/a b.test.js" && git commit -m "fix: y"'), null);
  assert.match(remind('git add "src/*" && git commit -m "fix: y"'), /regression test/);
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

test('S3 bugfix-test-reminder resolves git add directories and globs through git', context => {
  const root = repository(context);
  fs.mkdirSync(path.join(root, 'src'));
  fs.writeFileSync(path.join(root, 'src/cart.js'), 'x\n');
  git(root, 'add', 'src/cart.js');
  fs.mkdirSync(path.join(root, 'tests'));
  fs.writeFileSync(path.join(root, 'tests/cart.test.mjs'), 'x\n');
  const remind = (command) => runHook('bugfix-test-reminder.sh', root, command)?.additionalContext ?? null;
  assert.equal(remind('git add tests && git commit -m "fix: cart"'), null);
  assert.equal(remind('git add tests/*.mjs && git commit -m "fix: cart"'), null);
  assert.match(remind('git add tests/missing && git commit -m "fix: cart"'), /regression test/);
  assert.match(remind('git add docs && git commit -m "fix: cart"'), /regression test/);
});
