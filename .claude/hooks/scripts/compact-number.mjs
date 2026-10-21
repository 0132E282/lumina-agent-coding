// Định dạng số token gọn (18, 4.4k, 912k, 1.2M) dùng chung cho report-usage.sh và report-usage-check.mjs.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const UNITS = [
  [1_000_000, 'M'],
  [1_000, 'k'],
];

function roundScaled(scaled) {
  return scaled < 100 ? Math.round(scaled * 10) / 10 : Math.round(scaled);
}

export function formatCompactNumber(value) {
  if (!Number.isFinite(value) || value < 1000) return String(value);
  const [divisor, suffix] = UNITS.find(([unit]) => value >= unit);
  const rounded = roundScaled(value / divisor);
  if (suffix === 'k' && rounded >= 1000) return `${roundScaled(value / 1_000_000)}M`;
  return `${rounded}${suffix}`;
}

export function formatUsageTotals(usage) {
  const total = usage.input + usage.output + usage.cacheRead + usage.cacheCreate;
  const values = { input: usage.input, output: usage.output, cacheRead: usage.cacheRead, cacheCreate: usage.cacheCreate, total };
  return Object.fromEntries(Object.entries(values).map(([name, value]) => [name, formatCompactNumber(value)]));
}

// CLI cho report-usage.sh: đọc `{ usage }` JSON từ stdin, in bản rút gọn các số token.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { usage } = JSON.parse(readFileSync(0, 'utf8'));
  process.stdout.write(JSON.stringify(formatUsageTotals(usage)));
}
