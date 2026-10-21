import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('../.agents/skills/report/scripts/task-usage.mjs', import.meta.url));

function workspace(context) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'task-usage-test-')));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function assistant(id, usage, blocks = []) {
  return { type: 'assistant', message: { id, usage, content: blocks } };
}
function toolUse(name, input) {
  return { type: 'tool_use', id: `tool-${name}`, name, input };
}
function toolResult(text) {
  return { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'x', content: text }] } };
}
function writeTranscript(root, events) {
  const file = path.join(root, 'transcript.jsonl');
  fs.writeFileSync(file, `${events.map(event => JSON.stringify(event)).join('\n')}\n`);
  return file;
}
function run(argumentsList) {
  const result = spawnSync(process.execPath, [script, ...argumentsList], { encoding: 'utf8' });
  return { ...result, json: result.stdout ? JSON.parse(result.stdout) : null };
}
function rules(json) {
  return json.waste.map(item => item.rule);
}
const smallUsage = { input_tokens: 1, output_tokens: 1 };

test('totals deduplicate message IDs and keep the latest usage', context => {
  const file = writeTranscript(workspace(context), [
    assistant('m1', { input_tokens: 10, output_tokens: 1, cache_read_input_tokens: 100, cache_creation_input_tokens: 5 }),
    assistant('m1', { input_tokens: 10, output_tokens: 20, cache_read_input_tokens: 100, cache_creation_input_tokens: 5 }),
    assistant('m2', { input_tokens: 3, output_tokens: 4 }),
    { ...assistant('sub', { input_tokens: 999, output_tokens: 999 }), isSidechain: true },
  ]);
  const { status, json } = run(['--transcript', file]);
  assert.equal(status, 0);
  assert.deepEqual(json.usage, { input: 13, output: 24, cacheRead: 100, cacheCreate: 5, messages: 2 });
  assert.equal(json.lastLine, 4);
});

test('file and command rules trigger at threshold and not below', context => {
  const reads = count => Array.from({ length: count }, (_, index) => assistant(`r${count}-${index}`, smallUsage, [toolUse('Read', { file_path: '/a.txt' })]));
  const bashes = count => Array.from({ length: count }, (_, index) => assistant(`b${count}-${index}`, smallUsage, [toolUse('Bash', { command: 'ls -la' })]));
  const root = workspace(context);
  const below = run(['--transcript', writeTranscript(root, [...reads(2), ...bashes(2)])]);
  assert.deepEqual(below.json.waste, []);
  const at = run(['--transcript', writeTranscript(root, [...reads(3), ...bashes(3)])]);
  assert.deepEqual(at.json.waste, [
    { rule: 'rereadFile', evidence: '/a.txt', count: 3 },
    { rule: 'repeatCommand', evidence: 'ls -la', count: 3 },
  ]);
});

test('repeat command evidence is truncated to 80 characters', context => {
  const command = 'x'.repeat(200);
  const events = Array.from({ length: 3 }, (_, index) => assistant(`t${index}`, smallUsage, [toolUse('Bash', { command })]));
  const { json } = run(['--transcript', writeTranscript(workspace(context), events)]);
  assert.equal(json.waste[0].evidence.length, 80);
});

test('big tool result triggers only above the limit', context => {
  const root = workspace(context);
  const exact = run(['--transcript', writeTranscript(root, [toolResult('x'.repeat(20000))])]);
  assert.deepEqual(exact.json.waste, []);
  const above = run(['--transcript', writeTranscript(root, [toolResult('x'.repeat(20001))])]);
  assert.deepEqual(above.json.waste, [{ rule: 'bigToolResult', evidence: '20001 ký tự', count: 1 }]);
});

test('subagent calls trigger at three', context => {
  const calls = count => Array.from({ length: count }, (_, index) => assistant(`s${count}-${index}`, smallUsage, [toolUse('Agent', { prompt: `p${index}` })]));
  const root = workspace(context);
  assert.deepEqual(run(['--transcript', writeTranscript(root, calls(2))]).json.waste, []);
  assert.deepEqual(rules(run(['--transcript', writeTranscript(root, calls(3))]).json), ['subagentCalls']);
});

test('cache rule needs ratio exceeded and the minimum tokens', context => {
  const root = workspace(context);
  const usage = (cacheCreate, cacheRead) => [assistant('c', { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: cacheCreate, cache_read_input_tokens: cacheRead })];
  assert.deepEqual(run(['--transcript', writeTranscript(root, usage(49999, 0))]).json.waste, []);
  assert.deepEqual(run(['--transcript', writeTranscript(root, usage(60000, 60000))]).json.waste, []);
  assert.deepEqual(rules(run(['--transcript', writeTranscript(root, usage(50000, 49999))]).json), ['cacheCreateOverRead']);
});

test('custom criteria file overrides the defaults', context => {
  const root = workspace(context);
  const criteria = path.join(root, 'criteria.json');
  fs.writeFileSync(criteria, JSON.stringify({ rereadFile: 1, repeatCommand: 9, bigToolResultChars: 9, subagentCalls: 9, cacheCreateOverRead: 1, cacheMinTokens: 1 }));
  const file = writeTranscript(root, [assistant('a', smallUsage, [toolUse('Read', { file_path: '/b.txt' })])]);
  assert.deepEqual(rules(run(['--transcript', file, '--criteria', criteria]).json), ['rereadFile']);
});

test('--since-line measures only later lines', context => {
  const file = writeTranscript(workspace(context), [
    assistant('m1', { input_tokens: 100, output_tokens: 100 }),
    assistant('m2', { input_tokens: 5, output_tokens: 6 }),
  ]);
  const { json } = run(['--transcript', file, '--since-line', '1']);
  assert.deepEqual(json.usage, { input: 5, output: 6, cacheRead: 0, cacheCreate: 0, messages: 1 });
  assert.equal(json.lastLine, 2);
});

test('missing transcript prints nothing on stdout', context => {
  const { status, stdout } = run(['--transcript', path.join(workspace(context), 'missing.jsonl')]);
  assert.equal(status, 1);
  assert.equal(stdout, '');
});
