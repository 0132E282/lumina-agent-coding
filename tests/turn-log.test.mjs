import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { getSessionValue } from '../.claude/hooks/scripts/_hook-storage.mjs';

const logFileName = (() => {
  const now = new Date();
  return `logs-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.jsonl`;
})();

const turnHook = fileURLToPath(new URL('../.claude/hooks/scripts/turn-log.sh', import.meta.url));
const symlinkedTurnHook = fileURLToPath(new URL('../.agents/hooks/scripts/turn-log.sh', import.meta.url));
const sessionId = 'session-1';

function workspace(context) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'turn-log-test-')));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function usage(input, output, cacheRead, cacheCreate) {
  return { input_tokens: input, output_tokens: output, cache_read_input_tokens: cacheRead, cache_creation_input_tokens: cacheCreate };
}
function prompt(text, extra = {}) {
  return { type: 'user', uuid: `prompt-${text.length}-${text.slice(0, 8)}`, origin: { kind: 'human' }, message: { role: 'user', content: text }, ...extra };
}
function assistant(id, usageValue, blocks = []) {
  return { type: 'assistant', message: { id, usage: usageValue, content: blocks } };
}
function toolUse(id, name, input) {
  return { type: 'tool_use', id, name, input };
}
function toolResult(toolUseId, toolUseResult) {
  return { type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'ok' }] }, ...(toolUseResult ? { toolUseResult } : {}) };
}

function twoTurnTranscript(secondRequest = 'Fix Stop hook') {
  return [
    prompt('First turn'),
    assistant('m-old', usage(1000, 1000, 1000, 1000), [toolUse('old-bash', 'Bash', { command: 'ls' })]),
    toolResult('old-bash'),
    assistant('m-old-2', usage(5, 5, 5, 5), [{ type: 'text', text: 'xong' }]),
    prompt(secondRequest),
    { type: 'user', isMeta: true, message: { role: 'user', content: '<local-command-caveat>Not a prompt</local-command-caveat>' } },
    assistant('m1', usage(10, 20, 300, 40), [toolUse('t-bash-1', 'Bash', { command: 'npm test' })]),
    toolResult('t-bash-1'),
    // The same message id is rewritten with newer usage: only the last copy counts.
    assistant('m2', usage(1, 1, 1, 1), [toolUse('t-edit-1', 'Edit', { file_path: '/repo/a.js', old_string: 'secret-content', new_string: 'x' })]),
    assistant('m2', usage(2, 3, 50, 5), [toolUse('t-write-1', 'Write', { file_path: '/repo/b.js', content: 'SECRET FILE BODY' })]),
    toolResult('t-edit-1'),
    toolResult('t-write-1'),
    assistant('m3', usage(4, 6, 60, 0), [
      toolUse('t-edit-2', 'Edit', { file_path: '/repo/a.js', old_string: 'y', new_string: 'z' }),
      toolUse('t-agent-1', 'Agent', { description: 'Side work', prompt: 'x' }),
      toolUse('t-bash-2', 'Bash', { command: 'git status' }),
    ]),
    toolResult('t-edit-2'),
    toolResult('t-agent-1', { status: 'completed', agentId: 'agentsync1', totalTokens: 999999 }),
    toolResult('t-bash-2'),
    { type: 'user', origin: { kind: 'task-notification' }, message: { role: 'user', content: '<task-notification>\n<task-id>x</task-id>\n</task-notification>' } },
    assistant('m4', usage(1, 2, 3, 4), [{ type: 'text', text: 'Done' }]),
  ];
}

function writeTranscript(root, events, name = 'transcript.jsonl') {
  const file = path.join(root, name);
  fs.writeFileSync(file, `${events.map(event => JSON.stringify(event)).join('\n')}\n`);
  return file;
}

function writeSubagent(transcript, agentId, events, meta) {
  const directory = path.join(path.dirname(transcript), path.basename(transcript, '.jsonl'), 'subagents');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, `agent-${agentId}.jsonl`), `${events.map(event => JSON.stringify({ ...event, isSidechain: true, agentId })).join('\n')}\n`);
  if (meta) fs.writeFileSync(path.join(directory, `agent-${agentId}.meta.json`), JSON.stringify(meta));
}

function runHook(root, payload, script = turnHook) {
  const environment = { ...process.env, CLAUDE_PROJECT_DIR: root };
  return spawnSync('bash', [script], { cwd: root, input: JSON.stringify(payload), encoding: 'utf8', env: environment });
}

function logLines(root) {
  const file = path.join(root, `.agents/storage/logs/${logFileName}`);
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line));
}

function stopPayload(transcript, extra = {}) {
  return { session_id: sessionId, transcript_path: transcript, cwd: '/nonexistent', stop_hook_active: false, ...extra };
}

test('turn-log writes exactly one line for the last turn with request, tools, files and tokens', context => {
  const root = workspace(context);
  const transcript = writeTranscript(root, twoTurnTranscript());
  writeSubagent(transcript, 'agentsync1', [
    { type: 'user', message: { role: 'user', content: 'Side work' } },
    assistant('s1', usage(1, 2, 100, 10)),
    assistant('s1', usage(1, 5, 100, 10)),
    assistant('s2', usage(3, 4, 200, 0)),
  ]);

  const result = runHook(root, stopPayload(transcript));
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');

  const lines = logLines(root);
  assert.equal(lines.length, 1);
  const [line] = lines;
  assert.match(line.ts, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  assert.equal(line.type, 'turn');
  assert.equal(line.session_id, sessionId);
  assert.equal(line.request, 'Fix Stop hook');
  assert.deepEqual(line.tools, { Bash: 2, Edit: 2, Write: 1, Agent: 1 });
  assert.deepEqual(line.files, ['/repo/a.js', '/repo/b.js']);
  assert.deepEqual(line.tokens, { input: 17, output: 31, cacheRead: 413, cacheCreate: 49, total: 510 });
  assert.deepEqual(line.subagentTokens, { input: 4, output: 9, cacheRead: 300, cacheCreate: 10, total: 323 });
  assert.equal('subagentsPending' in line, false);
  const serialized = JSON.stringify(line);
  assert.doesNotMatch(serialized, /SECRET FILE BODY|secret-content|npm test/);
});

test('turn-log does not duplicate when Stop reruns for the same turn and writes a new turn', context => {
  const root = workspace(context);
  const events = twoTurnTranscript();
  const transcript = writeTranscript(root, events);

  assert.equal(runHook(root, stopPayload(transcript)).status, 0);
  assert.equal(runHook(root, stopPayload(transcript, { stop_hook_active: true })).status, 0);
  events.push(assistant('m5', usage(1, 1, 1, 1), [{ type: 'text', text: 'next' }]));
  writeTranscript(root, events);
  assert.equal(runHook(root, stopPayload(transcript)).status, 0);
  assert.equal(logLines(root).length, 1);
  const marker = getSessionValue(root, 'session-1', 'turn');
  assert.equal(marker.turnStartLine, 5);

  events.push(prompt('Third turn'), assistant('m6', usage(7, 8, 9, 10), [toolUse('t-read', 'Read', { file_path: '/repo/c.js' })]));
  writeTranscript(root, events);
  assert.equal(runHook(root, stopPayload(transcript)).status, 0);
  const lines = logLines(root);
  assert.equal(lines.length, 2);
  assert.equal(lines[1].request, 'Third turn');
  assert.deepEqual(lines[1].tools, { Read: 1 });
  assert.deepEqual(lines[1].files, []);
  assert.deepEqual(lines[1].tokens, { input: 7, output: 8, cacheRead: 9, cacheCreate: 10, total: 34 });
});

test('turn-log does not treat tool_result, isMeta, task-notification or turn interrupts as a turn start', context => {
  const root = workspace(context);
  const transcript = writeTranscript(root, [
    prompt('Real prompt'),
    assistant('m1', usage(1, 1, 1, 1), [toolUse('t1', 'Bash', { command: 'ls' })]),
    toolResult('t1'),
    { type: 'user', isMeta: true, message: { role: 'user', content: [{ type: 'text', text: 'system injected' }] } },
    { type: 'user', message: { role: 'user', content: [{ type: 'text', text: '[Request interrupted by user for tool use]' }] } },
    { type: 'user', origin: { kind: 'task-notification' }, message: { role: 'user', content: 'system message' } },
    { type: 'user', isSidechain: true, message: { role: 'user', content: 'subagent prompt' } },
    assistant('m2', usage(2, 2, 2, 2), [toolUse('t2', 'Bash', { command: 'pwd' })]),
  ]);
  assert.equal(runHook(root, stopPayload(transcript)).status, 0);
  const [line] = logLines(root);
  assert.equal(line.request, 'Real prompt');
  assert.deepEqual(line.tools, { Bash: 2 });
  assert.equal(line.tokens.total, 12);
});

test('turn-log stays silent when the transcript is missing, the payload is broken or there is no prompt', context => {
  const root = workspace(context);
  for (const payload of [
    stopPayload(path.join(root, 'missing.jsonl')),
    stopPayload(''),
    { broken: true },
    stopPayload(writeTranscript(root, [assistant('m1', usage(1, 1, 1, 1))], 'no-prompt.jsonl')),
  ]) {
    const result = runHook(root, payload);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, '');
  }
  const broken = spawnSync('bash', [turnHook], { cwd: root, input: 'not json', encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
  assert.equal(broken.status, 0);
  assert.equal(fs.existsSync(path.join(root, '.agents/storage')), false);
});

test('turn-log cuts the request to 200 characters and masks obvious secrets', context => {
  const root = workspace(context);
  const secrets = 'Authorization: Bearer abc.def-123 token=tok_123456 password: "p@ss word" key sk_live_ABCDEF123456 ghp_abcdefghijklmnopqrstuvwxyz0123 ';
  const transcript = writeTranscript(root, [prompt(`${secrets}\n${'x'.repeat(400)}`), assistant('m1', usage(1, 1, 1, 1))]);
  assert.equal(runHook(root, stopPayload(transcript)).status, 0);
  const [line] = logLines(root);
  assert.equal(Array.from(line.request).length, 200);
  assert.doesNotMatch(line.request, /abc\.def-123|tok_123456|p@ss|sk_live_ABCDEF123456|ghp_abcdefghijklmnopqrstuvwxyz0123/);
  assert.match(line.request, /^Authorization: Bearer \[REDACTED\] token=\[REDACTED\] password: \[REDACTED\] key \[REDACTED\] \[REDACTED\] x+$/);
});

test('turn-log summarizes slash commands and reports unfinished subagents as pending', context => {
  const root = workspace(context);
  const transcript = writeTranscript(root, [
    prompt('<command-message>git</command-message>\n<command-name>/git</command-name>\n<command-args>commit</command-args>'),
    assistant('m1', usage(1, 1, 1, 1), [toolUse('t-agent', 'Agent', { description: 'background', prompt: 'x' })]),
    toolResult('t-agent', { isAsync: true, status: 'async_launched', agentId: 'agentasync1' }),
  ]);
  writeSubagent(transcript, 'agentasync1', [assistant('s1', usage(50, 50, 50, 50))], { requestShape: 'background' });
  assert.equal(runHook(root, stopPayload(transcript)).status, 0);
  const [line] = logLines(root);
  assert.equal(line.request, '/git commit');
  assert.equal('subagentTokens' in line, false);
  assert.equal(line.subagentsPending, 1);
});

test('turn-log runs through the symlinked .agents/hooks/scripts path', context => {
  const root = workspace(context);
  const transcript = writeTranscript(root, twoTurnTranscript('Called via symlink'));
  const result = runHook(root, stopPayload(transcript), symlinkedTurnHook);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
  const [line] = logLines(root);
  assert.equal(line.request, 'Called via symlink');
  assert.equal(line.tokens.total, 510);
});
