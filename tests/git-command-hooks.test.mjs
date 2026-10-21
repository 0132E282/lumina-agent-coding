import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const scripts = fileURLToPath(new URL('../.claude/hooks/scripts/', import.meta.url));
// Giá trị giả, dựng bằng nối chuỗi để chính file test không khớp pattern secret.
const fakeSecret = `AKIA${'A'.repeat(16)}`;
const fakeAwsKey = 'AKIA' + 'EXAMPLEEXAMPLE12';
const fakePrivateKeyHeader = '-----BEGIN RSA ' + 'PRIVATE KEY-----';
const fakeApiKeyAssignment = 'api_key' + ' = "' + 'example'.repeat(3) + '"';

function git(cwd, ...args) {
  const result = spawnSync('git', ['-c', 'user.email=t@example.com', '-c', 'user.name=t', ...args], { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}

function temporaryDirectory(context, prefix) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function repository(context) {
  const root = temporaryDirectory(context, 'git-command-hooks-');
  git(root, 'init', '-q', '-b', 'main');
  fs.writeFileSync(path.join(root, 'README.md'), 'hello\n');
  git(root, 'add', 'README.md');
  git(root, 'commit', '-q', '-m', 'chore: init');
  return root;
}

function decisionOf(script, root, command) {
  const environment = { ...process.env };
  delete environment.CLAUDE_PROJECT_DIR;
  const result = spawnSync('bash', [path.join(scripts, script)], {
    cwd: root,
    input: JSON.stringify({ tool_name: 'Bash', tool_input: { command } }),
    encoding: 'utf8',
    env: environment,
  });
  assert.equal(result.status, 0, result.stderr);
  if (result.stdout.trim() === '') return null;
  return JSON.parse(result.stdout).hookSpecificOutput.permissionDecision;
}

const heredocWith = (text) => `cat > notes.md <<'EOF'\n${text}\nEOF`;

test('secret-scan ignores git add/commit text inside heredoc data or quotes', context => {
  const root = repository(context);
  fs.writeFileSync(path.join(root, 'leak.txt'), `${fakeSecret}\n`);
  git(root, 'add', 'leak.txt');
  assert.equal(decisionOf('secret-scan.sh', root, heredocWith('git commit -m "chore: x"')), null);
  assert.equal(decisionOf('secret-scan.sh', root, "echo 'git add .env'"), null);
  assert.equal(decisionOf('secret-scan.sh', root, heredocWith('git add .env')), null);
});

test('secret-scan still asks on executed git add of an env file', context => {
  const root = repository(context);
  assert.equal(decisionOf('secret-scan.sh', root, 'git add .env'), 'ask');
  assert.equal(decisionOf('secret-scan.sh', root, 'git status && git add config/.env.local'), 'ask');
});

test('protected-branch-guard ignores git push text inside heredoc data or quotes', context => {
  const root = repository(context);
  assert.equal(decisionOf('protected-branch-guard.sh', root, "echo 'git push origin main'"), null);
  assert.equal(decisionOf('protected-branch-guard.sh', root, heredocWith('git push --force origin main')), null);
});

test('protected-branch-guard still asks on executed git push, including git -C', context => {
  const root = repository(context);
  assert.equal(decisionOf('protected-branch-guard.sh', root, 'git push origin main'), 'ask');
  assert.equal(decisionOf('protected-branch-guard.sh', root, `git -C ${root} push origin main`), 'ask');
});

function repositoryWithUpstreamAndFakePrettier(context) {
  const remote = temporaryDirectory(context, 'git-command-hooks-remote-');
  git(remote, 'init', '-q', '--bare');
  const root = repository(context);
  git(root, 'checkout', '-q', '-b', 'feature');
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

test('format-before-push ignores git push text inside heredoc data or quotes', context => {
  const root = repositoryWithUpstreamAndFakePrettier(context);
  assert.equal(decisionOf('format-before-push.sh', root, "echo 'git push'"), null);
  assert.equal(decisionOf('format-before-push.sh', root, heredocWith('git push')), null);
  assert.equal(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), 'const a=1\n');
});

test('format-before-push still formats on executed git push', context => {
  const root = repositoryWithUpstreamAndFakePrettier(context);
  assert.equal(decisionOf('format-before-push.sh', root, 'git push'), 'ask');
  assert.match(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), /formatted/);
});

test('secret-scan asks when added files or staged diff contain secret-like content', context => {
  const root = repository(context);
  fs.writeFileSync(path.join(root, 'aws.txt'), `key=${fakeAwsKey}\n`);
  fs.writeFileSync(path.join(root, 'id_rsa.txt'), `${fakePrivateKeyHeader}\n`);
  fs.writeFileSync(path.join(root, 'plain.txt'), 'hello world\n');
  assert.equal(decisionOf('secret-scan.sh', root, 'git add aws.txt'), 'ask');
  assert.equal(decisionOf('secret-scan.sh', root, 'git add id_rsa.txt'), 'ask');
  assert.equal(decisionOf('secret-scan.sh', root, 'git add plain.txt'), null);

  fs.writeFileSync(path.join(root, 'config.py'), `${fakeApiKeyAssignment}\n`);
  git(root, 'add', 'config.py');
  assert.equal(decisionOf('secret-scan.sh', root, 'git commit -m "chore: config"'), 'ask');
});

test('secret-scan stays silent on a commit whose staged diff is ordinary', context => {
  const root = repository(context);
  fs.writeFileSync(path.join(root, 'plain.txt'), 'hello world\n');
  git(root, 'add', 'plain.txt');
  assert.equal(decisionOf('secret-scan.sh', root, 'git commit -m "chore: plain"'), null);
});

test('secret-scan inspects the repository and paths given by git -C', context => {
  const root = repository(context);
  const other = repository(context);
  fs.writeFileSync(path.join(other, 'aws.txt'), `key=${fakeAwsKey}\n`);
  assert.equal(decisionOf('secret-scan.sh', root, `git -C ${other} add aws.txt`), 'ask');
  assert.equal(decisionOf('secret-scan.sh', root, `git -C "${other}" add aws.txt`), 'ask');
  fs.writeFileSync(path.join(other, 'config.py'), `${fakeApiKeyAssignment}\n`);
  git(other, 'add', 'config.py');
  assert.equal(decisionOf('secret-scan.sh', root, 'git commit -m "chore: x"'), null);
  assert.equal(decisionOf('secret-scan.sh', root, `git -C '${other}' commit -m "chore: x"`), 'ask');
});

test('protected-branch-guard only reads push flags from the executed push', context => {
  const root = repository(context);
  git(root, 'checkout', '-q', '-b', 'feature');
  const dataThenPush = `${heredocWith('git push --force --no-verify origin main')}\ngit push origin feature`;
  assert.equal(decisionOf('protected-branch-guard.sh', root, dataThenPush), null);
  assert.equal(decisionOf('protected-branch-guard.sh', root, 'echo "--force" && git push origin feature'), null);
  assert.equal(decisionOf('protected-branch-guard.sh', root, 'git push --force origin feature'), 'ask');
  assert.equal(decisionOf('protected-branch-guard.sh', root, 'git push --no-verify origin feature'), 'ask');
});

test('protected-branch-guard reads the branch of the git -C repository', context => {
  const root = repository(context);
  git(root, 'checkout', '-q', '-b', 'feature');
  const other = repository(context);
  assert.equal(decisionOf('protected-branch-guard.sh', root, 'git push origin feature'), null);
  assert.equal(decisionOf('protected-branch-guard.sh', root, `git -C ${other} push origin main`), 'ask');
  assert.equal(decisionOf('protected-branch-guard.sh', other, `git -C "${root}" push origin feature`), null);
});

test('format-before-push formats the git -C repository', context => {
  const root = repositoryWithUpstreamAndFakePrettier(context);
  const caller = temporaryDirectory(context, 'git-command-hooks-caller-');
  assert.equal(decisionOf('format-before-push.sh', caller, `git -C ${root} push`), 'ask');
  assert.match(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), /formatted/);
});
