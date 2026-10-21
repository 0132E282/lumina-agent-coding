#!/usr/bin/env node
// Helper của report-usage-check.sh: so dòng `Token:` của báo cáo với số hook đã chèn.
// Usage: node report-usage-check.mjs <logRoot>  (Stop payload qua stdin). Luôn exit 0.
import * as fs from 'node:fs';
import path from 'node:path';
import { formatCompactNumber } from './compact-number.mjs';

const NUMBER = String.raw`(\d+(?:\.\d+)?[kKmM](?![\p{L}\d])|\d{1,3}(?:[.,  ]\d{3})+|\d+)`;
const FIELDS = [
  ['input', 'input'],
  ['output', 'output'],
  ['cacheRead', 'cache\\s+đọc'],
  ['cacheCreate', 'cache\\s+tạo'],
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
  const totalMatch = new RegExp(`tổng\\s*:?\\s*${NUMBER}`, 'iu').exec(tokenLine);
  if (totalMatch) numbers.total = parseReportedValue(totalMatch[1]);
  return numbers;
}

// Số rút gọn giữ dạng chuỗi chuẩn hoá (k thường, M hoa) để so đúng với formatCompactNumber; số thô đổi về Number.
function parseReportedValue(text) {
  const compact = /^(\d+(?:\.\d+)?)([kKmM])$/.exec(text);
  if (compact) return `${compact[1]}${compact[2].toLowerCase() === 'k' ? 'k' : 'M'}`;
  return Number(text.replace(/[.,  ]/g, ''));
}

const matchesEmitted = (reportedValue, emittedValue) => (typeof reportedValue === 'string'
  ? reportedValue === formatCompactNumber(emittedValue)
  : reportedValue === emittedValue);

const describe = (numbers, format = String) => `input ${format(numbers.input)} | output ${format(numbers.output)} | cache đọc ${format(numbers.cacheRead)} | cache tạo ${format(numbers.cacheCreate)}${numbers.total === undefined ? '' : ` | tổng ${format(numbers.total)}`}`;
const describeCompact = numbers => describe(numbers, formatCompactNumber);

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function main() {
  const logRoot = process.argv[2] || process.cwd();
  const payload = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (payload.stop_hook_active === true) return;
  const sessionId = payload.session_id;
  if (typeof sessionId !== 'string' || !sessionId) return;

  const reported = parseReportedNumbers(readFinalMessage(payload));
  if (!reported) return;

  const stateDirectory = path.join(logRoot, '.agents/storage/state');
  const emitted = readJson(path.join(stateDirectory, `${sessionId}.emitted.json`));
  const hasEmitted = emitted && FIELDS.every(([name]) => Number.isFinite(emitted[name]));
  // Tổng là tuỳ chọn trong báo cáo; emitted cũ chưa có total thì cộng từ 4 trường.
  if (hasEmitted && !Number.isFinite(emitted.total)) {
    emitted.total = FIELDS.reduce((sum, [name]) => sum + emitted[name], 0);
  }
  const totalMatches = reported.total === undefined || matchesEmitted(reported.total, emitted?.total);
  if (hasEmitted && totalMatches && FIELDS.every(([name]) => matchesEmitted(reported[name], emitted[name]))) return;

  const signature = `${describe(reported)} => ${hasEmitted ? describe(emitted) : 'no-emitted'}`;
  const checkedFile = path.join(stateDirectory, `${sessionId}.checked`);
  const seen = fs.existsSync(checkedFile) ? fs.readFileSync(checkedFile, 'utf8').split('\n') : [];
  if (seen.includes(signature)) return;
  fs.mkdirSync(stateDirectory, { recursive: true });
  fs.appendFileSync(checkedFile, `${signature}\n`);

  const message = hasEmitted
    ? `⚠️ Dòng Token trong báo cáo không khớp số hook đã chèn (báo cáo: ${describe(reported)}; hook: ${describeCompact(emitted)}). Sửa lại bằng đúng số hook: ${describeCompact(emitted)}.`
    : '⚠️ Báo cáo có dòng Token nhưng hook chưa chèn số nào ở phiên này; gọi lại skill report để lấy số thật hoặc bỏ dòng Token.';
  process.stdout.write(`${JSON.stringify({ hookSpecificOutput: { hookEventName: 'Stop', additionalContext: message } })}\n`);
}

try {
  main();
} catch {
  // Best-effort: payload/state hỏng thì im lặng, không chặn Stop.
}
