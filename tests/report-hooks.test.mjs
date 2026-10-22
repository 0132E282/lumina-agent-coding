import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const usageHook = fileURLToPath(new URL('../.claude/hooks/scripts/report-usage.sh', import.meta.url));
const reminderHook = fileURLToPath(new URL('../.claude/hooks/scripts/report-reminder.sh', import.meta.url));
const auditHook = fileURLToPath(new URL('../.claude/hooks/scripts/audit-log.sh', import.meta.url));

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
  assert.equal(firstLines.length, 2);
  assert.equal(firstLines[0], '📈 Token: input 20 | output 10 | cache đọc 200 | cache tạo 14 | tổng 244 (cả phiên).');
  assert.doesNotMatch(firstOutput.additionalContext, /Không phát hiện/);
  assert.match(firstLines[1], /dòng Token: theo template change \(và dòng Issue lãng phí: chỉ khi hook liệt kê vi phạm\)/);
  const marker = path.join(root, '.agents/storage/state/session-1.json');
  assert.deepEqual(JSON.parse(fs.readFileSync(marker, 'utf8')), { lastLine: 2 });

  fs.appendFileSync(transcript, `${JSON.stringify({ type: 'assistant', message: { id: 'm9', usage: { input_tokens: 1, output_tokens: 2 }, content: [] } })}\n`);
  const second = runHook(usageHook, root, skillPayload('plugin:report', transcript));
  assert.equal(second.status, 0);
  const secondLines = JSON.parse(second.stdout).hookSpecificOutput.additionalContext.split('\n');
  assert.equal(secondLines[0], '📈 Token: input 1 | output 2 | cache đọc 0 | cache tạo 0 | tổng 3 (từ mốc trước).');
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

test('report-usage prints compact numbers but stores raw numbers', context => {
  const root = repository(context);
  const file = path.join(root, 'transcript.jsonl');
  const usage = { input_tokens: 18, output_tokens: 4448, cache_read_input_tokens: 912046, cache_creation_input_tokens: 13421 };
  fs.writeFileSync(file, `${JSON.stringify({ type: 'assistant', message: { id: 'm0', usage, content: [] } })}\n`);
  const result = runHook(usageHook, root, skillPayload('report', file));
  assert.equal(result.status, 0);
  const lines = JSON.parse(result.stdout).hookSpecificOutput.additionalContext.split('\n');
  assert.equal(lines[0], '📈 Token: input 18 | output 4.4k | cache đọc 912k | cache tạo 13.4k | tổng 930k (cả phiên).');
  assert.doesNotMatch(lines.join('\n'), /nguồn transcript/);
  const emitted = JSON.parse(fs.readFileSync(path.join(root, '.agents/storage/state/session-1.emitted.json'), 'utf8'));
  assert.deepEqual([emitted.input, emitted.output, emitted.cacheRead, emitted.cacheCreate, emitted.total], [18, 4448, 912046, 13421, 929933]);
});

test('report-reminder ignores Edit/Write made by subagents (audit-log records agent_id)', context => {
  const root = repository(context);
  const transcript = writeTranscript(root, 1);
  const editPayload = (filePath, extra = {}) => ({
    session_id: 'session-1', cwd: root, tool_name: 'Edit', tool_input: { file_path: filePath }, ...extra,
  });

  const subagentAudit = runHook(auditHook, root, editPayload('subagent.txt', { agent_id: 'agent-abc', agent_type: 'coder' }));
  assert.equal(subagentAudit.status, 0);
  const logFile = path.join(root, '.agents/storage/logs/logs.jsonl');
  const [subagentEntry] = fs.readFileSync(logFile, 'utf8').trim().split('\n').map(line => JSON.parse(line));
  assert.equal(subagentEntry.agent_id, 'agent-abc');

  const payload = { session_id: 'session-1', transcript_path: transcript };
  const onlySubagent = runHook(reminderHook, root, payload);
  assert.equal(onlySubagent.status, 0);
  assert.equal(onlySubagent.stdout, '');

  const mainAudit = runHook(auditHook, root, editPayload('main.txt'));
  assert.equal(mainAudit.status, 0);
  const mainEntry = JSON.parse(fs.readFileSync(logFile, 'utf8').trim().split('\n')[1]);
  assert.equal('agent_id' in mainEntry, false);

  const withMain = runHook(reminderHook, root, payload);
  assert.equal(withMain.status, 0);
  const message = JSON.parse(withMain.stdout).hookSpecificOutput.additionalContext;
  assert.match(message, /Edit\/Write 1 lần \(main\.txt\)/);
  assert.doesNotMatch(message, /subagent\.txt/);
});

test('report-usage keeps the Issue lãng phí line when waste is detected', context => {
  const root = repository(context);
  const file = path.join(root, 'transcript.jsonl');
  const usage = { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0, cache_creation_input_tokens: 60000 };
  fs.writeFileSync(file, `${JSON.stringify({ type: 'assistant', message: { id: 'm0', usage, content: [] } })}\n`);
  const result = runHook(usageHook, root, skillPayload('report', file));
  assert.equal(result.status, 0);
  const lines = JSON.parse(result.stdout).hookSpecificOutput.additionalContext.split('\n');
  assert.equal(lines.length, 3);
  assert.match(lines[0], /^📈 Token: /);
  assert.equal(lines[1], 'Issue lãng phí: 1 — cacheCreateOverRead: cache tạo 60000 > cache đọc 0 (×1)');
  assert.match(lines[2], /dòng Issue lãng phí: chỉ khi hook liệt kê vi phạm/);
});
