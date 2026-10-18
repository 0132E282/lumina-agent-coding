import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { EventEmitter } from 'node:events';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';
import { initialize, installFromSource, parseArguments, promptAgents, promptInstallScope, withProgress } from '../bin/lumina-agent.mjs';

const executeFile = promisify(execFile);
const repository = fileURLToPath(new URL('../', import.meta.url));

async function fixture(context, copySource = false) {
  const temporary = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'lumina-test-')));
  context.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const target = path.join(temporary, 'project');
  const source = copySource ? path.join(temporary, 'source') : repository;
  if (copySource) {
    await fs.mkdir(source);
    for (const name of ['.agents', '.claude', '.codex', 'CONTRACT.md']) {
      await fs.cp(path.join(repository, name), path.join(source, name), { recursive: true, verbatimSymlinks: true });
    }
  }
  return { temporary, target, source };
}

function terminal(columns = 80) {
  class Input extends EventEmitter {
    isTTY = true;
    rawMode = false;
    setRawMode(enabled) { this.rawMode = enabled; }
    pause() {}
    resume() {}
  }
  const input = new Input();
  const output = { isTTY: true, columns, text: '', write(value) { this.text += value; } };
  return { input, output };
}

function stripAnsi(value) {
  return value.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '');
}

test('install selects project, explicit target or home', () => {
  const locations = { cwd: '/example/project', home: '/example/home' };
  assert.deepEqual(parseArguments(['install'], locations), { target: locations.cwd, dryRun: false, global: false, agents: ['codex', 'claude', 'antigravity'] });
  assert.deepEqual(parseArguments(['install', '--global', '--dry-run'], locations), { target: locations.home, dryRun: true, global: true, agents: ['codex', 'claude'] });
  assert.equal(parseArguments(['install', '--target', '/another/project'], locations).target, '/another/project');
  assert.deepEqual(parseArguments(['install', '--agent', 'codex', '--agent', 'ANTIGRAVITY'], locations).agents, ['codex', 'antigravity']);
  assert.throws(() => parseArguments(['setup'], locations), /Only the install command/);
  assert.throws(() => parseArguments(['init'], locations), /Only the install command/);
  for (const args of [['--global', '--target', '/project'], ['--target', '/project', '--global'], ['--global', '--global'], ['--target'], ['--unknown']]) {
    assert.throws(() => parseArguments(['install', ...args], locations));
  }
  for (const args of [['--agent'], ['--agent', 'unknown'], ['--agent', 'claude', '--agent', 'claude']]) {
    assert.throws(() => parseArguments(['install', ...args], locations));
  }
  assert.throws(() => parseArguments(['install', '--global', '--agent', 'antigravity'], locations), /Antigravity only supports project-level/);
});

test('selected runtimes install only their adapter and instruction files', async context => {
  const codex = await fixture(context);
  await fs.mkdir(codex.target, { recursive: true });
  await fs.writeFile(path.join(codex.target, 'CLAUDE.md'), 'Keep Claude instructions');
  await fs.mkdir(path.join(codex.target, '.claude'));
  await fs.writeFile(path.join(codex.target, '.claude/settings.json'), '{"model":"keep"}');
  await installFromSource({ ...codex, agents: ['codex'] });
  assert.ok(await fs.stat(path.join(codex.target, 'AGENTS.md')));
  assert.ok(await fs.stat(path.join(codex.target, '.codex/agents/coding-agent.toml')));
  await assert.rejects(fs.stat(path.join(codex.target, '.claude/commands')), { code: 'ENOENT' });
  await assert.rejects(fs.stat(path.join(codex.target, '.claude/hooks')), { code: 'ENOENT' });
  assert.equal(await fs.readFile(path.join(codex.target, 'CLAUDE.md'), 'utf8'), 'Keep Claude instructions');
  assert.equal(await fs.readFile(path.join(codex.target, '.claude/settings.json'), 'utf8'), '{"model":"keep"}');

  const claude = await fixture(context);
  await fs.mkdir(claude.target, { recursive: true });
  await fs.writeFile(path.join(claude.target, 'AGENTS.md'), 'Keep Codex and Antigravity instructions');
  await fs.mkdir(path.join(claude.target, '.codex'));
  await fs.writeFile(path.join(claude.target, '.codex/AGENTS.md'), 'Keep Codex config');
  await installFromSource({ ...claude, agents: ['claude'] });
  assert.ok(await fs.stat(path.join(claude.target, 'CLAUDE.md')));
  assert.ok(await fs.stat(path.join(claude.target, '.claude/settings.json')));
  await assert.rejects(fs.stat(path.join(claude.target, '.codex/agents')), { code: 'ENOENT' });
  assert.equal(await fs.readFile(path.join(claude.target, 'AGENTS.md'), 'utf8'), 'Keep Codex and Antigravity instructions');
  assert.equal(await fs.readFile(path.join(claude.target, '.codex/AGENTS.md'), 'utf8'), 'Keep Codex config');

  const antigravity = await fixture(context);
  await fs.mkdir(antigravity.target, { recursive: true });
  await fs.writeFile(path.join(antigravity.target, 'CLAUDE.md'), 'Keep Claude instructions');
  await fs.mkdir(path.join(antigravity.target, '.claude'));
  await fs.writeFile(path.join(antigravity.target, '.claude/settings.json'), '{"model":"keep"}');
  await fs.mkdir(path.join(antigravity.target, '.codex'));
  await fs.writeFile(path.join(antigravity.target, '.codex/AGENTS.md'), 'Keep Codex config');
  await installFromSource({ ...antigravity, agents: ['antigravity'] });
  assert.ok(await fs.stat(path.join(antigravity.target, 'AGENTS.md')));
  assert.ok(await fs.stat(path.join(antigravity.target, '.agents/skills')));
  await assert.rejects(fs.stat(path.join(antigravity.target, '.claude/agents')), { code: 'ENOENT' });
  await assert.rejects(fs.stat(path.join(antigravity.target, '.claude/commands')), { code: 'ENOENT' });
  await assert.rejects(fs.stat(path.join(antigravity.target, '.codex/agents')), { code: 'ENOENT' });
  assert.equal(await fs.readFile(path.join(antigravity.target, 'CLAUDE.md'), 'utf8'), 'Keep Claude instructions');
  assert.equal(await fs.readFile(path.join(antigravity.target, '.claude/settings.json'), 'utf8'), '{"model":"keep"}');
  assert.equal(await fs.readFile(path.join(antigravity.target, '.codex/AGENTS.md'), 'utf8'), 'Keep Codex config');
});

test('interactive agent selection defaults all checked and supports toggling', async () => {
  const { input, output } = terminal();
  const selection = promptAgents(input, output);
  assert.equal(input.rawMode, true);
  assert.match(output.text, /\[x\] Codex/);
  assert.match(output.text, /\[x\] Claude Code/);
  assert.match(output.text, /\[x\] Antigravity/);
  assert.match(output.text, /\[ Install \]/);
  assert.match(output.text, /\[ Cancel \]/);
  assert.match(output.text, /\[x\] Antigravity[^\n]*\n(?:\u001b\[2K\r[^\n]*\n)*\u001b\[2K\rCtrl\+C để thoát/);
  input.emit('keypress', ' ', { name: 'space' });
  input.emit('keypress', '', { name: 'down' });
  input.emit('keypress', '', { name: 'down' });
  input.emit('keypress', '', { name: 'return' });
  assert.deepEqual(await selection, ['claude', 'antigravity']);
  assert.doesNotMatch(output.text, /\u001b\[8A\u001b\[2K\r(?:\n\u001b\[2K\r){7}$/);
  assert.match(stripAnsi(output.text).replaceAll('\r', ''), /Ctrl\+C để thoát[\s\S]*\[ Install \][\s\S]*\[ Cancel \]\n$/);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(input.rawMode, false);
});

test('interactive prompts redraw in place when navigating or toggling', async () => {
  const agentPrompt = terminal();
  const selection = promptAgents(agentPrompt.input, agentPrompt.output);
  agentPrompt.input.emit('keypress', '', { name: 'down' });
  agentPrompt.input.emit('keypress', ' ', { name: 'space' });
  assert.match(agentPrompt.output.text, /\u001b\[\d+A/);
  assert.match(agentPrompt.output.text, /\u001b\[2K/);
  assert.doesNotMatch(agentPrompt.output.text, /\u001b\[2J\u001b\[H/);
  agentPrompt.input.emit('keypress', '', { name: 'escape' });
  await assert.rejects(selection, /Agent selection cancelled/);

  const scopePrompt = terminal();
  const scope = promptInstallScope(scopePrompt.input, scopePrompt.output, { project: '/work/project' });
  scopePrompt.input.emit('keypress', '', { name: 'up' });
  scopePrompt.input.emit('keypress', '', { name: 'down' });
  assert.match(scopePrompt.output.text, /\u001b\[\d+A/);
  assert.match(scopePrompt.output.text, /\u001b\[2K/);
  scopePrompt.input.emit('keypress', '', { name: 'escape' });
  await assert.rejects(scope, /Install scope selection cancelled/);
});

test('interactive agent actions install or cancel with arrow navigation', async () => {
  const installPrompt = terminal();
  const installation = promptAgents(installPrompt.input, installPrompt.output);
  installPrompt.input.emit('keypress', '', { name: 'down' });
  installPrompt.input.emit('keypress', '', { name: 'down' });
  installPrompt.input.emit('keypress', '', { name: 'down' });
  assert.match(stripAnsi(installPrompt.output.text), /❯ \[ Install \]/);
  installPrompt.input.emit('keypress', '', { name: 'return' });
  assert.deepEqual(await installation, ['codex', 'claude', 'antigravity']);

  const cancelPrompt = terminal();
  const cancellation = promptAgents(cancelPrompt.input, cancelPrompt.output);
  cancelPrompt.input.emit('keypress', '', { name: 'down' });
  cancelPrompt.input.emit('keypress', '', { name: 'down' });
  cancelPrompt.input.emit('keypress', '', { name: 'down' });
  cancelPrompt.input.emit('keypress', '', { name: 'down' });
  assert.match(stripAnsi(cancelPrompt.output.text), /❯ \[ Cancel \]/);
  cancelPrompt.input.emit('keypress', '', { name: 'return' });
  await assert.rejects(cancellation, /Agent selection cancelled/);
});

test('interactive selection requires at least one agent; non-TTY keeps default selection', async () => {
  const { input, output } = terminal();
  const selection = promptAgents(input, output);
  input.emit('keypress', ' ', { name: 'space' });
  input.emit('keypress', '', { name: 'down' });
  input.emit('keypress', ' ', { name: 'space' });
  input.emit('keypress', '', { name: 'down' });
  input.emit('keypress', ' ', { name: 'space' });
  input.emit('keypress', '', { name: 'return' });
  assert.match(output.text, /Select at least one agent/);
  input.emit('keypress', '', { name: 'up' });
  input.emit('keypress', ' ', { name: 'space' });
  input.emit('keypress', '', { name: 'return' });
  assert.deepEqual(await selection, ['claude']);
  assert.deepEqual(await promptAgents({ isTTY: false }, { isTTY: false }), ['codex', 'claude', 'antigravity']);
});

test('interactive agent selection cancels on Ctrl+C without echoing the control character', async () => {
  const { input, output } = terminal();
  const selection = promptAgents(input, output);
  input.emit('keypress', '\u0003', { ctrl: true, name: 'c' });
  await assert.rejects(selection, /Agent selection cancelled/);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(input.rawMode, false);
  assert.doesNotMatch(output.text, /\^C/);
});

test('global agent checklist excludes Antigravity', async () => {
  const { input, output } = terminal();
  const selection = promptAgents(input, output, { global: true });
  assert.match(output.text, /Antigravity is project-only/);
  assert.doesNotMatch(output.text, /\[[ x]\] Antigravity/);
  input.emit('keypress', '', { name: 'down' });
  input.emit('keypress', ' ', { name: 'space' });
  input.emit('keypress', '', { name: 'return' });
  assert.deepEqual(await selection, ['codex']);
});

test('interactive scope defaults to project and navigates to global', async () => {
  const project = terminal();
  const projectScope = promptInstallScope(project.input, project.output, { project: '/work/project' });
  assert.match(project.output.text, /\/work\/project/);
  project.input.emit('keypress', '', { name: 'return' });
  assert.equal(await projectScope, false);
  assert.match(project.output.text, /\u001b\[5A\u001b\[0J$/);
  assert.doesNotMatch(project.output.text, /\u001b\[5A[^\n]*\n/);

  const global = terminal();
  const globalScope = promptInstallScope(global.input, global.output, { project: '/work/project' });
  global.input.emit('keypress', '', { name: 'down' });
  global.input.emit('keypress', '', { name: 'return' });
  assert.equal(await globalScope, true);
  assert.match(global.output.text, /\u001b\[5A\u001b\[0J$/);
  await new Promise(resolve => setImmediate(resolve));
});

test('scope cleanup leaves the next prompt at the banner edge without blank lines', async () => {
  const { input, output } = terminal();
  const scope = promptInstallScope(input, output, { project: '/work/project' });
  input.emit('keypress', '', { name: 'return' });
  assert.equal(await scope, false);

  const previousLength = output.text.length;
  const agents = promptAgents(input, output);
  const nextPrompt = output.text.slice(previousLength);
  assert.doesNotMatch(nextPrompt, /^\n/);
  assert.match(stripAnsi(nextPrompt), /Select agents to install/);
  input.emit('keypress', '', { name: 'return' });
  await agents;
});

test('interactive agent selection keeps the final prompt visible after Enter', async () => {
  const { input, output } = terminal();
  const selection = promptAgents(input, output);
  input.emit('keypress', '', { name: 'return' });

  assert.deepEqual(await selection, ['codex', 'claude', 'antigravity']);
  assert.match(stripAnsi(output.text).replaceAll('\r', ''), /Select agents to install[\s\S]*Ctrl\+C để thoát[\s\S]*\[ Install \][\s\S]*\[ Cancel \]\n$/);
  assert.doesNotMatch(output.text, /\u001b\[8A\u001b\[2K\r(?:\n\u001b\[2K\r){7}$/);
});

test('interactive scope truncates long project hints to keep choices on one line', async () => {
  const project = '/Users/hoangphuc01975/Documents/developers/lumina-agent/project-with-a-very-long-name';
  const { input, output } = terminal(40);
  const selection = promptInstallScope(input, output, { project });
  input.emit('keypress', '', { name: 'down' });
  const choiceLines = stripAnsi(output.text).replaceAll('\r', '').split('\n').filter(line => /(?:Project|Global)/.test(line));

  assert.ok(choiceLines.length > 0);
  assert.ok(choiceLines.every(line => line.length <= 39));
  assert.doesNotMatch(output.text, new RegExp(project));
  assert.match(output.text, /…/);

  input.emit('keypress', '', { name: 'return' });
  assert.equal(await selection, true);
});

test('interactive scope selection cancels on Ctrl+C without echoing the control character', async () => {
  const { input, output } = terminal();
  const selection = promptInstallScope(input, output, { project: '/work/project' });
  input.emit('keypress', '\u0003', { ctrl: true, name: 'c' });
  await assert.rejects(selection, /Install scope selection cancelled/);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(input.rawMode, false);
  assert.doesNotMatch(output.text, /\^C/);
});

test('interactive prompt drains buffered escape input before returning to the shell', async () => {
  const { input, output } = terminal();
  let pendingReads = 0;
  input.read = () => pendingReads++ === 0 ? Buffer.from('\u001b[B') : null;
  const selection = promptAgents(input, output);
  input.emit('keypress', '', { name: 'return' });
  await selection;
  assert.equal(pendingReads, 2);
  assert.doesNotMatch(output.text, /\^\[\[/);
});

test('progress UI renders one full-width bar and clears before the installation result', async () => {
  const { output } = terminal(40);
  const result = await withProgress(async () => ({ changes: 1 }), output);
  assert.deepEqual(result, { changes: 1 });
  assert.match(output.text, /\u001b\[\?25l/);
  const cleanOutput = stripAnsi(output.text);
  assert.equal((cleanOutput.match(/\[█+░+\]/g) ?? []).length, 1);
  assert.match(cleanOutput, /\[█{23}░{13}\]/);
  assert.doesNotMatch(cleanOutput, /Installing\.\.\.|~65%|~10%|~100%|DEPLOY APPLICATION|Building production assets|━/);
  assert.doesNotMatch(output.text, /\u001b\[2A/);
  assert.match(output.text, /\r\u001b\[2K\u001b\[\?25h$/);
});

test('progress UI stays silent and runs the task in non-TTY output', async () => {
  let called = false;
  const output = { isTTY: false, text: '', write(value) { this.text += value; } };
  const result = await withProgress(async () => {
    called = true;
    return { changes: 0 };
  }, output);
  assert.equal(called, true);
  assert.deepEqual(result, { changes: 0 });
  assert.equal(output.text, '');
});

test('progress UI sizes one bar to the terminal width with a two-column margin', async () => {
  const { output } = terminal(40);
  await withProgress(async () => ({ changes: 0 }), output);
  const cleanOutput = stripAnsi(output.text);
  const progressLine = cleanOutput.split('\r').find(line => line.startsWith('['));
  assert.equal(progressLine?.length, 38);
  assert.doesNotMatch(cleanOutput, /Installing\.\.\.|~65%|━/);
});

test('progress indicator clears when installation fails', async () => {
  const { output } = terminal();
  await assert.rejects(withProgress(async () => {
    throw new Error('clone failed');
  }, output), /clone failed/);
  assert.equal((stripAnsi(output.text).match(/\[█+░+\]/g) ?? []).length, 1);
  assert.doesNotMatch(stripAnsi(output.text), /Installing\.\.\.|~65%|~10%|~100%/);
  assert.match(output.text, /\r\u001b\[2K\u001b\[\?25h$/);
});

test('global install preserves user configuration and resolves hooks from another cwd', async context => {
  const options = await fixture(context);
  options.target = path.join(options.temporary, "home with ' quote $ and ` characters");
  options.global = true;
  await fs.mkdir(path.join(options.target, '.claude'), { recursive: true });
  await fs.mkdir(path.join(options.target, '.codex'));
  await fs.writeFile(path.join(options.target, '.claude/CLAUDE.md'), '# Existing Claude\n');
  await fs.writeFile(path.join(options.target, '.codex/AGENTS.md'), '# Existing Codex\n');
  await fs.writeFile(path.join(options.target, '.claude/settings.json'), JSON.stringify({ model: 'existing-model' }));
  assert.ok((await installFromSource(options)).changes > 0);
  for (const relative of ['.claude/CLAUDE.md', '.codex/AGENTS.md']) {
    const content = await fs.readFile(path.join(options.target, relative), 'utf8');
    assert.match(content, /^# Existing/);
    assert.ok(content.includes(`](<${path.join(options.target, 'CONTRACT.md')}>)`));
    assert.doesNotMatch(content, /\]\(\.\//);
  }
  await assert.rejects(fs.stat(path.join(options.target, 'AGENTS.md')), { code: 'ENOENT' });
  await assert.rejects(fs.stat(path.join(options.target, 'CLAUDE.md')), { code: 'ENOENT' });
  const settings = JSON.parse(await fs.readFile(path.join(options.target, '.claude/settings.json'), 'utf8'));
  assert.equal(settings.model, 'existing-model');
  const command = settings.hooks.UserPromptSubmit[0].hooks[0].command;
  assert.ok(command.includes(options.target.replaceAll("'", "'\\''")));
  const resolved = await executeFile('sh', ['-c', `set -- ${command}; printf '%s' "$2"`], { cwd: options.temporary });
  assert.equal(resolved.stdout, path.join(options.target, '.claude/hooks/scripts/markitdown.sh'));
  assert.equal((await installFromSource(options)).changes, 0);
});

test('global dry run and instruction conflict do not write home payload', async context => {
  const options = { ...await fixture(context), global: true };
  await installFromSource({ ...options, dryRun: true });
  await assert.rejects(fs.stat(options.target), { code: 'ENOENT' });
  await fs.mkdir(path.join(options.target, '.codex'), { recursive: true });
  const instruction = path.join(options.target, '.codex/AGENTS.md');
  await fs.writeFile(instruction, '<!-- lumina-agent:start -->\nedited\n<!-- lumina-agent:end -->');
  await assert.rejects(installFromSource(options), /Conflict at \.codex\/AGENTS\.md/);
  assert.deepEqual(await fs.readdir(options.target), ['.codex']);
});

test('empty install preserves relative links and executables; repeat is idempotent', async context => {
  const options = await fixture(context);
  const first = await installFromSource(options);
  assert.ok(first.changes > 0);
  assert.equal(await fs.readlink(path.join(options.target, '.codex/skills')), '../.agents/skills');
  assert.equal(await fs.readlink(path.join(options.target, '.agents/agents')), '../.claude/agents');
  const script = '.agents/skills/git-workflow/scripts/validate-commit-message.sh';
  assert.equal((await fs.stat(path.join(options.target, script))).mode & 0o777, (await fs.stat(path.join(repository, script))).mode & 0o777);
  assert.match(await fs.readFile(path.join(options.target, 'AGENTS.md'), 'utf8'), /lumina-agent:start/);
  assert.doesNotMatch(await fs.readFile(path.join(options.target, 'AGENTS.md'), 'utf8'), /Repo cấu hình agent/);
  assert.equal((await installFromSource(options)).changes, 0);
  for (const name of ['.git', '.agents/storage', 'docs', 'package.json', '.agents/.DS_Store']) {
    await assert.rejects(fs.lstat(path.join(options.target, name)), { code: 'ENOENT' });
  }
});

test('project instructions and settings survive; matching hook commands are deduplicated', async context => {
  const options = await fixture(context);
  await fs.mkdir(path.join(options.target, '.claude'), { recursive: true });
  const projectInstructions = '# Project\nUse our existing React components.\n';
  await fs.writeFile(path.join(options.target, 'AGENTS.md'), projectInstructions);
  await fs.writeFile(path.join(options.target, 'CLAUDE.md'), '# Claude project\n');
  const settings = {
    permissions: { deny: ['Read(.env)'] },
    model: 'existing-model',
    hooks: { PreToolUse: [{ matcher: '.*', hooks: [
      { type: 'command', command: 'bash custom.sh' },
      { command: 'bash .claude/hooks/scripts/audit-log.sh', type: 'command' },
    ] }] },
  };
  await fs.writeFile(path.join(options.target, '.claude/settings.json'), JSON.stringify(settings));
  await installFromSource(options);
  const instructions = await fs.readFile(path.join(options.target, 'AGENTS.md'), 'utf8');
  assert.ok(instructions.startsWith(projectInstructions));
  const merged = JSON.parse(await fs.readFile(path.join(options.target, '.claude/settings.json'), 'utf8'));
  assert.deepEqual(merged.permissions, settings.permissions);
  assert.equal(merged.model, 'existing-model');
  assert.equal(merged.hooks.PreToolUse[0].hooks.length, 2);
  assert.equal((await installFromSource(options)).changes, 0);
});

test('content conflict completes preflight without partial writes', async context => {
  const options = await fixture(context);
  await fs.mkdir(options.target);
  await fs.writeFile(path.join(options.target, 'CONTRACT.md'), 'Project contract');
  await assert.rejects(installFromSource(options), /CONTRACT.md/);
  assert.deepEqual(await fs.readdir(options.target), ['CONTRACT.md']);
  assert.equal(await fs.readFile(path.join(options.target, 'CONTRACT.md'), 'utf8'), 'Project contract');
});

test('overwrite replaces a conflicting payload after explicit confirmation', async context => {
  const options = await fixture(context);
  await fs.mkdir(options.target);
  await fs.writeFile(path.join(options.target, 'CONTRACT.md'), 'Project contract');
  await assert.rejects(installFromSource(options), /Conflict at CONTRACT.md/);
  await installFromSource({ ...options, overwrite: true });
  assert.equal(
    await fs.readFile(path.join(options.target, 'CONTRACT.md'), 'utf8'),
    await fs.readFile(path.join(options.source, 'CONTRACT.md'), 'utf8'),
  );
});

test('edited integration block and invalid settings fail before writing', async context => {
  const options = await fixture(context);
  await fs.mkdir(options.target);
  await fs.writeFile(path.join(options.target, 'AGENTS.md'), '<!-- lumina-agent:start -->\nedited\n<!-- lumina-agent:end -->');
  await assert.rejects(installFromSource(options), /Conflict at AGENTS\.md/);
  assert.deepEqual(await fs.readdir(options.target), ['AGENTS.md']);
  await fs.rm(path.join(options.target, 'AGENTS.md'));
  await fs.mkdir(path.join(options.target, '.claude'));
  await fs.writeFile(path.join(options.target, '.claude/settings.json'), '{"hooks":{"PreToolUse":{}}}');
  await assert.rejects(installFromSource(options), /array/);
  assert.deepEqual(await fs.readdir(options.target), ['.claude']);
  await fs.writeFile(path.join(options.target, '.claude/settings.json'), 'sensitive-credential-not-json');
  await assert.rejects(installFromSource(options), error => /invalid JSON/.test(error.message) && !error.message.includes('sensitive-credential'));
});

test('dry run does not create target or alter existing settings', async context => {
  const options = await fixture(context);
  assert.ok((await installFromSource({ ...options, dryRun: true })).changes > 0);
  await assert.rejects(fs.stat(options.target), { code: 'ENOENT' });
  await fs.mkdir(options.target);
  await fs.writeFile(path.join(options.target, 'AGENTS.md'), 'Original');
  await installFromSource({ ...options, dryRun: true });
  assert.deepEqual(await fs.readdir(options.target), ['AGENTS.md']);
  assert.equal(await fs.readFile(path.join(options.target, 'AGENTS.md'), 'utf8'), 'Original');
});

test('target symlink root, ancestor, directory and instruction file are rejected', async context => {
  const options = await fixture(context);
  const outside = path.join(options.temporary, 'outside');
  await fs.mkdir(outside);
  await fs.symlink(outside, options.target);
  await assert.rejects(installFromSource(options), /real directory/);
  await assert.rejects(installFromSource({ ...options, target: path.join(options.target, 'nested') }), /real directory/);
  await fs.unlink(options.target);
  await fs.mkdir(options.target);
  await fs.symlink(outside, path.join(options.target, '.agents'));
  await assert.rejects(installFromSource(options), /real directory/);
  await fs.unlink(path.join(options.target, '.agents'));
  await fs.writeFile(path.join(outside, 'instructions'), 'Do not touch');
  await fs.symlink(path.join(outside, 'instructions'), path.join(options.target, 'AGENTS.md'));
  await assert.rejects(installFromSource(options), /File conflict/);
  assert.equal(await fs.readFile(path.join(outside, 'instructions'), 'utf8'), 'Do not touch');
  assert.deepEqual(await fs.readdir(options.target), ['AGENTS.md']);
});

test('source links escaping repo, outside allowlist and broken links are rejected', async context => {
  const options = await fixture(context, true);
  const link = path.join(options.source, '.agents/skills/unsafe');
  await fs.writeFile(path.join(options.temporary, 'private-data'), 'Private');
  await fs.symlink('../../../private-data', link);
  await assert.rejects(installFromSource(options), /Source escapes repository/);
  await fs.unlink(link);
  await fs.writeFile(path.join(options.source, 'secret.txt'), 'Excluded');
  await fs.symlink('../../secret.txt', link);
  await assert.rejects(installFromSource(options), /outside payload/);
  await fs.unlink(link);
  await fs.symlink('missing-file', link);
  await assert.rejects(installFromSource(options), { code: 'ENOENT' });
  await assert.rejects(fs.stat(options.target), { code: 'ENOENT' });
});

test('source secrets and runtime artifacts are excluded', async context => {
  const options = await fixture(context, true);
  for (const name of ['.env', 'credentials.json', 'private.key', 'output.log', '.DS_Store']) {
    await fs.writeFile(path.join(options.source, '.agents/skills', name), 'Not payload');
  }
  await installFromSource(options);
  for (const name of ['.env', 'credentials.json', 'private.key', 'output.log', '.DS_Store']) {
    await assert.rejects(fs.stat(path.join(options.target, '.agents/skills', name)), { code: 'ENOENT' });
  }
});

test('denied SSH access never writes target, suppresses raw errors and cleans clone temp', async context => {
  const options = await fixture(context);
  let cloneTemporary;
  await assert.rejects(initialize(options, async (command, argumentsList, execution) => {
    assert.equal(command, 'git');
    assert.equal(argumentsList.at(-2), 'git@github.com:0132E282/lumina-agent.git');
    cloneTemporary = path.dirname(argumentsList.at(-1));
    assert.equal(execution.env.GIT_TERMINAL_PROMPT, '0');
    assert.match(execution.env.GIT_SSH_COMMAND, /BatchMode=yes/);
    assert.equal(execution.timeout, 120_000);
    throw new Error('raw-sensitive-credential');
  }), error => /private repo/.test(error.message) && !error.message.includes('raw-sensitive-credential'));
  await assert.rejects(fs.stat(options.target), { code: 'ENOENT' });
  await assert.rejects(fs.stat(cloneTemporary), { code: 'ENOENT' });
});

test('each initialize authenticates even after a successful install', async context => {
  const options = await fixture(context);
  let calls = 0;
  const fakeGit = async (command, argumentsList) => {
    calls++;
    if (calls === 2) throw new Error('revoked');
    const clone = argumentsList.at(-1);
    await fs.mkdir(clone);
    for (const name of ['.agents', '.claude', '.codex', 'CONTRACT.md']) {
      await fs.cp(path.join(repository, name), path.join(clone, name), { recursive: true, verbatimSymlinks: true });
    }
  };
  await initialize(options, fakeGit);
  await assert.rejects(initialize(options, fakeGit), /private repo/);
  assert.equal(calls, 2);
  assert.ok(await fs.stat(path.join(options.target, 'CONTRACT.md')));
});

test('package contains CLI without configuration payload; npx resolves bin offline', async context => {
  const { temporary } = await fixture(context);
  const environment = { ...process.env, npm_config_cache: path.join(temporary, 'npm-cache') };
  const packed = await executeFile('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', temporary], { cwd: repository, env: environment });
  const [metadata] = JSON.parse(packed.stdout);
  const paths = metadata.files.map(file => file.path);
  assert.ok(paths.includes('bin/lumina-agent.mjs'));
  assert.ok(paths.every(filename => ['bin/lumina-agent.mjs', 'package.json', 'README.md', 'LICENSE'].includes(filename)));
  const result = await executeFile('npx', ['--offline', '--yes', `--package=${path.join(temporary, metadata.filename)}`, 'lumina-agent', '--help'], { env: environment });
  assert.match(result.stdout, /lumina-agent install/);
  const manifest = JSON.parse(await fs.readFile(path.join(repository, 'package.json'), 'utf8'));
  assert.equal(manifest.private, true);
  const fakeCommands = path.join(temporary, 'commands');
  await fs.mkdir(fakeCommands);
  const sentinel = path.join(temporary, 'git-invoked');
  await fs.writeFile(path.join(fakeCommands, 'git'), `#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(sentinel)}, 'called');\nconsole.error('raw-sensitive-credential');\nprocess.exit(1);\n`, { mode: 0o755 });
  const target = path.join(temporary, 'denied-project');
  const home = path.join(temporary, 'denied-home');
  for (const args of [['install', '--target', target], ['install', '--global']]) {
    await assert.rejects(executeFile('npx', ['--offline', '--yes', `--package=${path.join(temporary, metadata.filename)}`, 'lumina-agent', ...args], {
      env: { ...environment, HOME: home, PATH: `${fakeCommands}${path.delimiter}${process.env.PATH}` },
    }), error => /private repo/.test(error.stderr) && !error.stderr.includes('raw-sensitive-credential'));
  }
  assert.equal(await fs.readFile(sentinel, 'utf8'), 'called');
  await assert.rejects(fs.stat(target), { code: 'ENOENT' });
  await assert.rejects(fs.stat(path.join(home, '.claude/settings.json')), { code: 'ENOENT' });
});
