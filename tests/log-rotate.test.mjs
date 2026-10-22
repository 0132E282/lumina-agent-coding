import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const auditHook = path.join(repoRoot, '.claude/hooks/scripts/audit-log.sh');
const auditHookViaSymlink = path.join(repoRoot, '.agents/hooks/scripts/audit-log.sh');
const turnHook = path.join(repoRoot, '.claude/hooks/scripts/turn-log.sh');
const reminderHook = path.join(repoRoot, '.claude/hooks/scripts/report-reminder.sh');
const finder = path.join(repoRoot, '.agents/skills/cleanup-temp-files/scripts/find-session-scratch-files.sh');
const rotatedName = /^logs-\d{8}-\d{6}(-\d+)?\.jsonl$/;

function workspace(context) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'log-rotate-test-')));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, '.agents/storage/logs'), { recursive: true });
  return root;
}

const logDirectory = root => path.join(root, '.agents/storage/logs');
const activeLog = root => path.join(logDirectory(root), 'logs.jsonl');
const rotatedFiles = root => fs.readdirSync(logDirectory(root)).filter(name => rotatedName.test(name)).sort();

function environmentFor(root, extra = {}) {
  return { ...process.env, CLAUDE_PROJECT_DIR: root, ...extra };
}

function audit(root, payload, { extra = {}, script = auditHook } = {}) {
  const result = spawnSync('bash', [script], { cwd: root, input: JSON.stringify(payload), encoding: 'utf8', env: environmentFor(root, extra) });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
}

function readLines(file) {
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
}

function allLines(root) {
  return [...rotatedFiles(root), 'logs.jsonl']
    .map(name => path.join(logDirectory(root), name))
    .filter(file => fs.existsSync(file))
    .flatMap(readLines);
}

const readPayload = (root, index) => ({ session_id: 's-1', cwd: root, tool_name: 'Read', tool_input: { file_path: `/f/${index}.txt` } });

test('audit-log rotates exactly once at the threshold and appends the new line to a fresh active file', context => {
  const root = workspace(context);
  audit(root, readPayload(root, 0));
  const lineBytes = fs.statSync(activeLog(root)).size;
  const extra = { LUMINA_LOG_MAX_BYTES: String(lineBytes * 3) };

  audit(root, readPayload(root, 1), { extra });
  audit(root, readPayload(root, 2), { extra });
  assert.deepEqual(rotatedFiles(root), []);
  assert.equal(readLines(activeLog(root)).length, 3);

  audit(root, readPayload(root, 3), { extra });
  const rotated = rotatedFiles(root);
  assert.equal(rotated.length, 1);
  assert.match(rotated[0], rotatedName);
  assert.deepEqual(readLines(path.join(logDirectory(root), rotated[0])).map(line => JSON.parse(line).input.file_path), ['/f/0.txt', '/f/1.txt', '/f/2.txt']);
  assert.deepEqual(readLines(activeLog(root)).map(line => JSON.parse(line).input.file_path), ['/f/3.txt']);

  audit(root, readPayload(root, 4), { extra });
  assert.equal(rotatedFiles(root).length, 1);
  assert.equal(readLines(activeLog(root)).length, 2);
});

test('audit-log stays below the default 1 MiB threshold without rotating', context => {
  const root = workspace(context);
  for (let index = 0; index < 3; index += 1) audit(root, readPayload(root, index));
  assert.deepEqual(rotatedFiles(root), []);
});

test('retention keeps the newest N rotated files and never touches unrelated files', context => {
  const root = workspace(context);
  const directory = logDirectory(root);
  const oldRotated = ['logs-20200101-000000.jsonl', 'logs-20200101-000000-2.jsonl', 'logs-20200101-000000-10.jsonl', 'logs-20200102-000000.jsonl'];
  const unrelated = ['logs-old.jsonl', 'logs-2020.jsonl', 'notes.txt', 'logs-20200101-000000.jsonl.bak', 'other-20200101-000000.jsonl'];
  for (const name of [...oldRotated, ...unrelated]) fs.writeFileSync(path.join(directory, name), '{}\n');
  fs.writeFileSync(activeLog(root), `${'x'.repeat(50)}\n`);

  audit(root, readPayload(root, 0), { extra: { LUMINA_LOG_MAX_BYTES: '10', LUMINA_LOG_KEEP: '3' } });

  const remaining = rotatedFiles(root);
  assert.equal(remaining.length, 3);
  // Cùng giây: không hậu tố < -2 < -10 (so số, không so chuỗi); bản vừa xoay là mới nhất.
  assert.deepEqual(remaining.filter(name => name.startsWith('logs-2020')).sort(), ['logs-20200101-000000-10.jsonl', 'logs-20200102-000000.jsonl']);
  assert.equal(remaining[2].startsWith('logs-2020'), false);
  for (const name of unrelated) assert.equal(fs.existsSync(path.join(directory, name)), true, name);
  assert.equal(readLines(activeLog(root)).length, 1);
});

test('rotation works through the .agents/hooks/scripts symlink path', context => {
  const root = workspace(context);
  fs.writeFileSync(activeLog(root), `${'x'.repeat(50)}\n`);
  audit(root, readPayload(root, 0), { extra: { LUMINA_LOG_MAX_BYTES: '10' }, script: auditHookViaSymlink });
  assert.equal(rotatedFiles(root).length, 1);
  assert.equal(readLines(activeLog(root)).length, 1);
});

test('turn-log rotates through the shared helper before appending its line', context => {
  const root = workspace(context);
  fs.writeFileSync(activeLog(root), `${'x'.repeat(50)}\n`);
  const transcript = path.join(root, 'transcript.jsonl');
  const events = [
    { type: 'user', uuid: 'p1', origin: { kind: 'human' }, message: { role: 'user', content: 'Xoay log' } },
    { type: 'assistant', message: { id: 'm1', usage: { input_tokens: 1, output_tokens: 1 }, content: [] } },
  ];
  fs.writeFileSync(transcript, `${events.map(event => JSON.stringify(event)).join('\n')}\n`);
  const result = spawnSync('bash', [turnHook], {
    cwd: root,
    input: JSON.stringify({ session_id: 's-1', transcript_path: transcript, cwd: root }),
    encoding: 'utf8',
    env: environmentFor(root, { LUMINA_LOG_MAX_BYTES: '10' }),
  });
  assert.equal(result.status, 0, result.stderr);
  const rotated = rotatedFiles(root);
  assert.equal(rotated.length, 1);
  assert.equal(fs.readFileSync(path.join(logDirectory(root), rotated[0]), 'utf8'), `${'x'.repeat(50)}\n`);
  const [line] = readLines(activeLog(root)).map(text => JSON.parse(text));
  assert.equal(line.type, 'turn');
});

test('turn-log leaves the log in place below the threshold or with an invalid threshold', context => {
  const root = workspace(context);
  fs.writeFileSync(activeLog(root), `${'x'.repeat(50)}\n`);
  const transcript = path.join(root, 'transcript.jsonl');
  for (const [index, threshold] of ['1000', 'abc', '0'].entries()) {
    // Mỗi lượt một prompt mới để turn-log không bỏ qua lượt đã ghi.
    const events = [
      { type: 'user', uuid: `p${index}`, origin: { kind: 'human' }, message: { role: 'user', content: `Không xoay ${index}` } },
      { type: 'assistant', message: { id: `m${index}`, usage: { input_tokens: 1, output_tokens: 1 }, content: [] } },
    ];
    fs.writeFileSync(transcript, `${events.map(event => JSON.stringify(event)).join('\n')}\n`);
    const result = spawnSync('bash', [turnHook], {
      cwd: root,
      input: JSON.stringify({ session_id: 's-1', transcript_path: transcript, cwd: root }),
      encoding: 'utf8',
      env: environmentFor(root, { LUMINA_LOG_MAX_BYTES: threshold }),
    });
    assert.equal(result.status, 0, result.stderr);
  }
  assert.deepEqual(rotatedFiles(root), []);
  assert.equal(readLines(activeLog(root)).length, 4);
});

const sessionLogLines = (root, sessionId) => spawnSync('bash', ['-c', '. "$1" && lumina_session_log_lines "$2" "$3"', 'test', path.join(repoRoot, '.claude/hooks/scripts/_log-rotate.sh'), logDirectory(root), sessionId], { encoding: 'utf8' });

test('lumina_session_log_lines prints session lines from the newest rotated file and the active file', context => {
  const root = workspace(context);
  const line = (sessionId, marker) => JSON.stringify({ session_id: sessionId, marker });
  writeLog(path.join(logDirectory(root), 'logs-20260101-000000.jsonl'), [line('session-1', 'oldest')]);
  writeLog(path.join(logDirectory(root), 'logs-20260101-000010.jsonl'), [line('session-1', 'rotated'), line('session-2', 'other')]);
  writeLog(activeLog(root), [line('session-2', 'other'), line('session-1', 'active')]);

  const result = sessionLogLines(root, 'session-1');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.stdout.split('\n').filter(Boolean).map(text => JSON.parse(text).marker), ['rotated', 'active']);

  const none = sessionLogLines(root, 'session-none');
  assert.equal(none.status, 0);
  assert.equal(none.stdout, '');
});

test('lumina_session_log_lines prints nothing when there are no log files', context => {
  const root = workspace(context);
  const result = sessionLogLines(root, 'session-1');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
});

test('parallel audit-log calls near the threshold keep every line as valid JSON', async context => {
  const root = workspace(context);
  audit(root, readPayload(root, 0));
  const lineBytes = fs.statSync(activeLog(root)).size;
  const extra = { LUMINA_LOG_MAX_BYTES: String(lineBytes * 4), LUMINA_LOG_KEEP: '100' };
  const total = 40;

  const runOne = index => new Promise((resolve, reject) => {
    const child = spawn('bash', [auditHook], { cwd: root, env: environmentFor(root, extra), stdio: ['pipe', 'ignore', 'ignore'] });
    child.on('error', reject);
    child.on('close', code => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
    child.stdin.end(JSON.stringify(readPayload(root, index)));
  });
  await Promise.all(Array.from({ length: total - 1 }, (_, index) => runOne(index + 1)));

  const lines = allLines(root);
  assert.equal(lines.length, total);
  const paths = lines.map(line => JSON.parse(line).input.file_path);
  assert.equal(new Set(paths).size, total);
  assert.ok(rotatedFiles(root).length >= 1);
});

function runReminder(root, sessionId = 'session-1') {
  const environment = { ...process.env };
  delete environment.CLAUDE_PROJECT_DIR;
  return spawnSync('bash', [reminderHook], { cwd: root, input: JSON.stringify({ session_id: sessionId }), encoding: 'utf8', env: environment });
}

const entry = (root, ts, tool, input, extra = {}) => JSON.stringify({ ts, session_id: 'session-1', tool, cwd: root, input, ...extra });
const writeLog = (file, lines) => fs.writeFileSync(file, `${lines.join('\n')}\n`);

test('report-reminder output is unchanged for a fixture without rotation', context => {
  const root = workspace(context);
  writeLog(activeLog(root), [
    entry(root, '2026-01-01T00:00:01Z', 'Edit', { file_path: 'old.txt' }),
    entry(root, '2026-01-01T00:00:02Z', 'Skill', { skill: 'report' }),
    entry(root, '2026-01-01T00:00:03Z', 'Write', { file_path: 'b.txt' }),
    entry(root, '2026-01-01T00:00:04Z', 'Edit', { file_path: 'a.txt' }),
    entry(root, '2026-01-01T00:00:05Z', 'Edit', { file_path: 'a.txt' }),
  ]);
  const result = runReminder(root);
  assert.equal(result.status, 0);
  assert.equal(
    JSON.parse(result.stdout).hookSpecificOutput.additionalContext,
    '📊 Đã Edit/Write 3 lần (a.txt, b.txt) mà chưa thấy gọi skill `report` để xuất báo cáo thay đổi — rules/delivery.md yêu cầu bắt buộc. Dùng Skill tool với `report` trước khi báo hoàn thành task; số token sẽ được cung cấp tự động khi gọi skill.',
  );
});

test('report-reminder reads the newest rotated file when the session spans a rotation', context => {
  const root = workspace(context);
  writeLog(path.join(logDirectory(root), 'logs-20260101-000000.jsonl'), [
    entry(root, '2025-12-31T23:59:00Z', 'Edit', { file_path: 'oldest-rotation.txt' }),
  ]);
  writeLog(path.join(logDirectory(root), 'logs-20260101-000010.jsonl'), [
    entry(root, '2026-01-01T00:00:01Z', 'Edit', { file_path: 'reported.txt' }),
    entry(root, '2026-01-01T00:00:02Z', 'Skill', { skill: 'report' }),
    entry(root, '2026-01-01T00:00:03Z', 'Edit', { file_path: 'pending-rotated.txt' }),
  ]);
  writeLog(activeLog(root), [
    entry(root, '2026-01-01T00:00:04Z', 'Read', { file_path: 'x.txt' }),
    JSON.stringify({ ts: '2026-01-01T00:00:05Z', session_id: 'session-2', tool: 'Edit', cwd: root, input: { file_path: 'other-session.txt' } }),
  ]);
  const result = runReminder(root);
  assert.equal(result.status, 0);
  const message = JSON.parse(result.stdout).hookSpecificOutput.additionalContext;
  assert.match(message, /Edit\/Write 1 lần \(pending-rotated\.txt\)/);
  assert.doesNotMatch(message, /reported\.txt|other-session\.txt|oldest-rotation\.txt/);
});

test('report-reminder respects a report call in the rotated file and works when only rotated files exist', context => {
  const root = workspace(context);
  writeLog(path.join(logDirectory(root), 'logs-20260101-000010.jsonl'), [
    entry(root, '2026-01-01T00:00:01Z', 'Edit', { file_path: 'reported.txt' }),
    entry(root, '2026-01-01T00:00:02Z', 'Skill', { skill: 'report' }),
  ]);
  assert.equal(runReminder(root).stdout, '');

  writeLog(activeLog(root), [entry(root, '2026-01-01T00:00:03Z', 'Write', { file_path: 'new.txt' })]);
  assert.match(JSON.parse(runReminder(root).stdout).hookSpecificOutput.additionalContext, /Edit\/Write 1 lần \(new\.txt\)/);
});

test('report-reminder stays correct on a large log dominated by other sessions', context => {
  const root = workspace(context);
  const noise = Array.from({ length: 20000 }, (_, index) => JSON.stringify({
    ts: '2026-01-01T00:00:09Z', session_id: `other-${index % 50}`, tool: 'Edit', cwd: root, input: { file_path: `noise-${index}.txt` },
  }));
  writeLog(activeLog(root), [
    ...noise.slice(0, 10000),
    entry(root, '2026-01-01T00:00:01Z', 'Skill', { skill: 'report' }),
    entry(root, '2026-01-01T00:00:02Z', 'Edit', { file_path: 'mine.txt' }),
    entry(root, '2026-01-01T00:00:03Z', 'Edit', { file_path: 'sub.txt' }, { agent_id: 'agent-1' }),
    ...noise.slice(10000),
  ]);
  const message = JSON.parse(runReminder(root).stdout).hookSpecificOutput.additionalContext;
  assert.match(message, /Edit\/Write 1 lần \(mine\.txt\)/);
  assert.equal(runReminder(root, 'session-none').stdout, '');
});

test('find-session-scratch-files still finds a candidate written before rotation', context => {
  const root = workspace(context);
  const scratch = path.join(root, 'tmp-before.md');
  const fresh = path.join(root, 'scratch-after.txt');
  for (const file of [scratch, fresh]) fs.writeFileSync(file, 'x');
  const write = filePath => JSON.stringify({ session_id: 'session-1', tool: 'Write', cwd: root, input: { file_path: filePath } });
  writeLog(path.join(logDirectory(root), 'logs-20260101-000010.jsonl'), [write(scratch)]);
  writeLog(activeLog(root), [write(fresh), JSON.stringify({ session_id: 'session-2', tool: 'Write', cwd: root, input: { file_path: path.join(root, 'tmp-other.md') } })]);
  fs.writeFileSync(path.join(root, 'tmp-other.md'), 'x');

  const environment = { ...process.env };
  delete environment.CLAUDE_PROJECT_DIR;
  const result = spawnSync('bash', [finder, 'session-1'], { cwd: root, encoding: 'utf8', env: environment });
  assert.equal(result.status, 0);
  assert.deepEqual(result.stdout.trim().split('\n').sort(), [fresh, scratch].sort());
});

test('without the rotation helper both readers still pre-filter by session and skip invalid lines of other sessions', context => {
  const root = workspace(context);
  // Copy script ra thư mục không có _log-rotate.sh để đi vào nhánh fallback.
  const scripts = path.join(root, 'no-helper');
  fs.mkdirSync(scripts);
  for (const source of [reminderHook, finder, path.join(repoRoot, '.claude/hooks/scripts/_dedupe-guard.sh')]) {
    fs.copyFileSync(source, path.join(scripts, path.basename(source)));
  }
  const scratch = path.join(root, 'tmp-fallback.md');
  fs.writeFileSync(scratch, 'x');
  writeLog(activeLog(root), [
    '{"session_id":"session-2","tool":"Edit", broken',
    entry(root, '2026-01-01T00:00:01Z', 'Write', { file_path: scratch }),
  ]);
  const environment = { ...process.env };
  delete environment.CLAUDE_PROJECT_DIR;

  const reminder = spawnSync('bash', [path.join(scripts, 'report-reminder.sh')], { cwd: root, input: JSON.stringify({ session_id: 'session-1' }), encoding: 'utf8', env: environment });
  assert.equal(reminder.status, 0, reminder.stderr);
  assert.match(JSON.parse(reminder.stdout).hookSpecificOutput.additionalContext, /Edit\/Write 1 lần \(.*tmp-fallback\.md\)/);

  const found = spawnSync('bash', [path.join(scripts, 'find-session-scratch-files.sh'), 'session-1'], { cwd: root, encoding: 'utf8', env: environment });
  assert.equal(found.status, 0, found.stderr);
  assert.equal(found.stdout, `${scratch}\n`);
});
