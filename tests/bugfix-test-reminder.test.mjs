import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const hook = fileURLToPath(new URL('../.claude/hooks/scripts/bugfix-test-reminder.sh', import.meta.url));

function git(root, ...args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}

function repository(context, stagedFiles) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'bugfix-test-reminder-')));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  git(root, 'init', '-q');
  for (const file of stagedFiles) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), 'export const value = 1;\n');
  }
  if (stagedFiles.length > 0) git(root, 'add', ...stagedFiles);
  return root;
}

function runHook(root, command, toolName = 'Bash') {
  const environment = { ...process.env };
  delete environment.CLAUDE_PROJECT_DIR;
  return spawnSync('bash', [hook], {
    cwd: root,
    input: JSON.stringify({ tool_name: toolName, tool_input: { command }, cwd: root }),
    encoding: 'utf8',
    env: environment,
  });
}

function reminderOf(result) {
  assert.equal(result.status, 0, result.stderr);
  if (result.stdout.trim() === '') return null;
  const output = JSON.parse(result.stdout);
  assert.equal(output.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.equal(output.hookSpecificOutput.permissionDecision, undefined);
  return output.hookSpecificOutput.additionalContext;
}

test('fix commit without staged test file gets an advisory reminder', context => {
  const root = repository(context, ['src/cart.js']);
  const reminder = reminderOf(runHook(root, 'git commit -m "fix: handle empty cart"'));
  assert.match(reminder, /regression test/);
  assert.match(reminder, /bug-fix/);
  assert.match(reminder, /trước\/sau/);
});

test('fix commit with a staged test file stays silent', context => {
  const root = repository(context, ['src/cart.js', 'tests/x.test.mjs']);
  assert.equal(reminderOf(runHook(root, 'git commit -m "fix: handle empty cart"')), null);
});

test('feat commit without test stays silent', context => {
  const root = repository(context, ['src/cart.js']);
  assert.equal(reminderOf(runHook(root, 'git commit -m "feat: add cart"')), null);
});

test('scoped and breaking fix types are recognised, including heredoc messages', context => {
  const root = repository(context, ['src/api.js']);
  assert.match(reminderOf(runHook(root, 'git commit -m "fix(api): reject empty payload"')), /regression test/);
  assert.match(reminderOf(runHook(root, "git commit -m 'fix!: drop legacy field'")), /regression test/);
  const heredoc = "git commit -m \"$(cat <<'EOF'\nfix(api): reject empty payload\n\nBody.\nEOF\n)\"";
  assert.match(reminderOf(runHook(root, heredoc)), /regression test/);
  assert.equal(reminderOf(runHook(root, 'git commit -m "fixup: not a fix type"')), null);
});

test('commit -a includes tracked modified files when looking for tests', context => {
  const root = repository(context, ['src/cart.js', 'tests/cart.test.mjs']);
  git(root, '-c', 'user.email=t@example.com', '-c', 'user.name=t', 'commit', '-q', '-m', 'chore: init');
  fs.writeFileSync(path.join(root, 'src/cart.js'), 'export const value = 2;\n');
  assert.match(reminderOf(runHook(root, 'git commit -am "fix: cart total"')), /regression test/);
  fs.writeFileSync(path.join(root, 'tests/cart.test.mjs'), 'export const value = 2;\n');
  assert.equal(reminderOf(runHook(root, 'git commit -am "fix: cart total"')), null);
});

test('test paths added in the same command count as staged', context => {
  const root = repository(context, ['src/cart.js']);
  fs.mkdirSync(path.join(root, 'test'), { recursive: true });
  fs.writeFileSync(path.join(root, 'test/cart_test.py'), 'x = 1\n');
  assert.equal(reminderOf(runHook(root, 'git add test/cart_test.py && git commit -m "fix: cart"')), null);
});

test('non commit commands and other tools stay silent', context => {
  const root = repository(context, ['src/cart.js']);
  assert.equal(reminderOf(runHook(root, 'git status')), null);
  assert.equal(reminderOf(runHook(root, 'echo "fix: something"')), null);
  assert.equal(reminderOf(runHook(root, 'git commit -m "fix: x"', 'Read')), null);
});

test('git -C reads staged files and add paths from the target repository', context => {
  const caller = repository(context, ['src/cart.js']);
  const target = repository(context, ['src/api.js', 'tests/api.test.mjs']);
  assert.equal(reminderOf(runHook(caller, `git -C ${target} commit -m "fix: api"`)), null);
  assert.match(reminderOf(runHook(target, `git -C "${caller}" commit -m "fix: cart"`)), /regression test/);
  fs.mkdirSync(path.join(caller, 'tests'), { recursive: true });
  fs.writeFileSync(path.join(caller, 'tests/cart.test.mjs'), 'x\n');
  assert.equal(reminderOf(runHook(target, `git -C ${caller} add tests/cart.test.mjs && git -C ${caller} commit -m "fix: cart"`)), null);
});

test('git commit text inside heredoc data or quotes stays silent', context => {
  const root = repository(context, ['src/cart.js']);
  const heredocData = "cat > notes.md <<'EOF'\nfix: cart total note\nRun git commit -m \"fix: handle empty cart\"\nEOF";
  assert.equal(reminderOf(runHook(root, heredocData)), null);
  assert.equal(reminderOf(runHook(root, "echo 'git commit -m \"fix: x\"'")), null);
});
