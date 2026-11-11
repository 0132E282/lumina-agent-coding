#!/usr/bin/env node
// Helper for report-usage-check.sh: compare the report's `Token:` line with the numbers the hook inserted.
// Usage: node report-usage-check.mjs <logRoot>  (Stop payload via stdin). Always exit 0.
import * as fs from 'node:fs';
import { formatCompactNumber } from './compact-number.mjs';
import { getSessionValue, pushSessionValues } from './_hook-storage.mjs';

const NUMBER = String.raw`(\d+(?:\.\d+)?[kKmM](?![\p{L}\d])|\d{1,3}(?:[.,  ]\d{3})+|\d+)`;
const FIELDS = [
  ['input', 'input'],
  ['output', 'output'],
  ['cacheRead', 'cache\\s+read'],
  ['cacheCreate', 'cache\\s+create'],
];

function readFinalMessage(payload) {
  if (typeof payload.last_assistant_message === 'string' && payload.last_assistant_message) {
    return payload.last_assistant_message;
  }
  const transcriptPath = payload.transcript_path;
  if (typeof transcriptPath !== 'string' || !fs.existsSync(transcriptPath)) return '';
  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    let entry;
    try {
      entry = JSON.parse(lines[index]);
    } catch {
      continue;
    }
    if (entry.type !== 'assistant') continue;
    const content = entry.message?.content;
    const text = Array.isArray(content)
      ? content.filter(block => block?.type === 'text').map(block => block.text).join('\n')
      : String(content ?? '');
    if (text) return text;
  }
  return '';
}

function parseReportedNumbers(message) {
  const tokenLine = message.split('\n').find(line => /^[\s>*_•-]*Token\**\s*:/i.test(line));
  if (!tokenLine) return null;
  const numbers = {};
  for (const [name, label] of FIELDS) {
    const match = new RegExp(`${label}\\s*:?\\s*${NUMBER}`, 'iu').exec(tokenLine);
    if (!match) return null;
    numbers[name] = parseReportedValue(match[1]);
  }
  const totalMatch = new RegExp(`total\\s*:?\\s*${NUMBER}`, 'iu').exec(tokenLine);
  if (totalMatch) numbers.total = parseReportedValue(totalMatch[1]);
  return numbers;
}

// Shortened numbers stay as normalized strings (lowercase k, uppercase M) to compare exactly with formatCompactNumber; raw numbers become Number.
function parseReportedValue(text) {
  const compact = /^(\d+(?:\.\d+)?)([kKmM])$/.exec(text);
  if (compact) return `${compact[1]}${compact[2].toLowerCase() === 'k' ? 'k' : 'M'}`;
  return Number(text.replace(/[.,  ]/g, ''));
}

const matchesEmitted = (reportedValue, emittedValue) => (typeof reportedValue === 'string'
  ? reportedValue === formatCompactNumber(emittedValue)
  : reportedValue === emittedValue);

const describe = (numbers, format = String) => `input ${format(numbers.input)} | output ${format(numbers.output)} | cache read ${format(numbers.cacheRead)} | cache create ${format(numbers.cacheCreate)}${numbers.total === undefined ? '' : ` | total ${format(numbers.total)}`}`;
const describeCompact = numbers => describe(numbers, formatCompactNumber);

function main() {
  const logRoot = process.argv[2] || process.cwd();
  const payload = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (payload.stop_hook_active === true) return;
  const sessionId = payload.session_id;
  if (typeof sessionId !== 'string' || !sessionId) return;

  const reported = parseReportedNumbers(readFinalMessage(payload));
  if (!reported) return;

  const emitted = getSessionValue(logRoot, sessionId, 'emitted');
  const hasEmitted = emitted && FIELDS.every(([name]) => Number.isFinite(emitted[name]));
  // Total is optional in the report; an older emitted without total sums the 4 fields.
  if (hasEmitted && !Number.isFinite(emitted.total)) {
    emitted.total = FIELDS.reduce((sum, [name]) => sum + emitted[name], 0);
  }
  const totalMatches = reported.total === undefined || matchesEmitted(reported.total, emitted?.total);
  if (hasEmitted && totalMatches && FIELDS.every(([name]) => matchesEmitted(reported[name], emitted[name]))) return;

  const signature = `${describe(reported)} => ${hasEmitted ? describe(emitted) : 'no-emitted'}`;
  // Mỗi kiểu lệch chỉ nhắc một lần: push trả 0 khi chữ ký đã có.
  if (pushSessionValues(logRoot, sessionId, 'usageChecked', [signature]) === 0) return;

  const message = hasEmitted
    ? `⚠️ The Token line in the report does not match the numbers the hook inserted (report: ${describe(reported)}; hook: ${describeCompact(emitted)}). Fix it with the exact hook numbers: ${describeCompact(emitted)}.`
    : '⚠️ The report has a Token line but the hook inserted no numbers in this session; call skill report again to get the real numbers or drop the Token line.';
  process.stdout.write(`${JSON.stringify({ hookSpecificOutput: { hookEventName: 'Stop', additionalContext: message } })}\n`);
}

try {
  main();
} catch {
  // Best-effort: on a bad payload/state stay silent, do not block Stop.
}
