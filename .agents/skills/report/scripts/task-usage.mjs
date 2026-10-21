#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const help = `Usage: node task-usage.mjs --transcript FILE [--since-line N] [--criteria FILE]
Reads a Claude transcript JSONL and prints JSON:
{usage:{input,output,cacheRead,cacheCreate,messages}, waste:[{rule,evidence,count}], lastLine}
Only lines after --since-line are measured (default 0 = whole file). Latest usage per
message.id is kept; subagent records are skipped. Thresholds come from --criteria
(default: ../assets/waste-criteria.json). Missing/unreadable transcript exits 1 with no stdout.
`;

const defaultCriteria = fileURLToPath(new URL('../assets/waste-criteria.json', import.meta.url));
const subagentToolNames = new Set(['Agent', 'Task']);

function parseArguments(argumentsList) {
  const options = { sinceLine: 0, criteria: defaultCriteria };
  const names = { '--transcript': 'transcript', '--since-line': 'sinceLine', '--criteria': 'criteria' };
  for (let index = 0; index < argumentsList.length; index += 2) {
    const name = names[argumentsList[index]];
    const value = argumentsList[index + 1];
    if (!name || value === undefined) throw new Error('Unknown option or missing value; use --help.');
    options[name] = value;
  }
  options.sinceLine = Number(options.sinceLine);
  if (!options.transcript) throw new Error('--transcript is required.');
  if (!Number.isSafeInteger(options.sinceLine) || options.sinceLine < 0) throw new Error('--since-line must be a nonnegative integer.');
  return options;
}

function count(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function truncate(text) {
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

function resultLength(content) {
  if (typeof content === 'string') return content.length;
  if (!Array.isArray(content)) return 0;
  return content.reduce((total, part) => total + (typeof part?.text === 'string' ? part.text.length : 0), 0);
}

function measure(lines, sinceLine, criteria) {
  const messages = new Map();
  const reads = new Map();
  const commands = new Map();
  const bigResults = [];
  let subagentCalls = 0;
  lines.forEach((line, offset) => {
    const lineNumber = offset + 1;
    if (lineNumber <= sinceLine || !line.trim()) return;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      return;
    }
    if (event?.isSidechain === true || event?.parent_tool_use_id != null) return;
    const content = event?.message?.content;
    if (event?.type === 'assistant' && typeof event.message?.id === 'string') {
      messages.set(event.message.id, event.message.usage ?? null);
      if (!Array.isArray(content)) return;
      for (const block of content) {
        if (block?.type !== 'tool_use') continue;
        if (block.name === 'Read' && typeof block.input?.file_path === 'string') count(reads, block.input.file_path);
        if (block.name === 'Bash' && typeof block.input?.command === 'string') count(commands, block.input.command);
        if (subagentToolNames.has(block.name)) subagentCalls += 1;
      }
    } else if (event?.type === 'user' && Array.isArray(content)) {
      for (const block of content) {
        if (block?.type !== 'tool_result') continue;
        const size = resultLength(block.content);
        if (size > criteria.bigToolResultChars) bigResults.push(size);
      }
    }
  });

  const usage = { input: 0, output: 0, cacheRead: 0, cacheCreate: 0, messages: 0 };
  for (const recorded of messages.values()) {
    if (!recorded) continue;
    usage.messages += 1;
    usage.input += recorded.input_tokens ?? 0;
    usage.output += recorded.output_tokens ?? 0;
    usage.cacheRead += recorded.cache_read_input_tokens ?? 0;
    usage.cacheCreate += recorded.cache_creation_input_tokens ?? 0;
  }

  const waste = [];
  for (const [file, times] of reads) {
    if (times >= criteria.rereadFile) waste.push({ rule: 'rereadFile', evidence: truncate(file), count: times });
  }
  for (const [command, times] of commands) {
    if (times >= criteria.repeatCommand) waste.push({ rule: 'repeatCommand', evidence: truncate(command), count: times });
  }
  for (const size of bigResults) waste.push({ rule: 'bigToolResult', evidence: `${size} ký tự`, count: 1 });
  if (subagentCalls >= criteria.subagentCalls) waste.push({ rule: 'subagentCalls', evidence: `${subagentCalls} lần gọi subagent`, count: subagentCalls });
  if (usage.cacheCreate >= criteria.cacheMinTokens && usage.cacheCreate > criteria.cacheCreateOverRead * usage.cacheRead) {
    waste.push({ rule: 'cacheCreateOverRead', evidence: `cache tạo ${usage.cacheCreate} > cache đọc ${usage.cacheRead}`, count: 1 });
  }
  return { usage, waste };
}

try {
  if (process.argv.slice(2).includes('--help')) {
    process.stdout.write(help);
  } else {
    const options = parseArguments(process.argv.slice(2));
    if (!existsSync(options.transcript)) throw new Error('Transcript not found.');
    const criteria = JSON.parse(readFileSync(options.criteria, 'utf8'));
    const lines = readFileSync(options.transcript, 'utf8').split('\n');
    if (lines.at(-1) === '') lines.pop();
    const result = measure(lines, options.sinceLine, criteria);
    process.stdout.write(`${JSON.stringify({ ...result, lastLine: lines.length })}\n`);
  }
} catch (error) {
  process.stderr.write(`task-usage: ${error?.code ? `Unable to read input (${error.code}).` : error.message}\n`);
  process.exitCode = 1;
}
