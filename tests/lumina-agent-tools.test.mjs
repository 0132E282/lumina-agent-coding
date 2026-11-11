import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { availableTools, installFromSource, installTools, parseArguments } from '../bin/lumina-agent.mjs';

const repository = fileURLToPath(new URL('../', import.meta.url));
const locations = { cwd: '/project', home: '/home/user' };
const mcpAdd = ['mcp', 'add', '--scope', 'user', 'markitdown', '--', 'uvx', '--python', '3.13', 'markitdown-mcp'];
const graphifyFiles = ['.agents/skills/workflow-graphify/SKILL.md', '.agents/rules/graphify.md', '.claude/commands/graphify.md'];
const markitdownFile = '.agents/skills/markitdown/SKILL.md';

function harness({ present = [], mcpList = '', failing = [] } = {}) {
  const calls = [];
  const logs = [];
  const warnings = [];
  return {
    calls,
    logs,
    warnings,
    options: {
      exists: async name => present.includes(name),
      run: async (command, args) => {
        calls.push([command, ...args]);
        if (failing.includes(command)) throw new Error(`${command} failed\nmore detail`);
        return { stdout: command === 'claude' && args[1] === 'list' ? mcpList : '' };
      },
      log: message => logs.push(message),
      warn: message => warnings.push(message),
    },
  };
}

async function exists(filename) {
  try {
    await fs.lstat(filename);
    return true;
  } catch {
    return false;
  }
}

async function install(context, options) {
  const temporary = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'lumina-tools-')));
  context.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const target = path.join(temporary, 'project');
  const result = await installFromSource({ source: repository, target, ...options });
  return { target, result };
}

test('no tools are installed when none are selected', async () => {
  const { calls, logs, options } = harness({ present: ['uv', 'claude'] });
  await installTools({ ...options, tools: [] });
  assert.deepEqual(calls, []);
  assert.deepEqual(logs, []);
});

test('skips CLIs that are already installed', async () => {
  const { calls, logs, options } = harness({ present: ['uv', 'graphify', 'markitdown'] });
  await installTools({ ...options, tools: ['graphify', 'markitdown'], agents: ['codex'] });
  assert.deepEqual(calls, []);
  assert.equal(logs.filter(line => line.includes('already installed')).length, 2);
});

test('installs only the selected CLI with uv argument arrays', async () => {
  const { calls, options } = harness({ present: ['uv', 'claude'] });
  await installTools({ ...options, tools: ['graphify'], agents: ['claude'] });
  assert.deepEqual(calls, [['uv', 'tool', 'install', 'graphifyy']]);
});

test('falls back to pipx when uv is missing', async () => {
  const { calls, options } = harness({ present: ['pipx'] });
  await installTools({ ...options, tools: ['graphify', 'markitdown'], agents: ['codex'] });
  assert.deepEqual(calls, [['pipx', 'install', 'graphifyy'], ['pipx', 'install', 'markitdown[all]']]);
});

test('tells the user to install uv or pipx when neither exists', async () => {
  const { calls, warnings, logs, options } = harness();
  await installTools({ ...options, tools: ['graphify', 'markitdown'], agents: ['claude'] });
  assert.deepEqual(calls, []);
  assert.equal(warnings.length, 2);
  assert.ok(warnings.every(line => line.includes('install uv or pipx first')));
  assert.ok(logs.some(line => line.includes('claude mcp add --scope user markitdown -- uvx --python 3.13 markitdown-mcp')));
});

test('a failed install warns and continues to the next tool', async () => {
  const { calls, warnings, options } = harness({ present: ['uv', 'claude'], failing: ['uv'] });
  await installTools({ ...options, tools: ['graphify', 'markitdown'], agents: ['claude'] });
  assert.equal(warnings.filter(line => line.includes('could not install')).length, 2);
  assert.deepEqual(calls.at(-1), ['claude', ...mcpAdd]);
});

test('registers the MCP server only for markitdown with claude selected', async () => {
  const present = ['uv', 'graphify', 'markitdown', 'claude'];
  const registered = harness({ present, mcpList: 'other: npx foo - Connected\n' });
  await installTools({ ...registered.options, tools: ['markitdown'], agents: ['claude'] });
  assert.deepEqual(registered.calls, [['claude', 'mcp', 'list'], ['claude', ...mcpAdd]]);
  for (const [tools, agents] of [[['graphify'], ['claude']], [['markitdown'], ['codex']]]) {
    const skipped = harness({ present });
    await installTools({ ...skipped.options, tools, agents });
    assert.deepEqual(skipped.calls, []);
  }
});

test('does not register the MCP server again when already listed', async () => {
  const { calls, logs, options } = harness({ present: ['markitdown', 'claude'], mcpList: 'markitdown: uvx markitdown-mcp - Connected\n' });
  await installTools({ ...options, tools: ['markitdown'], agents: ['claude'] });
  assert.deepEqual(calls, [['claude', 'mcp', 'list']]);
  assert.ok(logs.some(line => line.includes('already registered')));
});

test('a failing claude command warns instead of throwing', async () => {
  const { warnings, options } = harness({ present: ['markitdown', 'claude'], failing: ['claude'] });
  await installTools({ ...options, tools: ['markitdown'], agents: ['claude'] });
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /could not register markitdown MCP server/);
});

test('--tool is repeatable, validated and conflicts with --skip-tools', () => {
  assert.deepEqual(parseArguments(['install'], locations).tools, []);
  assert.deepEqual(parseArguments(['install', '--tool', 'graphify', '--tool', 'MarkItDown'], locations).tools, ['graphify', 'markitdown']);
  assert.deepEqual(parseArguments(['install', '--skip-tools'], locations).tools, []);
  assert.throws(() => parseArguments(['install', '--tool', 'nope'], locations), /Invalid tool: nope/);
  assert.throws(() => parseArguments(['install', '--tool', 'graphify', '--tool', 'graphify'], locations), /Duplicate tool: graphify/);
  assert.throws(() => parseArguments(['install', '--tool', 'graphify', '--skip-tools'], locations), /Cannot combine --skip-tools with --tool/);
  assert.throws(() => parseArguments(['install', '--skip-tools', '--skip-tools'], locations), /Duplicate option/);
});

test('install tool subcommand is parsed; other commands stay unsupported', () => {
  const options = parseArguments(['install', 'tool', '--agent', 'claude', '--tool', 'graphify', '--dry-run'], locations);
  assert.equal(options.toolsOnly, true);
  assert.deepEqual(options.agents, ['claude']);
  assert.deepEqual(options.tools, ['graphify']);
  assert.equal(options.dryRun, true);
  assert.equal(parseArguments(['install'], locations).toolsOnly, undefined);
  assert.throws(() => parseArguments(['install', 'tool', '--skip-tools'], locations), /install tool/);
  assert.throws(() => parseArguments(['tool'], locations), /Only the install command/);
});

test('tool list is filtered by the selected agents', () => {
  const labels = agents => availableTools(agents).map(tool => `${tool.name}: ${tool.hint}`);
  assert.deepEqual(labels(['claude']), ['graphify: adds skill, rule, command, CLI', 'markitdown: adds skill, CLI, MCP']);
  assert.deepEqual(labels(['codex']), ['graphify: adds skill, rule, CLI', 'markitdown: adds skill, CLI']);
});

test('payload excludes tool files unless the tool is selected', async context => {
  const { target } = await install(context, { agents: ['claude'] });
  for (const file of [...graphifyFiles, markitdownFile]) assert.equal(await exists(path.join(target, file)), false, file);
  assert.equal(await exists(path.join(target, '.agents/rules/git.md')), true);
});

test('selecting graphify adds only graphify files; markitdown only its skill', async context => {
  const graphify = await install(context, { agents: ['claude'], tools: ['graphify'] });
  for (const file of graphifyFiles) assert.equal(await exists(path.join(graphify.target, file)), true, file);
  assert.equal(await exists(path.join(graphify.target, markitdownFile)), false);
  const markitdown = await install(context, { agents: ['claude'], tools: ['markitdown'] });
  assert.equal(await exists(path.join(markitdown.target, markitdownFile)), true);
  for (const file of graphifyFiles) assert.equal(await exists(path.join(markitdown.target, file)), false, file);
});

test('dry-run change count reflects the selected tools', async context => {
  const none = await install(context, { agents: ['claude'], dryRun: true });
  const both = await install(context, { agents: ['claude'], dryRun: true, tools: ['graphify', 'markitdown'] });
  assert.ok(both.result.changes > none.result.changes);
});

test('the claude command file is skipped when claude is not selected', async context => {
  const { target } = await install(context, { agents: ['codex'], tools: ['graphify'] });
  assert.equal(await exists(path.join(target, '.agents/rules/graphify.md')), true);
  assert.equal(await exists(path.join(target, '.claude/commands/graphify.md')), false);
});

test('install tool copies only the chosen tool files, no base files', async context => {
  const { target } = await install(context, { agents: ['claude'], tools: ['markitdown'], toolsOnly: true });
  assert.equal(await exists(path.join(target, markitdownFile)), true);
  assert.equal(await exists(path.join(target, '.agents/rules/git.md')), false);
  assert.equal(await exists(path.join(target, 'CLAUDE.md')), false);
  assert.equal(await exists(path.join(target, '.claude/settings.json')), false);
});
