import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const hook = path.join(repoRoot, '.claude/hooks/scripts/audit-log.sh');
const hookViaSymlink = path.join(repoRoot, '.agents/hooks/scripts/audit-log.sh');
const logRelativePath = '.agents/storage/logs/logs.jsonl';

function temporaryDirectory(context, prefix = 'audit-log-test-') {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

// projectDirectory: string -> CLAUDE_PROJECT_DIR, null -> unset.
function runAudit(input, { projectDirectory, cwd, script = hook }) {
  const environment = { ...process.env };
  delete environment.CLAUDE_PROJECT_DIR;
  if (projectDirectory !== null) environment.CLAUDE_PROJECT_DIR = projectDirectory;
  const result = spawnSync('bash', [script], {
    cwd,
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
    env: environment,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  return result;
}

function logEntries(directory) {
  const file = path.join(directory, logRelativePath);
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line));
}

function auditOnce(context, payload) {
  const project = temporaryDirectory(context);
  runAudit(payload, { projectDirectory: project, cwd: project });
  const entries = logEntries(project);
  assert.equal(entries.length, 1);
  return entries[0];
}

test('log line has ts, session_id, tool, cwd and input; agent_id only when present', context => {
  const entry = auditOnce(context, { session_id: 's-1', tool_name: 'Read', cwd: '/work/dir', tool_input: { file_path: '/work/dir/a.txt' } });
  assert.deepEqual(Object.keys(entry).sort(), ['cwd', 'input', 'session_id', 'tool', 'ts']);
  assert.match(entry.ts, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  assert.equal(entry.session_id, 's-1');
  assert.equal(entry.tool, 'Read');
  assert.equal(entry.cwd, '/work/dir');
  assert.deepEqual(entry.input, { file_path: '/work/dir/a.txt' });

  const subagentEntry = auditOnce(context, { session_id: 's-1', tool_name: 'Read', agent_id: 'agent-7', tool_input: {} });
  assert.equal(subagentEntry.agent_id, 'agent-7');

  const emptyAgentEntry = auditOnce(context, { session_id: 's-1', tool_name: 'Read', agent_id: '', tool_input: {} });
  assert.equal('agent_id' in emptyAgentEntry, false);
});

test('missing session_id and cwd fall back to "unknown" and empty string', context => {
  const entry = auditOnce(context, { tool_name: 'Glob', tool_input: { pattern: '**/*.md' } });
  assert.equal(entry.session_id, 'unknown');
  assert.equal(entry.cwd, '');
});

test('Write and Edit log only file_path, never content/old_string/new_string', context => {
  const secretText = 'CONFIDENTIAL-BODY-123';
  const writeEntry = auditOnce(context, { tool_name: 'Write', tool_input: { file_path: '/p/w.txt', content: secretText } });
  assert.deepEqual(writeEntry.input, { file_path: '/p/w.txt' });
  const editEntry = auditOnce(context, {
    tool_name: 'Edit',
    tool_input: { file_path: '/p/e.txt', old_string: secretText, new_string: `${secretText}-new`, replace_all: true },
  });
  assert.deepEqual(editEntry.input, { file_path: '/p/e.txt' });
  assert.doesNotMatch(JSON.stringify([writeEntry, editEntry]), new RegExp(secretText));
});

test('Bash command is truncated to 200 characters; short commands are kept whole', context => {
  const longCommand = `echo ${'x'.repeat(300)}`;
  const longEntry = auditOnce(context, { tool_name: 'Bash', tool_input: { command: longCommand, description: 'long' } });
  assert.deepEqual(longEntry.input, { command: longCommand.slice(0, 200) });
  assert.equal(longEntry.input.command.length, 200);

  const shortEntry = auditOnce(context, { tool_name: 'Bash', tool_input: { command: 'ls -la' } });
  assert.deepEqual(shortEntry.input, { command: 'ls -la' });
});

test('pattern and skill are summarized; other inputs become {}', context => {
  assert.deepEqual(auditOnce(context, { tool_name: 'Grep', tool_input: { pattern: 'TODO', path: '/src' } }).input, { pattern: 'TODO' });
  assert.deepEqual(auditOnce(context, { tool_name: 'Skill', tool_input: { skill: 'report', args: 'x' } }).input, { skill: 'report' });
  assert.deepEqual(auditOnce(context, { tool_name: 'WebFetch', tool_input: { url: 'https://example.com', prompt: 'p' } }).input, {});
  assert.deepEqual(auditOnce(context, { tool_name: 'TodoWrite' }).input, {});
});

test('log location precedence: CLAUDE_PROJECT_DIR, then input cwd, then pwd', context => {
  const project = temporaryDirectory(context);
  const inputCwd = temporaryDirectory(context);
  const processCwd = temporaryDirectory(context);
  const missing = path.join(project, 'does-not-exist');
  const payload = cwd => ({ tool_name: 'Read', tool_input: {}, ...(cwd === undefined ? {} : { cwd }) });

  runAudit(payload(inputCwd), { projectDirectory: project, cwd: processCwd });
  assert.equal(logEntries(project).length, 1);
  assert.equal(logEntries(inputCwd).length, 0);

  runAudit(payload(inputCwd), { projectDirectory: missing, cwd: processCwd });
  assert.equal(logEntries(inputCwd).length, 1);
  assert.equal(fs.existsSync(missing), false);

  runAudit(payload(inputCwd), { projectDirectory: null, cwd: processCwd });
  assert.equal(logEntries(inputCwd).length, 2);

  runAudit(payload(path.join(inputCwd, 'gone')), { projectDirectory: null, cwd: processCwd });
  runAudit(payload(undefined), { projectDirectory: null, cwd: processCwd });
  assert.equal(logEntries(processCwd).length, 2);
  assert.equal(logEntries(project).length, 1);
});

test('missing tool_name or invalid JSON writes nothing and still exits 0', context => {
  const project = temporaryDirectory(context);
  runAudit({ session_id: 's', tool_input: { command: 'ls' } }, { projectDirectory: project, cwd: project });
  runAudit({ tool_name: '', tool_input: {} }, { projectDirectory: project, cwd: project });
  runAudit('not json {', { projectDirectory: project, cwd: project });
  runAudit('', { projectDirectory: project, cwd: project });
  assert.equal(fs.existsSync(path.join(project, '.agents/storage')), false);
});

test('appends one line per call when invoked through the .agents/hooks/scripts symlink', context => {
  const project = temporaryDirectory(context);
  runAudit({ tool_name: 'Read', tool_input: { file_path: '/a' } }, { projectDirectory: project, cwd: project, script: hookViaSymlink });
  runAudit({ tool_name: 'Bash', tool_input: { command: 'pwd' } }, { projectDirectory: project, cwd: project, script: hookViaSymlink });
  const entries = logEntries(project);
  assert.deepEqual(entries.map(entry => entry.tool), ['Read', 'Bash']);
  assert.ok(fs.readFileSync(path.join(project, logRelativePath), 'utf8').endsWith('\n'));
});

// Finding #3: audit-log.sh:48 ghi nguyên 200 ký tự đầu của Bash command, kể cả secret.
test.todo('Bash command secrets (tokens, passwords, API keys) are redacted before being written to the audit log');
