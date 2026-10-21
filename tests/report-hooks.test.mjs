import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const usageHook = fileURLToPath(new URL('../.claude/hooks/scripts/report-usage.sh', import.meta.url));
const reminderHook = fileURLToPath(new URL('../.claude/hooks/scripts/report-reminder.sh', import.meta.url));

function repository(context) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'report-hooks-test-')));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  spawnSync('git', ['init', '-q'], { cwd: root });
  return root;
}

function writeTranscript(root, messageCount) {
  const file = path.join(root, 'transcript.jsonl');
  const lines = Array.from({ length: messageCount }, (_, index) => JSON.stringify({
    type: 'assistant',
    message: { id: `m${index}`, usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 100, cache_creation_input_tokens: 7 }, content: [] },
  }));
  fs.writeFileSync(file, `${lines.join('\n')}\n`);
  return file;
}

function runHook(script, root, payload) {
  const environment = { ...process.env };
  delete environment.CLAUDE_PROJECT_DIR;
  return spawnSync('bash', [script], { cwd: root, input: JSON.stringify(payload), encoding: 'utf8', env: environment });
}

function skillPayload(skill, transcript, sessionId = 'session-1', toolName = 'Skill') {
  return { session_id: sessionId, transcript_path: transcript, tool_name: toolName, tool_input: { skill } };
}

test('report-usage stays silent for other tools and skills including workflow-report', context => {
  const root = repository(context);
  const transcript = writeTranscript(root, 2);
  for (const payload of [
    skillPayload('report', transcript, 'session-1', 'Edit'),
    skillPayload('workflow-report', transcript),
    skillPayload('docs', transcript),
  ]) {
    const result = runHook(usageHook, root, payload);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, '');
  }
  assert.equal(fs.existsSync(path.join(root, '.agents/storage/state')), false);
});

test('report-usage stays silent without transcript or session and exits 0', context => {
  const root = repository(context);
  assert.equal(runHook(usageHook, root, skillPayload('report', path.join(root, 'missing.jsonl'))).stdout, '');
  assert.equal(runHook(usageHook, root, skillPayload('report', '')).stdout, '');
  const result = runHook(usageHook, root, { tool_name: 'Skill', tool_input: { skill: 'report' } });
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
  assert.equal(runHook(usageHook, root, { broken: true }).status, 0);
});

test('report-usage emits the token and waste lines and windows by marker', context => {
  const root = repository(context);
  const transcript = writeTranscript(root, 2);

  const first = runHook(usageHook, root, skillPayload('report', transcript));
  assert.equal(first.status, 0);
  const firstOutput = JSON.parse(first.stdout).hookSpecificOutput;
  assert.equal(firstOutput.hookEventName, 'PostToolUse');
  const firstLines = firstOutput.additionalContext.split('\n');
  assert.equal(firstLines.length, 3);
  assert.equal(firstLines[0], '📈 Token (cả phiên, nguồn transcript): input 20 | output 10 | cache đọc 200 | cache tạo 14.');
  assert.equal(firstLines[1], 'Issue lãng phí: Không phát hiện.');
  assert.match(firstLines[2], /Token: và Issue lãng phí:/);
  const marker = path.join(root, '.agents/storage/state/session-1.json');
  assert.deepEqual(JSON.parse(fs.readFileSync(marker, 'utf8')), { lastLine: 2 });

  fs.appendFileSync(transcript, `${JSON.stringify({ type: 'assistant', message: { id: 'm9', usage: { input_tokens: 1, output_tokens: 2 }, content: [] } })}\n`);
  const second = runHook(usageHook, root, skillPayload('plugin:report', transcript));
  assert.equal(second.status, 0);
  const secondLines = JSON.parse(second.stdout).hookSpecificOutput.additionalContext.split('\n');
  assert.equal(secondLines[0], '📈 Token (từ mốc báo cáo trước, nguồn transcript): input 1 | output 2 | cache đọc 0 | cache tạo 0.');
  assert.deepEqual(JSON.parse(fs.readFileSync(marker, 'utf8')), { lastLine: 3 });

  const third = runHook(usageHook, root, skillPayload('report', transcript));
  assert.equal(third.status, 0);
  assert.equal(third.stdout, '');
});

test('report-reminder no longer prints token lines or touches the usage marker', context => {
  const root = repository(context);
  const transcript = writeTranscript(root, 2);
  const logDirectory = path.join(root, '.agents/storage/logs');
  fs.mkdirSync(logDirectory, { recursive: true });
  const entry = { ts: '2026-01-01T00:00:00Z', session_id: 'session-1', tool: 'Edit', cwd: root, input: { file_path: 'a.txt' } };
  fs.writeFileSync(path.join(logDirectory, 'logs.jsonl'), `${JSON.stringify(entry)}\n`);

  const payload = { session_id: 'session-1', transcript_path: transcript };
  const first = runHook(reminderHook, root, payload);
  assert.equal(first.status, 0);
  const message = JSON.parse(first.stdout).hookSpecificOutput;
  assert.equal(message.hookEventName, 'Stop');
  assert.match(message.additionalContext, /skill `report`/);
  assert.doesNotMatch(message.additionalContext, /📈|Issue lãng phí:/);
  assert.equal(fs.existsSync(path.join(root, '.agents/storage/state/session-1.json')), false);

  const again = runHook(reminderHook, root, payload);
  assert.equal(again.status, 0);
  assert.equal(again.stdout, '');
});
