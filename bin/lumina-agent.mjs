#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { constants } from 'node:fs';
import * as fs from 'node:fs/promises';
import readline from 'node:readline';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const executeFile = promisify(execFile);
const repository = 'git@github.com:0132E282/lumina-agent.git';
const payloadRoots = [
  '.agents/rules', '.agents/skills', '.agents/agents', '.agents/commands', '.agents/hooks',
  '.claude/agents', '.claude/commands', '.claude/hooks', '.claude/rules', '.claude/skills',
  '.claude/settings.json', '.codex/agents', '.codex/rules', '.codex/skills', 'CONTRACT.md',
];
const runtimes = ['codex', 'claude', 'antigravity'];
const runtimeLabels = { codex: 'Codex', claude: 'Claude Code', antigravity: 'Antigravity' };
const sharedPayloadRoots = ['.agents/rules', '.agents/skills', 'CONTRACT.md'];
const startMarker = '<!-- lumina-agent:start -->';
const endMarker = '<!-- lumina-agent:end -->';
const instructionBlock = `${startMarker}
## Lumina agent framework

- Keep project-specific instructions; Lumina content adds workflow and does not change stack/UI/contract.
- Read [CONTRACT.md](./CONTRACT.md) before working; before coding read all rules in [.agents/rules/](./.agents/rules/), apply only the relevant parts.
- Skills use the shared source [.agents/skills/](./.agents/skills/). Claude uses commands directly /review, /git, /cleanup; for planning use Plan mode combined with the workflow-plan skill. Codex uses $workflow-..., Antigravity uses /workflow-... per the actual runtime.
- When implementing, follow common rules and delegate to the coding-agent role; read the full role docs in [.claude/agents/](./.claude/agents/) before executing. Codex adapters are in [.codex/agents/](./.codex/agents/).
- On task completion with concrete results: use the report skill; for data-dependent code use complexity-performance before reporting. Real databases are read-only by default.
- Commit/push/deploy only when explicitly requested. Use available formatter/linter/test; do not install packages just to check.
- Claude hooks are configured in .claude/settings.json; Codex and Antigravity do not run Claude hooks automatically. Do not report a hook/tool as run when it has not executed.
- Keep .agents/, .claude/, .codex/ paths together so relative symlinks and references remain valid.
${endMarker}`;

async function lstatOptional(filename) {
  try {
    return await fs.lstat(filename);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function within(root, filename) {
  const relative = path.relative(root, filename);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function excluded(name) {
  return /^(?:\.git|\.DS_Store|storage|logs?|node_modules|__pycache__|\.cache|\.env(?:\..*)?|credentials(?:\..*)?|id_rsa|id_ed25519)$/i.test(name)
    || /\.(?:log|pem|key|pyc)$/i.test(name);
}

async function assertDirectories(filename) {
  const ancestors = [];
  for (let current = filename; ; current = path.dirname(current)) {
    ancestors.push(current);
    if (current === path.dirname(current)) break;
  }
  for (const ancestor of ancestors.reverse()) {
    const status = await lstatOptional(ancestor);
    if (status && !status.isDirectory()) {
      throw new Error(`Path must be a real directory, not a symlink: ${ancestor}`);
    }
  }
}

async function collectPayload(source) {
  const entries = new Map();
  async function visit(relative) {
    const filename = path.join(source, relative);
    const status = await fs.lstat(filename);
    if (!within(source, await fs.realpath(filename))) throw new Error(`Source escapes repository: ${relative}`);
    if (status.isSymbolicLink()) {
      const link = await fs.readlink(filename);
      if (path.isAbsolute(link)) throw new Error(`Source link must be relative: ${relative}`);
      entries.set(relative, { relative, kind: 'link', link });
    } else if (status.isDirectory()) {
      entries.set(relative, { relative, kind: 'directory' });
      for (const name of await fs.readdir(filename)) {
        if (!excluded(name)) await visit(path.join(relative, name));
      }
    } else if (status.isFile()) {
      entries.set(relative, { relative, kind: 'file', content: await fs.readFile(filename), mode: status.mode & 0o777 });
    } else {
      throw new Error(`Source is not a file/directory/link: ${relative}`);
    }
  }
  for (const relative of payloadRoots) {
    await assertDirectories(path.dirname(path.join(source, relative)));
    await visit(relative);
  }
  for (const entry of entries.values()) {
    if (entry.kind !== 'link') continue;
    const destination = path.resolve(source, path.dirname(entry.relative), entry.link);
    const resolved = await fs.realpath(path.join(source, entry.relative));
    if (!entries.has(path.relative(source, destination)) || !entries.has(path.relative(source, resolved))) {
      throw new Error(`Source link points outside payload: ${entry.relative}`);
    }
  }
  return entries;
}

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be a JSON object`);
  return value;
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function hookGroups(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  for (const group of value) {
    object(group, label);
    if (!Array.isArray(group.hooks)) throw new Error(`${label}.hooks must be an array`);
    for (const hook of group.hooks) object(hook, label);
  }
  return value;
}

function parseSettings(content, label) {
  try {
    return JSON.parse(content.toString('utf8'));
  } catch {
    throw new Error(`${label}: invalid JSON`);
  }
}

const repositoryRelativeHook = /^(bash|node) "\$\(git rev-parse --show-toplevel\)\/\.agents\/hooks\/scripts\/([^"$`\\]+)"$/;

function absoluteHookCommand(command, target) {
  const match = repositoryRelativeHook.exec(command);
  if (!match) return command;
  const filename = path.join(target, '.claude/hooks/scripts', match[2]);
  return `${match[1]} '${filename.replaceAll("'", "'\\''")}'`;
}

class InstallConflictError extends Error {
  constructor(relative) {
    super(`Conflict at ${relative}`);
    this.name = 'InstallConflictError';
    this.relative = relative;
  }
}

function mergeSettings(existing, incoming, { overwrite = false } = {}) {
  const merged = Object.assign(Object.create(null), object(existing, 'Existing settings'));
  for (const [key, value] of Object.entries(object(incoming, 'Source settings'))) {
    if (key === 'hooks') continue;
    if (Object.hasOwn(merged, key) && canonical(merged[key]) !== canonical(value) && !overwrite) {
      throw new InstallConflictError(`.claude/settings.json (${key})`);
    }
    merged[key] = value;
  }
  const hooks = Object.assign(Object.create(null), object(existing.hooks ?? {}, 'Existing hooks'));
  for (const [event, additions] of Object.entries(object(incoming.hooks ?? {}, 'Source hooks'))) {
    const groups = structuredClone(hookGroups(hooks[event] ?? [], event));
    const groupIndex = new Map();
    for (const group of groups) {
      const { hooks: commands, ...metadata } = group;
      const key = canonical(metadata);
      if (!groupIndex.has(key)) groupIndex.set(key, { group, commands: new Set(commands.map(canonical)) });
    }
    for (const addition of hookGroups(additions, event)) {
      const { hooks: commands, ...metadata } = addition;
      const key = canonical(metadata);
      if (!groupIndex.has(key)) {
        const group = { ...metadata, hooks: [] };
        groups.push(group);
        groupIndex.set(key, { group, commands: new Set() });
      }
      const indexed = groupIndex.get(key);
      for (const command of commands) {
        const serialized = canonical(command);
        if (indexed.commands.has(serialized)) continue;
        indexed.group.hooks.push(command);
        indexed.commands.add(serialized);
      }
    }
    hooks[event] = groups;
  }
  merged.hooks = hooks;
  return Buffer.from(`${JSON.stringify(merged, null, 2)}\n`);
}

function appendInstructions(existing, relative, block = instructionBlock, { overwrite = false } = {}) {
  const text = existing.toString('utf8');
  if (text.includes(startMarker) || text.includes(endMarker)) {
    const start = text.indexOf(startMarker);
    const end = text.indexOf(endMarker);
    const hasSinglePair = start >= 0 && end > start
      && text.indexOf(startMarker, start + startMarker.length) < 0
      && text.indexOf(endMarker, end + endMarker.length) < 0;
    if (!hasSinglePair || !text.includes(block)) {
      if (!overwrite) throw new InstallConflictError(relative);
      return Buffer.from(`${text.slice(0, Math.max(0, start))}${block}${end >= 0 ? text.slice(end + endMarker.length) : '\n'}`);
    }
    return existing;
  }
  return Buffer.from(`${text}${text.length ? (text.endsWith('\n') ? '\n' : '\n\n') : ''}${block}\n`);
}

async function preflight(target, entries, { overwrite = false } = {}) {
  const changes = [];
  for (const entry of entries.values()) {
    const filename = path.join(target, entry.relative);
    await assertDirectories(path.dirname(filename));
    const status = await lstatOptional(filename);
    if (entry.kind === 'directory') {
      if (status && !status.isDirectory()) throw new Error(`Directory conflict: ${entry.relative}`);
      if (!status) changes.push(entry);
      continue;
    }
    if (entry.kind === 'link') {
      if (status && (!status.isSymbolicLink() || await fs.readlink(filename) !== entry.link)) {
        if (!overwrite) throw new InstallConflictError(entry.relative);
        changes.push({ ...entry, replace: true });
        continue;
      }
      if (!status) changes.push(entry);
      continue;
    }
    if (status && !status.isFile()) throw new Error(`File conflict: ${entry.relative}`);
    const existing = status ? await fs.readFile(filename) : Buffer.alloc(0);
    let content = entry.content;
    if (entry.instructions) content = appendInstructions(existing, entry.relative, entry.block, { overwrite });
    else if (entry.relative === '.claude/settings.json') {
      content = mergeSettings(status ? parseSettings(existing, 'Existing settings') : {}, parseSettings(content, 'Source settings'), { overwrite });
    } else if (status && !existing.equals(content)) {
      if (!overwrite) throw new InstallConflictError(entry.relative);
    }
    if (!status || !existing.equals(content)) changes.push({ ...entry, content, existing: status ? existing : null });
  }
  return changes;
}

export async function installFromSource({ source, target, dryRun = false, global = false, overwrite = false, agents = global ? ['codex', 'claude'] : runtimes }) {
  source = await fs.realpath(source);
  target = path.resolve(target);
  await assertDirectories(target);
  const allEntries = await collectPayload(source);
  const selected = new Set(agents);
  const roots = [...sharedPayloadRoots];
  if (selected.has('claude')) roots.push(
    '.agents/agents', '.agents/commands', '.agents/hooks',
    '.claude/agents', '.claude/commands', '.claude/hooks', '.claude/rules', '.claude/skills', '.claude/settings.json',
  );
  if (selected.has('codex')) roots.push(
    '.agents/agents', '.codex/agents', '.codex/rules', '.codex/skills', '.claude/agents',
  );
  for (const relative of allEntries.keys()) {
    if (!roots.some(root => relative === root || relative.startsWith(`${root}/`))) allEntries.delete(relative);
  }
  // ! Global mode bỏ .claude/rules — Claude tự nạp ~/.claude/rules, trùng với .claude/rules của project (rule bị nạp hai lần).
  if (global) allEntries.delete('.claude/rules');
  const entries = allEntries;
  let block = instructionBlock;
  if (global) {
    block = instructionBlock.replace(/\]\(\.\/([^)]*)\)/g, (_, relative) => `](<${path.join(target, relative)}>)`);
    const settingsEntry = entries.get('.claude/settings.json');
    if (settingsEntry) {
      const settings = object(parseSettings(settingsEntry.content, 'Source settings'), 'Source settings');
      for (const [event, groups] of Object.entries(object(settings.hooks ?? {}, 'Source hooks'))) {
        for (const group of hookGroups(groups, event)) {
          for (const hook of group.hooks) {
            if (hook.type === 'command' && typeof hook.command === 'string') hook.command = absoluteHookCommand(hook.command, target);
            if (hook.type === 'command' && typeof hook.command === 'string' && hook.command.startsWith('bash .claude/hooks/')) {
              const filename = path.join(target, hook.command.slice(5));
              hook.command = `bash '${filename.replaceAll("'", "'\\''")}'`;
            }
          }
        }
      }
      settingsEntry.content = Buffer.from(`${JSON.stringify(settings, null, 2)}\n`);
    }
  }
  const instructionPaths = global
    ? [selected.has('codex') && '.codex/AGENTS.md', selected.has('claude') && '.claude/CLAUDE.md', selected.has('antigravity') && 'AGENTS.md']
    : [selected.has('codex') && 'AGENTS.md', selected.has('antigravity') && 'AGENTS.md', selected.has('claude') && 'CLAUDE.md'];
  for (const relative of new Set(instructionPaths.filter(Boolean))) {
    entries.set(relative, { relative, kind: 'file', instructions: true, block, mode: 0o644 });
  }
  const changes = await preflight(target, entries, { overwrite });
  if (dryRun) return { target, changes: changes.length, dryRun };
  await fs.mkdir(target, { recursive: true });
  for (const entry of changes) {
    const filename = path.join(target, entry.relative);
    await assertDirectories(path.dirname(filename));
    if (entry.kind === 'directory') {
      await fs.mkdir(filename, { recursive: true });
    } else {
      await fs.mkdir(path.dirname(filename), { recursive: true });
      if (entry.kind === 'link') {
        if (entry.replace) await fs.unlink(filename);
        await fs.symlink(entry.link, filename);
      } else if (entry.existing === null) {
        await fs.writeFile(filename, entry.content, { flag: 'wx', mode: entry.mode });
      } else {
        const handle = await fs.open(filename, constants.O_RDWR | constants.O_NOFOLLOW);
        try {
          const status = await handle.stat();
          if (!status.isFile() || !(await handle.readFile()).equals(entry.existing)) {
            throw new Error(`Target changed after preflight: ${entry.relative}`);
          }
          await handle.truncate(0);
          let offset = 0;
          while (offset < entry.content.length) {
            const { bytesWritten } = await handle.write(entry.content, offset, entry.content.length - offset, offset);
            if (bytesWritten === 0) throw new Error(`Could not write file: ${entry.relative}`);
            offset += bytesWritten;
          }
        } finally {
          await handle.close();
        }
      }
    }
  }
  return { target, changes: changes.length, dryRun };
}

export async function initialize({ target, dryRun = false, global = false, overwrite = false, agents = global ? ['codex', 'claude'] : runtimes }, runGit = executeFile) {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'lumina-agent-'));
  try {
    const source = path.join(temporary, 'source');
    try {
      await runGit('git', ['clone', '--depth', '1', '--', repository, source], {
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_SSH_COMMAND: 'ssh -o BatchMode=yes -o ConnectTimeout=15' },
        timeout: 120_000,
        maxBuffer: 1024 * 1024,
      });
    } catch {
      throw new Error('Could not read private repository. Check collaborator access, Git, and SSH key authorization for GitHub; clone timeout is 120 seconds.');
    }
    return await installFromSource({ source, target, dryRun, global, overwrite, agents });
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
}

export function parseArguments(argumentsList, { cwd = process.cwd(), home = os.homedir() } = {}) {
  if (argumentsList[0] === '--help' || argumentsList[0] === '-h') return null;
  if (argumentsList.length > 0 && argumentsList[0] !== 'install') throw new Error('Only the install command is supported. Use --help to see usage.');
  const options = { target: cwd, dryRun: false, global: false, agents: [] };
  const seen = new Set();
  for (let index = 1; index < argumentsList.length; index++) {
    const argument = argumentsList[index];
    if (argument === '--agent' && argumentsList[index + 1] && !argumentsList[index + 1].startsWith('--')) {
      const agent = argumentsList[++index].toLowerCase();
      if (!runtimes.includes(agent)) throw new Error(`Invalid agent: ${agent}. Choose codex, claude, or antigravity.`);
      if (options.agents.includes(agent)) throw new Error(`Duplicate agent: ${agent}`);
      options.agents.push(agent);
      continue;
    }
    if (seen.has(argument)) throw new Error(`Duplicate option: ${argument}`);
    seen.add(argument);
    if (argument === '--dry-run') options.dryRun = true;
    else if (argument === '--global') options.global = true;
    else if (argument === '--target' && argumentsList[index + 1] && !argumentsList[index + 1].startsWith('--')) {
      options.target = argumentsList[++index];
    } else throw new Error(`Invalid option: ${argument}`);
  }
  if (options.global && seen.has('--target')) throw new Error('Cannot combine --global with --target.');
  if (options.global && options.agents.includes('antigravity')) throw new Error('Antigravity only supports project-level install; remove --global or remove --agent antigravity.');
  if (options.global) options.target = home;
  if (options.agents.length === 0) options.agents = options.global ? ['codex', 'claude'] : runtimes;
  return options;
}

function renderPrompt(output, lines, previousLineCount) {
  const prefix = previousLineCount ? `\u001b[${previousLineCount}A` : '';
  output.write(`${prefix}${lines.map(line => `\u001b[2K\r${line}`).join('\n')}\n`);
  return lines.length;
}

function clearPrompt(output, lineCount) {
  output.write(`\u001b[${lineCount}A\u001b[0J`);
}

function drainInput(input) {
  if (typeof input.read !== 'function') return;
  while (input.read() !== null) {}
}

function cleanupPrompt(input, output, onKeypress, { lineCount, erase = false, appendNewline = true }) {
  input.removeListener('keypress', onKeypress);
  if (typeof input.pause === 'function') input.pause();
  drainInput(input);
  input.setRawMode(false);
  if (erase && lineCount > 0) clearPrompt(output, lineCount);
  else if (appendNewline) output.write('\n');
}

export async function withProgress(task, output = process.stdout) {
  if (!output.isTTY || typeof output.write !== 'function') return task();
  const totalWidth = Math.max(3, (output.columns ?? 3) - 2);
  const trackWidth = totalWidth - 2;
  const progress = 65;
  const render = () => {
    const filledWidth = Math.round(trackWidth * progress / 100);
    const bar = `${'█'.repeat(filledWidth)}${'░'.repeat(trackWidth - filledWidth)}`;
    output.write(`\r\u001b[2K[${bar}]`);
  };
  const clear = () => output.write('\r\u001b[2K');
  output.write('\u001b[?25l');
  render();
  try {
    return await task();
  } finally {
    clear();
    output.write('\u001b[?25h');
  }
}

function promptCheckboxes(input, output, {
  choices,
  title,
  description = '',
  footer = '',
  actions = [],
  minimum = 0,
  cancelMessage,
  eraseOnConfirm = true,
}) {
  if (!input.isTTY || !output.isTTY || typeof input.setRawMode !== 'function') {
    return Promise.resolve(choices.filter(choice => choice.selected).map(choice => choice.value));
  }
  let activeIndex = 0;
  let message = '';
  let renderedLineCount = 0;
  const render = () => {
    const items = choices.map((choice, index) => {
      const cursor = index === activeIndex ? '\u001b[32m❯\u001b[0m' : ' ';
      const checkbox = `[${choice.selected ? 'x' : ' '}]`;
      const label = choice.label.padEnd(12);
      const hint = choice.hint ? `  \u001b[2m${choice.hint}\u001b[0m` : '';
      return `${cursor} ${checkbox} ${label}${hint}`;
    });
    const lines = [title, description ? `\u001b[2m${description}\u001b[0m` : '', '', ...items];
    if (footer) lines.push('', footer);
    if (actions.length > 0) {
      const actionLine = actions.map((action, index) => {
        const actionIndex = choices.length + index;
        const cursor = actionIndex === activeIndex ? '\u001b[32m❯\u001b[0m' : ' ';
        return `${cursor} [ ${action.label} ]`;
      }).join('   ');
      lines.push('', actionLine);
    }
    if (message) lines.push(message);
    renderedLineCount = renderPrompt(output, lines, renderedLineCount);
  };
  render();
  input.setRawMode(true);
  input.resume();
  return new Promise((resolve, reject) => {
    const onKeypress = (character, key = {}) => {
      if (key.ctrl && key.name === 'c' || key.name === 'escape') {
        cleanupPrompt(input, output, onKeypress, { lineCount: renderedLineCount, appendNewline: true });
        reject(new Error(cancelMessage));
        return;
      }
      const focusableCount = choices.length + actions.length;
      if (key.name === 'up') activeIndex = (activeIndex + focusableCount - 1) % focusableCount;
      else if (key.name === 'down') activeIndex = (activeIndex + 1) % focusableCount;
      else if ((key.name === 'space' || character === ' ') && activeIndex < choices.length) {
        choices[activeIndex].selected = !choices[activeIndex].selected;
      } else if (key.name === 'return' || key.name === 'enter') {
        const action = actions[activeIndex - choices.length];
        if (action?.cancel) {
          cleanupPrompt(input, output, onKeypress, { lineCount: renderedLineCount, appendNewline: true });
          reject(new Error(cancelMessage));
          return;
        }
        const selected = choices.filter(choice => choice.selected);
        if (selected.length < minimum) {
          message = 'Select at least one agent.';
          render();
          return;
        }
        cleanupPrompt(input, output, onKeypress, {
          lineCount: renderedLineCount,
          erase: eraseOnConfirm,
          appendNewline: eraseOnConfirm,
        });
        resolve(selected.map(choice => choice.value));
        return;
      } else return;
      render();
    };
    input.on('keypress', onKeypress);
  });
}

function truncateText(value, maximumLength) {
  if (maximumLength === null || value.length <= maximumLength) return value;
  if (maximumLength <= 0) return '';
  if (maximumLength === 1) return '…';
  const headLength = Math.ceil((maximumLength - 1) / 2);
  const tailLength = maximumLength - headLength - 1;
  return `${value.slice(0, headLength)}…${tailLength > 0 ? value.slice(-tailLength) : ''}`;
}

function promptList(input, output, { choices, title, description = '', cancelMessage }) {
  if (!input.isTTY || !output.isTTY || typeof input.setRawMode !== 'function') {
    const defaultChoice = choices.find(c => c.selected) ?? choices[0];
    return Promise.resolve(defaultChoice.value);
  }
  let activeIndex = Math.max(0, choices.findIndex(c => c.selected));
  let renderedLineCount = 0;
  const render = () => {
    const items = choices.map((choice, index) => {
      const cursor = index === activeIndex ? '\u001b[32m❯\u001b[0m' : ' ';
      const label = choice.label.padEnd(8);
      const terminalColumns = Number.isInteger(output.columns) && output.columns > 0 ? output.columns : null;
      const availableHintLength = terminalColumns === null
        ? null
        : Math.max(0, terminalColumns - 1 - 2 - label.length - 2);
      const hintText = choice.hint && availableHintLength !== 0
        ? truncateText(choice.hint, availableHintLength)
        : '';
      const hint = hintText ? `  \u001b[2m${hintText}\u001b[0m` : '';
      return `${cursor} ${label}${hint}`;
    });
    const lines = [title, description ? `\u001b[2m${description}\u001b[0m` : '', '', ...items];
    renderedLineCount = renderPrompt(output, lines, renderedLineCount);
  };
  render();
  input.setRawMode(true);
  input.resume();
  return new Promise((resolve, reject) => {
    const onKeypress = (character, key = {}) => {
      if (key.ctrl && key.name === 'c' || key.name === 'escape') {
        cleanupPrompt(input, output, onKeypress, { lineCount: renderedLineCount, appendNewline: true });
        reject(new Error(cancelMessage));
        return;
      }
      if (key.name === 'up') activeIndex = (activeIndex + choices.length - 1) % choices.length;
      else if (key.name === 'down') activeIndex = (activeIndex + 1) % choices.length;
      else if (key.name === 'return' || key.name === 'enter') {
        cleanupPrompt(input, output, onKeypress, { lineCount: renderedLineCount, erase: true });
        resolve(choices[activeIndex].value);
        return;
      } else return;
      render();
    };
    input.on('keypress', onKeypress);
  });
}

export function promptAgents(input = process.stdin, output = process.stdout, { global = false } = {}) {
  const available = global ? runtimes.slice(0, 2) : runtimes;
  const note = global ? '  ·  Antigravity is project-only' : '';
  return promptCheckboxes(input, output, {
    choices: available.map(runtime => ({ value: runtime, label: runtimeLabels[runtime], selected: true })),
    title: 'Select agents to install',
    description: `↑/↓ move · Space toggle · Enter confirm${note}`,
    footer: 'Ctrl+C để thoát',
    actions: [
      { label: 'Install' },
      { label: 'Cancel', cancel: true },
    ],
    minimum: 1,
    cancelMessage: 'Agent selection cancelled.',
    eraseOnConfirm: false,
  });
}

export function promptInstallScope(input = process.stdin, output = process.stdout, { project = process.cwd() } = {}) {
  return promptList(input, output, {
    choices: [
      { value: false, label: 'Project', hint: project, selected: true },
      { value: true, label: 'Global', hint: '~/' },
    ],
    title: 'Select install scope',
    description: '↑/↓ move · Enter confirm',
    cancelMessage: 'Install scope selection cancelled.',
  });
}

function promptOverwrite(input = process.stdin, output = process.stdout, relative) {
  if (!input.isTTY || !output.isTTY) return Promise.resolve(false);
  const reader = readline.createInterface({ input, output });
  return new Promise(resolve => {
    reader.question(`Conflict at ${relative}. Overwrite? [y/N] `, answer => {
      reader.close();
      resolve(/^y(?:es)?$/i.test(answer.trim()));
    });
  });
}

if (process.argv[1] && await fs.realpath(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.stdout.isTTY) {
      const banner = process.stdout.columns && process.stdout.columns < 60
        ? '\n  ✦  L U M I N A   A G E N T  ✦\n\n'
        : '\n██╗     ██╗   ██╗███╗   ███╗██╗███╗   ██╗ █████╗\n██║     ██║   ██║████╗ ████║██║████╗  ██║██╔══██╗\n██║     ██║   ██║██╔████╔██║██║██╔██╗ ██║███████║\n██║     ██║   ██║██║╚██╔╝██║██║██║╚██╗██║██╔══██║\n███████╗╚██████╔╝██║ ╚═╝ ██║██║██║ ╚████║██║  ██║\n╚══════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝\n\n                   A G E N T\n';
      process.stdout.write(`\x1b[1;36m${banner}\x1b[0m\n`);
    }
    const argumentsList = process.argv.slice(2);
    const options = parseArguments(argumentsList);
    if (!options) console.log('lumina-agent install [--agent codex|claude|antigravity ...] [--global | --target <project-directory>] [--dry-run]\nRun install without scope or agent flags to choose the install scope and agents interactively. Use --agent with --target or --global to skip prompts. If a conflict is found, the installer asks before overwriting.\nRequires Node.js >=20, Git, and SSH read access to the private GitHub repository.');
    else {
      if (process.stdin.isTTY && process.stdout.isTTY) {
        readline.emitKeypressEvents(process.stdin);
        if (!argumentsList.includes('--global') && !argumentsList.includes('--target')) {
          options.global = await promptInstallScope(process.stdin, process.stdout, { project: process.cwd() });
          if (options.global) options.target = os.homedir();
        }
        if (!argumentsList.includes('--agent')) options.agents = await promptAgents(process.stdin, process.stdout, { global: options.global });
        if (options.global && options.agents.includes('antigravity')) {
          throw new Error('Antigravity only supports project-level install; remove --global or remove --agent antigravity.');
        }
      }
      let result;
      try {
        result = await withProgress(() => initialize(options));
      } catch (error) {
        if (!(error instanceof InstallConflictError)) throw error;
        const confirmed = await promptOverwrite(process.stdin, process.stdout, error.relative);
        if (!confirmed) throw new Error(`Installation cancelled; existing ${error.relative} was not overwritten.`);
        result = await withProgress(() => initialize({ ...options, overwrite: true }));
      }
      console.log(`${result.dryRun ? 'Dry run' : 'Installed'}: ${result.changes} change(s) at ${result.target}`);
    }
  } catch (error) {
    console.error(`Lumina: ${error.message}`);
    process.exitCode = 1;
  }
}
