import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const hook = fileURLToPath(new URL('../.claude/hooks/scripts/remind-cleanup.sh', import.meta.url));

function project(context, { withScratchFile = true } = {}) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'remind-cleanup-test-')));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const logDirectory = path.join(root, '.agents/storage/logs');
  fs.mkdirSync(logDirectory, { recursive: true });
  const filePath = path.join(root, withScratchFile ? 'scratch-notes.txt' : 'feature.txt');
  fs.writeFileSync(filePath, 'x');
  const logEntry = { session_id: 'session-1', tool: 'Write', cwd: root, input: { file_path: filePath } };
  fs.writeFileSync(path.join(logDirectory, 'logs.jsonl'), `${JSON.stringify(logEntry)}\n`);
  return root;
}

function writeTranscript(root, usage) {
  const transcriptPath = path.join(root, 'transcript.jsonl');
  const lines = [
    JSON.stringify({ type: 'assistant', message: { usage: { input_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } } }),
    JSON.stringify({ type: 'assistant', message: { usage } }),
    '{not json',
    JSON.stringify({ type: 'user', message: { content: 'hello' } }),
  ];
  fs.writeFileSync(transcriptPath, `${lines.join('\n')}\n`);
  return transcriptPath;
}

function runHook(root, payload, extraEnvironment = {}) {
  const environment = { ...process.env, ...extraEnvironment };
  delete environment.CLAUDE_PROJECT_DIR;
  if (!('CLAUDE_CONTEXT_LIMIT' in extraEnvironment)) delete environment.CLAUDE_CONTEXT_LIMIT;
  return spawnSync('bash', [hook], { cwd: root, input: JSON.stringify(payload), encoding: 'utf8', env: environment });
}

const usageOf = (input, cacheRead, cacheCreate) => ({
  input_tokens: input, cache_read_input_tokens: cacheRead, cache_creation_input_tokens: cacheCreate, output_tokens: 500,
});

test('below 80% context stays silent even with scratch files', context => {
  const root = project(context);
  const transcriptPath = writeTranscript(root, usageOf(1000, 100000, 20000));
  const result = runHook(root, { session_id: 'session-1', transcript_path: transcriptPath });
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
});

test('at or above 80% with scratch files reminds with context percentage', context => {
  const root = project(context);
  const transcriptPath = writeTranscript(root, usageOf(4000, 150000, 10000));
  const result = runHook(root, { session_id: 'session-1', transcript_path: transcriptPath });
  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout).hookSpecificOutput;
  assert.equal(output.hookEventName, 'Stop');
  assert.match(output.additionalContext, /Context đã dùng 82% \(164k\/200k\)/);
  assert.match(output.additionalContext, /Phát hiện 1 file/);
  assert.match(output.additionalContext, /scratch-notes\.txt/);
  assert.match(output.additionalContext, /cleanup-temp-files/);
});

test('at or above 80% without scratch files stays silent', context => {
  const root = project(context, { withScratchFile: false });
  const transcriptPath = writeTranscript(root, usageOf(4000, 150000, 10000));
  const result = runHook(root, { session_id: 'session-1', transcript_path: transcriptPath });
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
});

test('CLAUDE_CONTEXT_LIMIT overrides the default limit', context => {
  const root = project(context);
  const transcriptPath = writeTranscript(root, usageOf(1000, 80000, 10000));
  const payload = { session_id: 'session-1', transcript_path: transcriptPath };

  const lowerLimit = runHook(root, payload, { CLAUDE_CONTEXT_LIMIT: '100000' });
  assert.equal(lowerLimit.status, 0);
  assert.match(JSON.parse(lowerLimit.stdout).hookSpecificOutput.additionalContext, /Context đã dùng 91% \(91k\/100k\)/);

  const invalidLimit = runHook(root, payload, { CLAUDE_CONTEXT_LIMIT: 'abc' });
  assert.equal(invalidLimit.status, 0);
  assert.equal(invalidLimit.stdout, '');
});

test('usage above 200k in any earlier message infers a 1M limit; env override still wins', context => {
  const root = project(context);
  const transcriptPath = path.join(root, 'transcript.jsonl');
  const lines = [
    JSON.stringify({ type: 'assistant', message: { usage: usageOf(1000, 249000, 0) } }),
    JSON.stringify({ type: 'assistant', message: { usage: usageOf(1000, 299000, 0) } }),
  ];
  fs.writeFileSync(transcriptPath, `${lines.join('\n')}\n`);
  const payload = { session_id: 'session-1', transcript_path: transcriptPath };

  const inferred = runHook(root, payload);
  assert.equal(inferred.status, 0);
  assert.equal(inferred.stdout, '');

  const overridden = runHook(root, payload, { CLAUDE_CONTEXT_LIMIT: '200000' });
  assert.equal(overridden.status, 0);
  assert.match(JSON.parse(overridden.stdout).hookSpecificOutput.additionalContext, /Context đã dùng 150% \(300k\/200k\)/);
});

test('missing transcript stays silent', context => {
  const root = project(context);
  const missing = runHook(root, { session_id: 'session-1', transcript_path: path.join(root, 'missing.jsonl') });
  assert.equal(missing.status, 0);
  assert.equal(missing.stdout, '');

  const absent = runHook(root, { session_id: 'session-1' });
  assert.equal(absent.status, 0);
  assert.equal(absent.stdout, '');
});

function projectWithFiles(context, relativePaths) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'remind-cleanup-test-')));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, '.agents/storage/logs'), { recursive: true });
  addWrittenFiles(root, relativePaths);
  return root;
}

function addWrittenFiles(root, relativePaths) {
  const lines = relativePaths.map(relativePath => {
    const filePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, 'x');
    return JSON.stringify({ session_id: 'session-1', tool: 'Write', cwd: root, input: { file_path: filePath } });
  });
  fs.appendFileSync(path.join(root, '.agents/storage/logs/logs.jsonl'), `${lines.join('\n')}\n`);
}

const finder = fileURLToPath(new URL('../.agents/skills/cleanup-temp-files/scripts/find-session-scratch-files.sh', import.meta.url));

function runFinder(root) {
  const environment = { ...process.env };
  delete environment.CLAUDE_PROJECT_DIR;
  return spawnSync('bash', [finder, 'session-1'], { cwd: root, encoding: 'utf8', env: environment });
}

test('finder skips project config/docs directories but keeps root scratch files', context => {
  const root = projectWithFiles(context, [
    '.agents/rules/debug.md',
    '.agents/skills/x/draft-skill.md',
    '.agents/agents/tmp-agent.md',
    '.claude/hooks/debug-hook.sh',
    '.codex/tmp-config.toml',
    'docs/draft-x.md',
    'tmp-notes.md',
  ]);
  const result = runFinder(root);
  assert.equal(result.status, 0);
  assert.deepEqual(result.stdout.trim().split('\n'), [path.join(root, 'tmp-notes.md')]);
});

test('reminds each scratch file only once per session', context => {
  const root = projectWithFiles(context, ['tmp-notes.md', 'docs/draft-x.md', '.agents/rules/debug.md']);
  const transcriptPath = writeTranscript(root, usageOf(4000, 150000, 10000));
  const payload = { session_id: 'session-1', transcript_path: transcriptPath };

  const first = runHook(root, payload);
  assert.equal(first.status, 0);
  const firstMessage = JSON.parse(first.stdout).hookSpecificOutput.additionalContext;
  assert.match(firstMessage, /Phát hiện 1 file/);
  assert.match(firstMessage, /tmp-notes\.md/);
  assert.doesNotMatch(firstMessage, /debug\.md|draft-x\.md/);

  const second = runHook(root, payload);
  assert.equal(second.status, 0);
  assert.equal(second.stdout, '');

  addWrittenFiles(root, ['scratch-new.txt']);
  const third = runHook(root, payload);
  assert.equal(third.status, 0);
  const thirdMessage = JSON.parse(third.stdout).hookSpecificOutput.additionalContext;
  assert.match(thirdMessage, /Phát hiện 1 file/);
  assert.match(thirdMessage, /scratch-new\.txt/);
  assert.doesNotMatch(thirdMessage, /tmp-notes\.md/);
});

test('state write failure does not block the reminder', context => {
  const root = projectWithFiles(context, ['tmp-notes.md']);
  fs.mkdirSync(path.join(root, '.agents/storage'), { recursive: true });
  fs.writeFileSync(path.join(root, '.agents/storage/state'), 'not a directory');
  const transcriptPath = writeTranscript(root, usageOf(4000, 150000, 10000));
  const result = runHook(root, { session_id: 'session-1', transcript_path: transcriptPath });
  assert.equal(result.status, 0);
  assert.match(JSON.parse(result.stdout).hookSpecificOutput.additionalContext, /tmp-notes\.md/);
});

const realGrep = spawnSync('bash', ['-c', 'command -v grep'], { encoding: 'utf8' }).stdout.trim();

// Giả lập grep kiểu BSD: file pattern rỗng khớp mọi dòng, nên `grep -v -f <rỗng>` không in gì.
function bsdLikeGrepDirectory(root) {
  const directory = path.join(root, 'fake-bin');
  fs.mkdirSync(directory);
  const script = `#!/usr/bin/env bash
previous=""
for argument in "$@"; do
  if [ "$previous" = "-f" ] && [ ! -s "$argument" ]; then exit 1; fi
  previous="$argument"
done
exec "${realGrep}" "$@"
`;
  fs.writeFileSync(path.join(directory, 'grep'), script);
  fs.chmodSync(path.join(directory, 'grep'), 0o755);
  return directory;
}

test('an empty reminded-state file does not suppress the reminder', context => {
  const root = project(context);
  const transcriptPath = path.join(root, 'transcript.jsonl');
  fs.writeFileSync(transcriptPath, `${JSON.stringify({ type: 'assistant', message: { usage: usageOf(4000, 150000, 10000) } })}\n`);
  const stateDirectory = path.join(root, '.agents/storage/state');
  fs.mkdirSync(stateDirectory, { recursive: true });
  fs.writeFileSync(path.join(stateDirectory, 'session-1.cleanup-reminded'), '');
  const result = runHook(
    root,
    { session_id: 'session-1', transcript_path: transcriptPath },
    { PATH: `${bsdLikeGrepDirectory(root)}:${process.env.PATH}` },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(JSON.parse(result.stdout).hookSpecificOutput.additionalContext, /scratch-notes\.txt/);
});
