import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const checkHook = fileURLToPath(new URL('../.claude/hooks/scripts/report-usage-check.sh', import.meta.url));
const usageHook = fileURLToPath(new URL('../.claude/hooks/scripts/report-usage.sh', import.meta.url));

const EMITTED = { input: 1234567, output: 89, cacheRead: 4500, cacheCreate: 12, ts: '2026-01-01T00:00:00Z' };

function repository(context) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'report-usage-check-test-')));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  spawnSync('git', ['init', '-q'], { cwd: root });
  return root;
}

function writeEmitted(root, sessionId = 'session-1', emitted = EMITTED) {
  const directory = path.join(root, '.agents/storage/state');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, `${sessionId}.emitted.json`), JSON.stringify(emitted));
}

function runHook(script, root, payload) {
  const environment = { ...process.env };
  delete environment.CLAUDE_PROJECT_DIR;
  return spawnSync('bash', [script], { cwd: root, input: JSON.stringify(payload), encoding: 'utf8', env: environment });
}

function stopPayload(message, extra = {}) {
  return { session_id: 'session-1', stop_hook_active: false, last_assistant_message: message, ...extra };
}

const exactLine = 'Token: input 1234567 | output 89 | cache đọc 4500 | cache tạo 12';

test('matching Token line stays silent', context => {
  const root = repository(context);
  writeEmitted(root);
  const result = runHook(checkHook, root, stopPayload(`Xong.\n${exactLine}\nIssue lãng phí: Không phát hiện.`));
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
});

test('dotted, comma and bold Token line equal to emitted stays silent', context => {
  const root = repository(context);
  writeEmitted(root);
  for (const line of [
    '**Token**: input 1.234.567 | output 89 | cache đọc 4.500 | cache tạo 12',
    'Token: input 1,234,567 | output 89 | cache đọc 4,500 | cache tạo 12',
    'Token: input 1 234 567 | output 89 | cache đọc 4 500 | cache tạo 12',
  ]) {
    const result = runHook(checkHook, root, stopPayload(line));
    assert.equal(result.status, 0);
    assert.equal(result.stdout, '');
  }
});

test('mismatching numbers warn with both sets of numbers', context => {
  const root = repository(context);
  writeEmitted(root);
  const result = runHook(checkHook, root, stopPayload('Token: input 999 | output 89 | cache đọc 4500 | cache tạo 12'));
  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout).hookSpecificOutput;
  assert.equal(output.hookEventName, 'Stop');
  assert.match(output.additionalContext, /không khớp số hook đã chèn/);
  assert.match(output.additionalContext, /báo cáo: input 999 \| output 89/);
  assert.match(output.additionalContext, /hook: input 1234567 \| output 89 \| cache đọc 4500 \| cache tạo 12/);
  assert.match(output.additionalContext, /Sửa lại bằng đúng số hook: input 1234567/);
});

test('Token line without emitted record asks to call the report skill again', context => {
  const root = repository(context);
  const result = runHook(checkHook, root, stopPayload(exactLine));
  assert.equal(result.status, 0);
  assert.match(JSON.parse(result.stdout).hookSpecificOutput.additionalContext, /gọi lại skill report/);
});

test('no Token line stays silent', context => {
  const root = repository(context);
  writeEmitted(root);
  const result = runHook(checkHook, root, stopPayload('Xong, không có số liệu.'));
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
});

test('stop_hook_active true stays silent', context => {
  const root = repository(context);
  const result = runHook(checkHook, root, stopPayload('Token: input 1 | output 2 | cache đọc 3 | cache tạo 4', { stop_hook_active: true }));
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
});

test('identical mismatch warns only once', context => {
  const root = repository(context);
  writeEmitted(root);
  const payload = stopPayload('Token: input 1 | output 2 | cache đọc 3 | cache tạo 4');
  assert.notEqual(runHook(checkHook, root, payload).stdout, '');
  const again = runHook(checkHook, root, payload);
  assert.equal(again.status, 0);
  assert.equal(again.stdout, '');
  const different = runHook(checkHook, root, stopPayload('Token: input 5 | output 2 | cache đọc 3 | cache tạo 4'));
  assert.notEqual(different.stdout, '');
});

test('falls back to the transcript when the payload has no final message', context => {
  const root = repository(context);
  writeEmitted(root);
  const transcript = path.join(root, 'transcript.jsonl');
  const entry = { type: 'assistant', message: { content: [{ type: 'text', text: 'Token: input 1 | output 2 | cache đọc 3 | cache tạo 4' }] } };
  fs.writeFileSync(transcript, `${JSON.stringify(entry)}\n`);
  const result = runHook(checkHook, root, { session_id: 'session-1', transcript_path: transcript });
  assert.match(JSON.parse(result.stdout).hookSpecificOutput.additionalContext, /không khớp/);
});

test('broken payload exits 0 silently', context => {
  const root = repository(context);
  const result = spawnSync('bash', [checkHook], { cwd: root, input: 'not json', encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
});

test('report-usage writes the emitted numbers file', context => {
  const root = repository(context);
  const transcript = path.join(root, 'transcript.jsonl');
  const lines = Array.from({ length: 2 }, (_, index) => JSON.stringify({
    type: 'assistant',
    message: { id: `m${index}`, usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 100, cache_creation_input_tokens: 7 }, content: [] },
  }));
  fs.writeFileSync(transcript, `${lines.join('\n')}\n`);
  const result = runHook(usageHook, root, { session_id: 'session-1', transcript_path: transcript, tool_name: 'Skill', tool_input: { skill: 'report' } });
  assert.equal(result.status, 0);
  const emitted = JSON.parse(fs.readFileSync(path.join(root, '.agents/storage/state/session-1.emitted.json'), 'utf8'));
  assert.deepEqual({ ...emitted, ts: undefined }, { input: 20, output: 10, cacheRead: 200, cacheCreate: 14, ts: undefined });
  assert.match(emitted.ts, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

  const check = runHook(checkHook, root, stopPayload('Token: input 20 | output 10 | cache đọc 200 | cache tạo 14'));
  assert.equal(check.stdout, '');
});
