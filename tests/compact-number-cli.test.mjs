import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const cli = fileURLToPath(new URL('../.claude/hooks/scripts/compact-number.mjs', import.meta.url));

test('compact-number CLI formats usage totals read from stdin', () => {
  const usage = { input: 18, output: 4400, cacheRead: 912000, cacheCreate: 1200000 };
  const result = spawnSync('node', [cli], { input: JSON.stringify({ usage }), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    input: '18', output: '4.4k', cacheRead: '912k', cacheCreate: '1.2M', total: '2.1M',
  });
});

test('compact-number CLI exits non-zero without output on invalid input', () => {
  const result = spawnSync('node', [cli], { input: 'not json', encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
});
