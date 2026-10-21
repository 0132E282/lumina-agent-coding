#!/usr/bin/env node
// Helper của remind-cleanup.sh: đo % context window đã dùng từ transcript của phiên.
// Usage: node remind-cleanup-context.mjs  (Stop payload qua stdin).
// Đạt ngưỡng thì in một dòng dạng `82% (164k/200k)`; dưới ngưỡng/thiếu dữ liệu thì không in gì. Luôn exit 0.
import * as fs from 'node:fs';

const STANDARD_CONTEXT_LIMIT = 200000;
const EXTENDED_CONTEXT_LIMIT = 1000000;
const REMIND_THRESHOLD = 0.8;

function readConfiguredContextLimit() {
  const configured = process.env.CLAUDE_CONTEXT_LIMIT;
  if (configured && /^\d+$/.test(configured.trim())) {
    const limit = Number(configured.trim());
    if (Number.isSafeInteger(limit) && limit > 0) return limit;
  }
  return null;
}

// Context của từng message assistant có message.usage, theo thứ tự transcript.
function readContextTokensPerMessage(transcriptPath) {
  if (typeof transcriptPath !== 'string' || !fs.existsSync(transcriptPath)) return [];
  const contextTokens = [];
  for (const line of fs.readFileSync(transcriptPath, 'utf8').split('\n')) {
    if (!line) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    const usage = entry?.type === 'assistant' ? entry.message?.usage : null;
    if (!usage || typeof usage !== 'object') continue;
    contextTokens.push((Number(usage.input_tokens) || 0)
      + (Number(usage.cache_read_input_tokens) || 0)
      + (Number(usage.cache_creation_input_tokens) || 0));
  }
  return contextTokens;
}

// Transcript không ghi kích thước window; từng vượt 200k nghĩa là model đang chạy context 1M.
function inferContextLimit(contextTokens) {
  return contextTokens.some(tokens => tokens > STANDARD_CONTEXT_LIMIT) ? EXTENDED_CONTEXT_LIMIT : STANDARD_CONTEXT_LIMIT;
}

const toThousands = tokens => `${Math.round(tokens / 1000)}k`;

function main() {
  const payload = JSON.parse(fs.readFileSync(0, 'utf8'));
  const contextTokens = readContextTokensPerMessage(payload?.transcript_path);
  if (contextTokens.length === 0) return;
  const usedTokens = contextTokens[contextTokens.length - 1];
  const limit = readConfiguredContextLimit() ?? inferContextLimit(contextTokens);
  const ratio = usedTokens / limit;
  if (ratio < REMIND_THRESHOLD) return;
  process.stdout.write(`${Math.floor(ratio * 100)}% (${toThousands(usedTokens)}/${toThousands(limit)})\n`);
}

try {
  main();
} catch {
  // Best-effort: payload/transcript lỗi thì im lặng để không chặn Stop.
}
