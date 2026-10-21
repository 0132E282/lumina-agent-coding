import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(import.meta.dirname, '..');
const sourceScripts = path.join(repoRoot, '.claude/hooks/scripts');
const payload = JSON.stringify({ tool_name: 'Read', tool_input: { file_path: 'x' }, session_id: 's1' });

function installScripts(directory, names) {
  fs.mkdirSync(directory, { recursive: true });
  for (const name of names) fs.copyFileSync(path.join(sourceScripts, name), path.join(directory, name));
}

function createFixture({ projectHasHook }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-dedupe-'));
  const homeScripts = path.join(root, 'home/.claude/hooks/scripts');
  const project = path.join(root, 'project');
  const projectScripts = path.join(project, '.claude/hooks/scripts');
  installScripts(homeScripts, ['_dedupe-guard.sh', 'audit-log.sh']);
  installScripts(projectScripts, projectHasHook ? ['_dedupe-guard.sh', 'audit-log.sh'] : ['_dedupe-guard.sh']);
  fs.mkdirSync(path.join(project, '.agents'), { recursive: true });
  fs.symlinkSync('../.claude/hooks', path.join(project, '.agents/hooks'), 'dir');
  const logFile = path.join(project, '.agents/storage/logs/logs.jsonl');
  return { root, homeScripts, project, projectScripts, logFile };
}

function runHook(scriptPath, project) {
  return spawnSync('bash', [scriptPath], {
    input: payload,
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: project },
  });
}

function logLineCount(logFile) {
  return fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean).length : 0;
}

test('user-level copy is skipped when the project has the same hook', () => {
  const fixture = createFixture({ projectHasHook: true });
  const result = runHook(path.join(fixture.homeScripts, 'audit-log.sh'), fixture.project);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
  assert.equal(logLineCount(fixture.logFile), 0);
});

test('user-level copy runs when the project lacks the hook', () => {
  const fixture = createFixture({ projectHasHook: false });
  const result = runHook(path.join(fixture.homeScripts, 'audit-log.sh'), fixture.project);
  assert.equal(result.status, 0);
  assert.equal(logLineCount(fixture.logFile), 1);
});

test('project copy always runs', () => {
  const fixture = createFixture({ projectHasHook: true });
  const result = runHook(path.join(fixture.projectScripts, 'audit-log.sh'), fixture.project);
  assert.equal(result.status, 0);
  assert.equal(logLineCount(fixture.logFile), 1);
});

test('project copy reached through the .agents/hooks symlink runs once and is not skipped', () => {
  const fixture = createFixture({ projectHasHook: true });
  const viaSymlink = path.join(fixture.project, '.agents/hooks/scripts/audit-log.sh');
  const symlinkResult = runHook(viaSymlink, fixture.project);
  assert.equal(symlinkResult.status, 0);
  assert.equal(logLineCount(fixture.logFile), 1);

  const homeResult = runHook(path.join(fixture.homeScripts, 'audit-log.sh'), fixture.project);
  assert.equal(homeResult.status, 0);
  assert.equal(logLineCount(fixture.logFile), 1);
});

test('mjs hook: user-level copy is skipped, project copy runs', () => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'hook-dedupe-mjs-')));
  const homeScripts = path.join(root, 'home/.claude/hooks/scripts');
  const project = path.join(root, 'project');
  const projectScripts = path.join(project, '.claude/hooks/scripts');
  installScripts(homeScripts, ['ensure-final-newline.mjs']);
  installScripts(projectScripts, ['ensure-final-newline.mjs']);
  const target = path.join(project, 'note.txt');
  const hookPayload = JSON.stringify({ hook_event_name: 'PostToolUse', tool_name: 'Write', tool_input: { file_path: target }, cwd: project });
  const run = (scriptPath) => spawnSync('node', [scriptPath], {
    input: hookPayload,
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: project },
  });

  fs.writeFileSync(target, 'no newline');
  const skipped = run(path.join(homeScripts, 'ensure-final-newline.mjs'));
  assert.equal(skipped.status, 0);
  assert.equal(fs.readFileSync(target, 'utf8'), 'no newline');

  const executed = run(path.join(projectScripts, 'ensure-final-newline.mjs'));
  assert.equal(executed.status, 0);
  assert.equal(fs.readFileSync(target, 'utf8'), 'no newline\n');
});

test('every hook shell script passes bash -n and sources the guard', () => {
  const scripts = fs.readdirSync(sourceScripts).filter((name) => name.endsWith('.sh'));
  for (const name of scripts) {
    const result = spawnSync('bash', ['-n', path.join(sourceScripts, name)], { encoding: 'utf8' });
    assert.equal(result.status, 0, `${name}: ${result.stderr}`);
    if (name === '_dedupe-guard.sh') continue;
    assert.match(fs.readFileSync(path.join(sourceScripts, name), 'utf8'), /^\. "\$\(dirname "\$0"\)\/_dedupe-guard\.sh"$/m, name);
  }
});
