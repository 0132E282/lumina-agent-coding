import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const hook = fileURLToPath(new URL('../.claude/hooks/scripts/remind-cleanup.sh', import.meta.url));
const realGrep = spawnSync('bash', ['-c', 'command -v grep'], { encoding: 'utf8' }).stdout.trim();

function project(context) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'remind-cleanup-state-')));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const logDirectory = path.join(root, '.agents/storage/logs');
  fs.mkdirSync(logDirectory, { recursive: true });
  const filePath = path.join(root, 'scratch-notes.txt');
  fs.writeFileSync(filePath, 'x');
  const logEntry = { session_id: 'session-1', tool: 'Write', cwd: root, input: { file_path: filePath } };
  fs.writeFileSync(path.join(logDirectory, 'logs.jsonl'), `${JSON.stringify(logEntry)}\n`);
  const usage = { input_tokens: 4000, cache_read_input_tokens: 150000, cache_creation_input_tokens: 10000, output_tokens: 500 };
  const transcriptPath = path.join(root, 'transcript.jsonl');
  fs.writeFileSync(transcriptPath, `${JSON.stringify({ type: 'assistant', message: { usage } })}\n`);
  return { root, transcriptPath };
}

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
  const { root, transcriptPath } = project(context);
  const stateDirectory = path.join(root, '.agents/storage/state');
  fs.mkdirSync(stateDirectory, { recursive: true });
  fs.writeFileSync(path.join(stateDirectory, 'session-1.cleanup-reminded'), '');
  const environment = { ...process.env, PATH: `${bsdLikeGrepDirectory(root)}:${process.env.PATH}` };
  delete environment.CLAUDE_PROJECT_DIR;
  delete environment.CLAUDE_CONTEXT_LIMIT;
  const result = spawnSync('bash', [hook], {
    cwd: root,
    input: JSON.stringify({ session_id: 'session-1', transcript_path: transcriptPath }),
    encoding: 'utf8',
    env: environment,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(JSON.parse(result.stdout).hookSpecificOutput.additionalContext, /scratch-notes\.txt/);
});
