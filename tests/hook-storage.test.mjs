import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  dayStamp, datedLogFiles, getSessionValue, pruneStorage, pushSessionValues, readSessionState, setSessionValue, todayLogFile,
} from '../.claude/hooks/scripts/_hook-storage.mjs';

const scripts = fileURLToPath(new URL('../.claude/hooks/scripts/', import.meta.url));
const storageModule = path.join(scripts, '_hook-storage.mjs');
const storageShell = path.join(scripts, '_hook-storage.sh');
const auditHook = path.join(scripts, 'audit-log.sh');
const DAY_MS = 24 * 60 * 60 * 1000;

function root(context) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-storage-test-'));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

const stampDaysAgo = days => dayStamp(new Date(Date.now() - days * DAY_MS));

function touch(file, ageDays = 0) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, '{}\n');
  const time = new Date(Date.now() - ageDays * DAY_MS);
  fs.utimesSync(file, time, time);
}

function withKeepDays(value, action) {
  const previous = process.env.LUMINA_STORAGE_KEEP_DAYS;
  if (value === undefined) delete process.env.LUMINA_STORAGE_KEEP_DAYS;
  else process.env.LUMINA_STORAGE_KEEP_DAYS = String(value);
  try {
    return action();
  } finally {
    if (previous === undefined) delete process.env.LUMINA_STORAGE_KEEP_DAYS;
    else process.env.LUMINA_STORAGE_KEEP_DAYS = previous;
  }
}

function audit(project, env = {}) {
  const result = spawnSync('bash', [auditHook], {
    cwd: project,
    input: JSON.stringify({ session_id: 'session-1', tool_name: 'Read', tool_input: { file_path: '/x' }, cwd: project }),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: project, ...env },
  });
  assert.equal(result.status, 0, result.stderr);
}

test('todayLogFile uses one logs-YYYYMMDD.jsonl per day and never rotates by size', context => {
  const project = root(context);
  const first = todayLogFile(project);
  assert.equal(path.basename(first), `logs-${stampDaysAgo(0)}.jsonl`);
  fs.appendFileSync(first, 'x'.repeat(2 * 1024 * 1024));
  assert.equal(todayLogFile(project), first);
  audit(project, { LUMINA_LOG_MAX_BYTES: '1' });
  assert.deepEqual(fs.readdirSync(path.join(project, '.agents/storage/logs')), [path.basename(first)]);
  assert.match(fs.readFileSync(first, 'utf8'), /"tool":"Read"/);
});

test('bash and node helpers agree on the daily log file name and the readable file list', context => {
  const project = root(context);
  const logDirectory = path.join(project, '.agents/storage/logs');
  touch(path.join(logDirectory, `logs-${stampDaysAgo(1)}.jsonl`));
  const shell = spawnSync('bash', ['-c', `. "${storageShell}"; lumina_log_file "$1"; lumina_log_files "$1"`, 'sh', logDirectory], { encoding: 'utf8' });
  assert.equal(shell.status, 0, shell.stderr);
  const [created, ...listed] = shell.stdout.trim().split('\n');
  assert.equal(created, todayLogFile(project));
  assert.deepEqual(listed, datedLogFiles(project));
  assert.equal(listed.length, 2);
});

test('creating the first log of a day prunes dated logs and legacy files older than the keep window', context => {
  const project = root(context);
  const logDirectory = path.join(project, '.agents/storage/logs');
  touch(path.join(logDirectory, `logs-${stampDaysAgo(10)}.jsonl`));
  touch(path.join(logDirectory, `logs-${stampDaysAgo(7)}.jsonl`));
  touch(path.join(logDirectory, `logs-${stampDaysAgo(6)}.jsonl`));
  touch(path.join(logDirectory, 'logs.jsonl'), 9);
  touch(path.join(logDirectory, 'logs-20260101-000000.jsonl'), 30);
  touch(path.join(logDirectory, 'logs-20261101-000000-2.jsonl'), 2);
  touch(path.join(logDirectory, 'notes.txt'), 30);

  audit(project);

  const remaining = fs.readdirSync(logDirectory).sort();
  assert.deepEqual(remaining, [
    'logs-20261101-000000-2.jsonl',
    `logs-${stampDaysAgo(0)}.jsonl`,
    `logs-${stampDaysAgo(6)}.jsonl`,
    'notes.txt',
  ].sort());
});

test('LUMINA_STORAGE_KEEP_DAYS overrides the window and invalid values fall back to 7', context => {
  const project = root(context);
  const logDirectory = path.join(project, '.agents/storage/logs');
  for (const age of [0, 1, 2, 3]) touch(path.join(logDirectory, `logs-${stampDaysAgo(age)}.jsonl`));
  withKeepDays(2, () => pruneStorage(project));
  assert.deepEqual(datedLogFiles(project).map(file => path.basename(file)), [`logs-${stampDaysAgo(1)}.jsonl`, `logs-${stampDaysAgo(0)}.jsonl`]);

  touch(path.join(logDirectory, `logs-${stampDaysAgo(8)}.jsonl`));
  touch(path.join(logDirectory, `logs-${stampDaysAgo(6)}.jsonl`));
  withKeepDays('abc', () => pruneStorage(project));
  assert.equal(datedLogFiles(project).some(file => file.includes(stampDaysAgo(8))), false);
  assert.equal(datedLogFiles(project).some(file => file.includes(stampDaysAgo(6))), true);
});

test('session state lives in one state-YYYYMMDD.json keyed by session, with no per-session files', context => {
  const project = root(context);
  setSessionValue(project, 'session-a', 'turn', { turnStartLine: 3, turnStartUuid: 'u' });
  setSessionValue(project, 'session-a', 'emitted', { total: 5 });
  setSessionValue(project, 'session-b', 'usageMarker', { lastLine: 9 });
  assert.equal(pushSessionValues(project, 'session-a', 'cleanupReminded', ['a.tmp', 'b.tmp', 'a.tmp']), 2);
  assert.equal(pushSessionValues(project, 'session-a', 'cleanupReminded', ['b.tmp', 'c.tmp']), 1);

  const stateDirectory = path.join(project, '.agents/storage/state');
  assert.deepEqual(fs.readdirSync(stateDirectory), [`state-${stampDaysAgo(0)}.json`]);
  const stored = JSON.parse(fs.readFileSync(path.join(stateDirectory, `state-${stampDaysAgo(0)}.json`), 'utf8'));
  assert.deepEqual(stored['session-a'], { turn: { turnStartLine: 3, turnStartUuid: 'u' }, emitted: { total: 5 }, cleanupReminded: ['a.tmp', 'b.tmp', 'c.tmp'] });
  assert.deepEqual(stored['session-b'], { usageMarker: { lastLine: 9 } });
  assert.equal(getSessionValue(project, 'session-a', 'missing'), undefined);
  assert.equal(getSessionValue(project, 'unknown', 'turn'), undefined);
});

test('a session that crosses midnight still reads and carries its state from the previous day', context => {
  const project = root(context);
  const stateDirectory = path.join(project, '.agents/storage/state');
  fs.mkdirSync(stateDirectory, { recursive: true });
  const yesterday = path.join(stateDirectory, `state-${stampDaysAgo(1)}.json`);
  fs.writeFileSync(yesterday, `${JSON.stringify({ 'session-a': { turn: { turnStartLine: 1 }, usageMarker: { lastLine: 4 } } })}\n`);

  assert.deepEqual(getSessionValue(project, 'session-a', 'usageMarker'), { lastLine: 4 });
  setSessionValue(project, 'session-a', 'emitted', { total: 1 });

  const today = JSON.parse(fs.readFileSync(path.join(stateDirectory, `state-${stampDaysAgo(0)}.json`), 'utf8'));
  assert.deepEqual(today['session-a'], { turn: { turnStartLine: 1 }, usageMarker: { lastLine: 4 }, emitted: { total: 1 } });
  assert.deepEqual(Object.keys(readSessionState(project, 'session-a')).sort(), ['emitted', 'turn', 'usageMarker']);
});

test('creating the first state file of a day prunes old state files and legacy per-session files', context => {
  const project = root(context);
  const stateDirectory = path.join(project, '.agents/storage/state');
  touch(path.join(stateDirectory, `state-${stampDaysAgo(9)}.json`));
  touch(path.join(stateDirectory, `state-${stampDaysAgo(2)}.json`));
  for (const name of ['s1.turn.json', 's1.emitted.json', 's1.json', 's1.cleanup-reminded', 's1.checked', 'report-reminder-s1']) {
    touch(path.join(stateDirectory, name), 12);
  }
  touch(path.join(stateDirectory, 'fresh.turn.json'), 1);
  touch(path.join(stateDirectory, 'keep.txt'), 30);

  setSessionValue(project, 'session-a', 'turn', {});

  assert.deepEqual(fs.readdirSync(stateDirectory).sort(), [
    'fresh.turn.json', 'keep.txt', `state-${stampDaysAgo(0)}.json`, `state-${stampDaysAgo(2)}.json`,
  ].sort());
});

test('concurrent writers from many processes never lose a key or corrupt the state file', async context => {
  const project = root(context);
  const writers = 12;
  const run = index => new Promise((resolve, reject) => {
    const child = spawn('node', [storageModule, 'state-set', project, `session-${index % 3}`, `key-${index}`], { stdio: ['pipe', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', code => (code === 0 && stderr === '' ? resolve() : reject(new Error(`writer ${index} failed: ${stderr}`))));
    child.stdin.end(JSON.stringify({ index }));
  });
  await Promise.all(Array.from({ length: writers }, (_, index) => run(index)));

  const stateDirectory = path.join(project, '.agents/storage/state');
  assert.deepEqual(fs.readdirSync(stateDirectory), [`state-${stampDaysAgo(0)}.json`]);
  for (let index = 0; index < writers; index += 1) {
    assert.deepEqual(getSessionValue(project, `session-${index % 3}`, `key-${index}`), { index });
  }
});

test('bash wrappers store, read and de-duplicate state through the shared node helper', context => {
  const project = root(context);
  const script = `
    . "${storageShell}"
    lumina_state_set "$1" s1 usageMarker '{"lastLine":7}'
    lumina_state_get "$1" s1 usageMarker
    printf 'a\\nb\\n' | lumina_state_push "$1" s1 cleanupReminded
    printf 'b\\nc\\n' | lumina_state_push "$1" s1 cleanupReminded
    lumina_state_get "$1" s1 cleanupReminded
    lumina_state_get "$1" s1 nothing
  `;
  const result = spawnSync('bash', ['-c', script, 'sh', project], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '{"lastLine":7}\n["a","b","c"]\n');
});

test('a corrupt state file is treated as empty instead of failing the hook', context => {
  const project = root(context);
  const stateDirectory = path.join(project, '.agents/storage/state');
  fs.mkdirSync(stateDirectory, { recursive: true });
  fs.writeFileSync(path.join(stateDirectory, `state-${stampDaysAgo(0)}.json`), '{not json');
  assert.equal(getSessionValue(project, 's1', 'turn'), undefined);
  setSessionValue(project, 's1', 'turn', { ok: true });
  assert.deepEqual(getSessionValue(project, 's1', 'turn'), { ok: true });
});
