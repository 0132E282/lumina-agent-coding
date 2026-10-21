import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('../.agents/skills/debugs/scripts/verify-regression.sh', import.meta.url));
const buggySum = 'export const sum = (a, b) => a - b;\n';
const fixedSum = 'export const sum = (a, b) => a + b;\n';
const sumTest = "import assert from 'node:assert/strict';\nimport { sum } from '../src/sum.mjs';\nassert.equal(sum(2, 3), 5);\n";
const unrelatedTest = "import assert from 'node:assert/strict';\nassert.equal(1 + 1, 2);\n";

function git(cwd, ...args) {
  const result = spawnSync('git', ['-c', 'user.email=t@example.com', '-c', 'user.name=t', ...args], { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function write(root, file, content) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), content);
}

function fixture(context) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'verify-regression-')));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const repository = path.join(root, 'repo');
  const temporary = path.join(root, 'tmp');
  const evidence = path.join(root, 'evidence');
  fs.mkdirSync(repository);
  fs.mkdirSync(temporary);
  git(repository, 'init', '-q', '-b', 'fix/sum');
  write(repository, 'package.json', '{"type":"module"}\n');
  write(repository, 'src/sum.mjs', buggySum);
  git(repository, 'add', '.');
  git(repository, 'commit', '-q', '-m', 'feat: sum');
  return { repository, temporary, evidence, base: git(repository, 'rev-parse', 'HEAD') };
}

function verify({ repository, temporary, evidence, base }, ...command) {
  return spawnSync('bash', [script, '--evidence-dir', evidence, base, '--', ...command], {
    cwd: repository,
    encoding: 'utf8',
    env: { ...process.env, TMPDIR: temporary },
  });
}

function assertCleaned({ repository, temporary }) {
  assert.equal(git(repository, 'worktree', 'list').split('\n').length, 1);
  assert.deepEqual(fs.readdirSync(temporary), []);
}

test('real regression: base fails and head passes -> exit 0 with evidence log', context => {
  const setup = fixture(context);
  write(setup.repository, 'src/sum.mjs', fixedSum);
  write(setup.repository, 'tests/sum.test.mjs', sumTest);
  git(setup.repository, 'add', '.');
  git(setup.repository, 'commit', '-q', '-m', 'fix: sum adds');
  const result = verify(setup, 'node', 'tests/sum.test.mjs');
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, new RegExp(`base ${setup.base.slice(0, 12)}\\w*: FAIL \\(exit 1\\)`));
  assert.match(result.stdout, /head: PASS/);
  const logs = fs.readdirSync(setup.evidence);
  assert.equal(logs.length, 1);
  assert.match(logs[0], /^\d{8}-\d{4}-regression\.log$/);
  assert.match(fs.readFileSync(path.join(setup.evidence, logs[0]), 'utf8'), /AssertionError/);
  assertCleaned(setup);
});

test('uncommitted fix and untracked test are verified without touching the working tree', context => {
  const setup = fixture(context);
  write(setup.repository, 'src/sum.mjs', fixedSum);
  write(setup.repository, 'tests/sum.test.mjs', sumTest);
  const statusBefore = git(setup.repository, 'status', '--porcelain');
  const result = verify(setup, 'node', 'tests/sum.test.mjs');
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(git(setup.repository, 'status', '--porcelain'), statusBefore);
  assert.equal(fs.readFileSync(path.join(setup.repository, 'src/sum.mjs'), 'utf8'), fixedSum);
  assertCleaned(setup);
});

test('test that passes on base does not reproduce the bug -> exit 1', context => {
  const setup = fixture(context);
  write(setup.repository, 'src/sum.mjs', fixedSum);
  write(setup.repository, 'tests/unrelated.test.mjs', unrelatedTest);
  const result = verify(setup, 'node', 'tests/unrelated.test.mjs');
  assert.equal(result.status, 1);
  assert.match(result.stdout, /base \w+: PASS/);
  assert.match(result.stdout, /không tái hiện lỗi/);
  assertCleaned(setup);
});

test('head still failing -> exit 1', context => {
  const setup = fixture(context);
  write(setup.repository, 'tests/sum.test.mjs', sumTest);
  const result = verify(setup, 'node', 'tests/sum.test.mjs');
  assert.equal(result.status, 1);
  assert.match(result.stdout, /base \w+: FAIL/);
  assert.match(result.stdout, /head: FAIL/);
  assertCleaned(setup);
});

test('no new or changed test file -> exit 2', context => {
  const setup = fixture(context);
  write(setup.repository, 'src/sum.mjs', fixedSum);
  const result = verify(setup, 'node', '-e', '0');
  assert.equal(result.status, 2);
  assert.match(result.stdout + result.stderr, /không có regression test/i);
  assertCleaned(setup);
});

test('invalid usage -> exit 2', context => {
  const setup = fixture(context);
  const result = spawnSync('bash', [script, setup.base], { cwd: setup.repository, encoding: 'utf8' });
  assert.equal(result.status, 2);
  const unknown = verify({ ...setup, base: 'no-such-ref' }, 'node', '-e', '0');
  assert.equal(unknown.status, 2);
  assertCleaned(setup);
});
