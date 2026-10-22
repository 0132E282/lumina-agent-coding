#!/usr/bin/env node
// Helper của turn-log.sh: đọc transcript, ghi MỘT dòng tóm tắt lượt hiện tại vào logs.jsonl.
// Usage: node turn-log.mjs <task-usage.mjs>  (Stop payload qua stdin). Luôn exit 0.
import * as fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const REQUEST_LIMIT = 200;
const FILE_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit']);
// Tin nhắn type "user" nhưng không phải người dùng gõ: lệnh local, output `!`, thông báo subagent, ngắt lượt.
const NON_PROMPT_PREFIXES = [
  '<task-notification>',
  '<local-command-',
  '<command-name>',
  '<bash-input>',
  '<bash-stdout>',
  '<bash-stderr>',
  '[Request interrupted by user',
];
const SECRET_PATTERNS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g, '[REDACTED]'],
  [/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]'],
  [/\b(password|passwd|pwd|secret|token|api[_-]?key|access[_-]?token|client[_-]?secret)(\s*[=:]\s*)("[^"]*"|'[^']*'|[^\s&,;]+)/gi, '$1$2[REDACTED]'],
  [/\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]+/g, '[REDACTED]'],
  [/\bsk-[A-Za-z0-9_-]{16,}/g, '[REDACTED]'],
  [/\bgh[pousr]_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}/g, '[REDACTED]'],
  [/\bAKIA[0-9A-Z]{16}\b/g, '[REDACTED]'],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}/g, '[REDACTED]'],
  [/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED]'],
];

function parseLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function isMainSession(event) {
  return event?.isSidechain !== true && event?.parent_tool_use_id == null;
}

// Trả về text prompt nếu dòng là prompt thật của người dùng, ngược lại null.
function promptText(event) {
  if (event?.type !== 'user' || !isMainSession(event)) return null;
  if (event.isMeta === true || event.isCompactSummary === true) return null;
  if (event.origin && event.origin.kind !== 'human') return null;
  const content = event.message?.content;
  let text;
  if (typeof content === 'string') {
    text = content;
  } else if (Array.isArray(content) && content.length > 0) {
    if (content.some(block => block?.type === 'tool_result')) return null;
    text = content.filter(block => block?.type === 'text' && typeof block.text === 'string').map(block => block.text).join('\n');
  } else {
    return null;
  }
  const trimmed = text.trimStart();
  if (NON_PROMPT_PREFIXES.some(prefix => trimmed.startsWith(prefix))) return null;
  return text;
}

function summarizeRequest(text) {
  const commandName = /<command-name>([\s\S]*?)<\/command-name>/.exec(text)?.[1];
  const commandArguments = /<command-args>([\s\S]*?)<\/command-args>/.exec(text)?.[1];
  const readable = commandName ? `${commandName} ${commandArguments ?? ''}` : text;
  let request = readable.replace(/\s+/g, ' ').trim();
  for (const [pattern, replacement] of SECRET_PATTERNS) request = request.replace(pattern, replacement);
  return Array.from(request).slice(0, REQUEST_LIMIT).join('');
}

function totals(usage) {
  const { input, output, cacheRead, cacheCreate } = usage;
  return { input, output, cacheRead, cacheCreate, total: input + output + cacheRead + cacheCreate };
}

function readLines(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  if (lines.at(-1) === '') lines.pop();
  return lines;
}

function resolveLogRoot(payload) {
  const candidates = [process.env.CLAUDE_PROJECT_DIR, payload.cwd];
  const found = candidates.find(candidate => typeof candidate === 'string' && candidate && fs.existsSync(candidate) && fs.statSync(candidate).isDirectory());
  return found ?? process.cwd();
}

function isFinishedSubagent(result, subagentDirectory) {
  if (result.status === 'completed') return true;
  try {
    return JSON.parse(fs.readFileSync(path.join(subagentDirectory, `agent-${result.agentId}.meta.json`), 'utf8')).finished === true;
  } catch {
    return false;
  }
}

// * Token subagent lấy từ transcript riêng <session>/subagents/agent-<id>.jsonl; totalTokens trên tool result
// * chỉ là context của request cuối, không phải tổng tiêu thụ, nên không dùng.
function measureSubagents(results, transcriptPath, measure, criteria) {
  const subagentDirectory = path.join(path.dirname(transcriptPath), path.basename(transcriptPath, '.jsonl'), 'subagents');
  const sum = { input: 0, output: 0, cacheRead: 0, cacheCreate: 0 };
  let measured = 0;
  let pending = 0;
  for (const result of results) {
    const file = path.join(subagentDirectory, `agent-${result.agentId}.jsonl`);
    if (!isFinishedSubagent(result, subagentDirectory)) {
      pending += 1;
      continue;
    }
    if (!fs.existsSync(file)) continue;
    const { usage } = measure(readLines(file), 0, criteria, { includeSidechain: true });
    for (const key of Object.keys(sum)) sum[key] += usage[key];
    measured += 1;
  }
  return { tokens: measured > 0 ? totals(sum) : null, pending };
}

async function main() {
  const usageModulePath = process.argv[2];
  const payload = JSON.parse(fs.readFileSync(0, 'utf8'));
  const transcriptPath = payload.transcript_path;
  if (typeof transcriptPath !== 'string' || !fs.existsSync(transcriptPath)) return;
  if (typeof usageModulePath !== 'string' || !fs.existsSync(usageModulePath)) return;

  const lines = readLines(transcriptPath);
  const events = lines.map(parseLine);
  let startIndex = -1;
  let request = null;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const text = promptText(events[index]);
    if (text !== null) {
      startIndex = index;
      request = text;
      break;
    }
  }
  if (startIndex < 0) return;

  const sessionId = typeof payload.session_id === 'string' && payload.session_id ? payload.session_id : 'unknown';
  const logRoot = resolveLogRoot(payload);
  const stateFile = path.join(logRoot, '.agents/storage/state', `${sessionId.replace(/[^A-Za-z0-9_-]/g, '_')}.turn.json`);
  const turnMarker = { turnStartLine: startIndex + 1, turnStartUuid: events[startIndex].uuid ?? null };
  try {
    const previous = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    if (previous.turnStartLine === turnMarker.turnStartLine && previous.turnStartUuid === turnMarker.turnStartUuid) return;
  } catch {
    // Chưa có marker cho phiên này: lượt đầu tiên được ghi.
  }

  const tools = {};
  const files = [];
  const seenToolUses = new Set();
  const subagentResults = [];
  for (const event of events.slice(startIndex + 1)) {
    if (!isMainSession(event)) continue;
    if (event.type === 'user' && typeof event.toolUseResult?.agentId === 'string' && /^[A-Za-z0-9_-]+$/.test(event.toolUseResult.agentId)) {
      subagentResults.push(event.toolUseResult);
    }
    if (event.type !== 'assistant' || !Array.isArray(event.message?.content)) continue;
    for (const block of event.message.content) {
      if (block?.type !== 'tool_use' || typeof block.name !== 'string') continue;
      if (block.id && seenToolUses.has(block.id)) continue;
      if (block.id) seenToolUses.add(block.id);
      tools[block.name] = (tools[block.name] ?? 0) + 1;
      const file = FILE_TOOLS.has(block.name) ? block.input?.file_path ?? block.input?.notebook_path : undefined;
      if (typeof file === 'string' && file && !files.includes(file)) files.push(file);
    }
  }

  const { measure, defaultCriteria } = await import(pathToFileURL(usageModulePath).href);
  const criteria = JSON.parse(fs.readFileSync(defaultCriteria, 'utf8'));
  const { usage } = measure(lines, startIndex + 1, criteria);
  const subagents = measureSubagents(subagentResults, transcriptPath, measure, criteria);

  const entry = {
    ts: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    type: 'turn',
    session_id: sessionId,
    request: summarizeRequest(request),
    tools,
    files,
    tokens: totals(usage),
    ...(subagents.tokens ? { subagentTokens: subagents.tokens } : {}),
    ...(subagents.pending > 0 ? { subagentsPending: subagents.pending } : {}),
  };

  const logDirectory = path.join(logRoot, '.agents/storage/logs');
  fs.mkdirSync(logDirectory, { recursive: true });
  fs.appendFileSync(path.join(logDirectory, 'logs.jsonl'), `${JSON.stringify(entry)}\n`);
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(stateFile, `${JSON.stringify(turnMarker)}\n`);
}

try {
  await main();
} catch (error) {
  process.stderr.write(`turn-log: ${error?.code ? `Unable to read input (${error.code}).` : error?.message}\n`);
}
