import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const scriptsDirectory = fileURLToPath(new URL('../.claude/hooks/scripts', import.meta.url));
const usagePayload = { usage: { input: 130, output: 46873, cacheRead: 14085076, cacheCreate: 253349, messages: 65 } };
const expectedOutput = '{"input":"130","output":"46.9k","cacheRead":"14.1M","cacheCreate":"253k","total":"14.4M"}';

function runCompactNumber(script) {
  return spawnSync(process.execPath, [script], { input: JSON.stringify(usagePayload), encoding: 'utf8' });
}

test('compact-number CLI prints compact totals when invoked via the real path', () => {
  const result = runCompactNumber(path.join(scriptsDirectory, 'compact-number.mjs'));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, expectedOutput);
});

test('compact-number CLI prints compact totals when invoked through a symlinked scripts directory', context => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'compact-number-test-')));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const linkedScripts = path.join(root, 'scripts');
  fs.symlinkSync(scriptsDirectory, linkedScripts, 'dir');

  const result = runCompactNumber(path.join(linkedScripts, 'compact-number.mjs'));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, expectedOutput);
});

test('compact-number module import has no CLI side effect', () => {
  const script = `import(${JSON.stringify(path.join(scriptsDirectory, 'compact-number.mjs'))}).then(module => console.log(typeof module.formatUsageTotals))`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], { input: '', encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'function\n');
});
