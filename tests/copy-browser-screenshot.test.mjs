import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const hook = path.join(repoRoot, '.claude/hooks/scripts/copy-browser-screenshot.sh');
const toolName = 'mcp__claude-in-chrome__computer';

function today() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

function makeDirectory(context, parent, prefix) {
  fs.mkdirSync(parent, { recursive: true });
  const directory = fs.mkdtempSync(path.join(parent, prefix));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function setup(context) {
  const project = makeDirectory(context, os.tmpdir(), 'copy-screenshot-project-');
  const screenshots = makeDirectory(context, os.tmpdir(), 'claude-chrome-screenshots-');
  return { project, screenshots, evidence: path.join(project, '.agents/storage/evidence/browser', today()) };
}

function runHook(project, toolResponse) {
  const result = spawnSync('bash', [hook], {
    cwd: project,
    input: JSON.stringify({ tool_name: toolName, tool_input: { action: 'screenshot' }, tool_response: toolResponse, cwd: project }),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: project },
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim() === '' ? null : JSON.parse(result.stdout).hookSpecificOutput;
}

test('copies a screenshot from the temp directory into the project and reports the new path', context => {
  const { project, screenshots, evidence } = setup(context);
  const source = path.join(screenshots, 'screenshot-1761200000-1.jpg');
  fs.writeFileSync(source, 'jpeg-bytes');

  const output = runHook(project, [{ type: 'text', text: `Saved screenshot to ${source}` }]);

  const copied = path.join(evidence, 'screenshot-1761200000-1.jpg');
  assert.equal(fs.readFileSync(copied, 'utf8'), 'jpeg-bytes');
  assert.ok(fs.existsSync(source), 'source must be copied, not moved');
  assert.equal(output.hookEventName, 'PostToolUse');
  assert.ok(output.additionalContext.includes(copied));
});

test('finds image paths anywhere in an unknown tool_response shape', context => {
  const { project, screenshots, evidence } = setup(context);
  const png = path.join(screenshots, 'a.png');
  const webp = path.join(screenshots, 'b.WEBP');
  fs.writeFileSync(png, 'png');
  fs.writeFileSync(webp, 'webp');

  runHook(project, { results: [{ nested: { path: png } }, `"${webp}"`] });

  assert.equal(fs.readFileSync(path.join(evidence, 'a.png'), 'utf8'), 'png');
  assert.equal(fs.readFileSync(path.join(evidence, 'b.WEBP'), 'utf8'), 'webp');
});

test('never overwrites an existing file with the same name', context => {
  const { project, screenshots, evidence } = setup(context);
  fs.mkdirSync(evidence, { recursive: true });
  fs.writeFileSync(path.join(evidence, 'shot.jpg'), 'old');
  const source = path.join(screenshots, 'shot.jpg');
  fs.writeFileSync(source, 'new');

  const output = runHook(project, source);

  assert.equal(fs.readFileSync(path.join(evidence, 'shot.jpg'), 'utf8'), 'old');
  assert.equal(fs.readFileSync(path.join(evidence, 'shot-1.jpg'), 'utf8'), 'new');
  assert.ok(output.additionalContext.includes(path.join(evidence, 'shot-1.jpg')));
});

test('skips paths outside temp directories, missing files and symlinks', context => {
  const { project, screenshots, evidence } = setup(context);
  const outside = makeDirectory(context, path.join(repoRoot, '.agents/storage'), 'copy-screenshot-outside-');
  const outsideImage = path.join(outside, 'outside.png');
  fs.writeFileSync(outsideImage, 'secret');
  const link = path.join(screenshots, 'link.png');
  fs.symlinkSync(outsideImage, link);

  const output = runHook(project, `${outsideImage} ${path.join(screenshots, 'missing.png')} ${link}`);

  assert.equal(output, null);
  assert.equal(fs.existsSync(evidence), false);
});

test('prints nothing when the response contains no image and always exits 0', context => {
  const { project, evidence } = setup(context);
  assert.equal(runHook(project, [{ type: 'text', text: 'Clicked at (10, 20)' }]), null);
  assert.equal(runHook(project, null), null);
  assert.equal(fs.existsSync(evidence), false);

  const invalid = spawnSync('bash', [hook], {
    cwd: project,
    input: 'not json',
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: project },
  });
  assert.equal(invalid.status, 0);
  assert.equal(invalid.stdout, '');
});
