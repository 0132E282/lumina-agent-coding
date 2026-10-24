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

function runHook(project, toolResponse, options = {}) {
  const payloadCwd = options.payloadCwd ?? project;
  const sessionProject = options.sessionProject ?? project;
  const result = spawnSync('bash', [hook], {
    cwd: project,
    input: JSON.stringify({ tool_name: toolName, tool_input: { action: 'screenshot' }, tool_response: toolResponse, cwd: payloadCwd }),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: sessionProject, LUMINA_TASK_SLUG: options.taskSlug ?? '' },
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
  assert.match(output.additionalContext, /staging inbox/i);
  assert.match(output.additionalContext, /evidence\/<task-slug>/);
  assert.doesNotMatch(output.additionalContext, /Dẫn đường dẫn.*ở trên.*báo cáo/i);
});

test('uses the payload cwd git root instead of a different session project', context => {
  const sessionProject = makeDirectory(context, os.tmpdir(), 'copy-screenshot-session-');
  const activeProject = makeDirectory(context, os.tmpdir(), 'copy-screenshot-active-');
  const nestedCwd = path.join(activeProject, 'packages', 'app');
  fs.mkdirSync(nestedCwd, { recursive: true });
  spawnSync('git', ['init', '-q'], { cwd: activeProject });
  const screenshots = makeDirectory(context, os.tmpdir(), 'claude-chrome-screenshots-');
  const source = path.join(screenshots, 'active.png');
  fs.writeFileSync(source, 'active');

  const output = runHook(sessionProject, source, { payloadCwd: nestedCwd, sessionProject });
  const copied = path.join(activeProject, '.agents/storage/evidence/browser', today(), 'active.png');

  assert.equal(fs.readFileSync(copied, 'utf8'), 'active');
  assert.equal(fs.existsSync(path.join(sessionProject, '.agents/storage/evidence/browser', today(), 'active.png')), false);
  assert.ok(output.additionalContext.includes(copied));
});

test('copies directly into a validated task slug directory when configured', context => {
  const { project, screenshots } = setup(context);
  const source = path.join(screenshots, 'task.png');
  fs.writeFileSync(source, 'task');

  const output = runHook(project, source, { taskSlug: 'fix-evidence_scope.2' });
  const copied = path.join(project, '.agents/storage/evidence/fix-evidence_scope.2', 'task.png');

  assert.equal(fs.readFileSync(copied, 'utf8'), 'task');
  assert.ok(output.additionalContext.includes(copied));
  assert.doesNotMatch(output.additionalContext, /staging inbox/i);
});

test('ignores an invalid task slug and keeps the screenshot in staging', context => {
  const { project, screenshots, evidence } = setup(context);
  const source = path.join(screenshots, 'invalid-slug.png');
  fs.writeFileSync(source, 'task');

  const output = runHook(project, source, { taskSlug: '../outside' });

  assert.equal(fs.readFileSync(path.join(evidence, 'invalid-slug.png'), 'utf8'), 'task');
  assert.equal(fs.existsSync(path.join(project, '.agents/storage/outside/invalid-slug.png')), false);
  assert.match(output.additionalContext, /staging inbox/i);
});

test('does not copy through an evidence symlink outside the active project', context => {
  const { project, screenshots } = setup(context);
  const outside = makeDirectory(context, os.tmpdir(), 'copy-screenshot-destination-');
  fs.mkdirSync(path.join(project, '.agents/storage'), { recursive: true });
  fs.symlinkSync(outside, path.join(project, '.agents/storage/evidence'));
  const source = path.join(screenshots, 'symlink-destination.png');
  fs.writeFileSync(source, 'task');

  const output = runHook(project, source, { taskSlug: 'fix-evidence' });

  assert.equal(output, null);
  assert.equal(fs.existsSync(path.join(outside, 'fix-evidence', 'symlink-destination.png')), false);
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
