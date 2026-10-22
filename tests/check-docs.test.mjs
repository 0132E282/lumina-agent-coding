import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const checker = fileURLToPath(new URL('../scripts/check_docs.py', import.meta.url));

const REPO_ENTRY = { title: 'Repo case', description: 'Repo testcase.', tags: ['regression'], path: 'docs/repo/case.md' };
const PLAN_ENTRY = { title: 'Plan', description: 'Plan file.', tags: ['plan'], path: 'docs/plans/plan.json' };

function write(root, relativePath, content) {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`);
}

function validRepository(context) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'check-docs-test-')));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  write(root, 'AGENTS.md', [
    '# Agents',
    '',
    'See [delivery](./.agents/rules/delivery.md#báo-cáo-bắt-buộc), [backend](.agents/rules/backend.md#backend--contract-nội-dung-và-bảo-mật),',
    '[style](.claude/rules/delivery.md#kissyagni), [web](https://example.com/missing.md), [mail](mailto:a@b.c), [abs](/absolute/path/file.ext:3) and [top](#agents).',
    '',
    '`[inline](missing-inline.md)`',
    '',
    '```md',
    '[fenced](missing-fenced.md)',
    '```',
    '',
  ].join('\n'));
  for (const name of ['CLAUDE.md', 'CONTRACT.md', 'README.md']) write(root, name, `# ${name}\n`);
  write(root, '.agents/rules/delivery.md', '# Delivery\n\n## Báo cáo bắt buộc\n\n## KISS/YAGNI\n');
  write(root, '.agents/rules/backend.md', '# Backend\n\n## Backend — contract, nội dung và bảo mật\n\nBack to [delivery](delivery.md).\n');
  write(root, '.agents/skills/sample/SKILL.md', '# Sample\n\n[rule](../../rules/delivery.md#báo-cáo-bắt-buộc)\n');
  write(root, '.agents/storage/ignored.md', '[ignored](missing-storage.md)\n');
  fs.mkdirSync(path.join(root, '.claude'), { recursive: true });
  fs.symlinkSync('../.agents/rules', path.join(root, '.claude/rules'));
  fs.symlinkSync('../.agents/skills', path.join(root, '.claude/skills'));
  write(root, 'docs/repo/case.md', '# Case\n');
  write(root, 'docs/plans/plan.json', '{}\n');
  write(root, 'docs/repo/index.json', [REPO_ENTRY]);
  write(root, 'docs/plans/index.json', [PLAN_ENTRY]);
  write(root, 'docs/index.json', {
    version: 1,
    entries: [{ title: 'Documentation index', description: 'Index.', tags: ['index'], path: 'docs/index.json' }, REPO_ENTRY],
    update_policy: {},
  });
  return root;
}

function check(root) {
  return spawnSync('python3', [checker, root], { encoding: 'utf8' });
}

test('valid repository passes; code, external, absolute, storage and symlinked duplicates are ignored', context => {
  const result = check(validRepository(context));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /valid/);
});

test('missing link target fails with file, line and target', context => {
  const root = validRepository(context);
  write(root, '.agents/skills/sample/SKILL.md', '# Sample\n\nText\n[gone](../../rules/missing.md)\n');
  const result = check(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /\.agents\/skills\/sample\/SKILL\.md:4: missing link target \.\.\/\.\.\/rules\/missing\.md/);
  assert.doesNotMatch(result.stderr, /\.claude\/skills/);
});

test('unknown anchor fails while correct Vietnamese anchor passes', context => {
  const root = validRepository(context);
  write(root, 'CONTRACT.md', '# Contract\n\n[ok](.agents/rules/delivery.md#báo-cáo-bắt-buộc)\n[bad](.agents/rules/delivery.md#bao-cao-bat-buoc)\n');
  const result = check(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /CONTRACT\.md:4: missing anchor #bao-cao-bat-buoc in \.agents\/rules\/delivery\.md/);
  assert.doesNotMatch(result.stderr, /CONTRACT\.md:3/);
});

test('repo index entry missing or different in docs/index.json fails', context => {
  const root = validRepository(context);
  write(root, 'docs/index.json', {
    version: 1,
    entries: [{ ...REPO_ENTRY, description: 'Changed.' }],
    update_policy: {},
  });
  const result = check(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /docs\/repo\/index\.json: entry docs\/repo\/case\.md differs from docs\/index\.json \(description\)/);

  write(root, 'docs/index.json', { version: 1, entries: [], update_policy: {} });
  assert.match(check(root).stderr, /docs\/repo\/index\.json: entry docs\/repo\/case\.md missing from docs\/index\.json/);
});

test('index entries need existing path and exactly title/description/tags/path', context => {
  const root = validRepository(context);
  write(root, 'docs/plans/index.json', [{ ...PLAN_ENTRY, path: 'docs/plans/gone.json', extra: true }]);
  const result = check(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /docs\/plans\/index\.json: entry docs\/plans\/gone\.json path does not exist/);
  assert.match(result.stderr, /docs\/plans\/index\.json: entry docs\/plans\/gone\.json fields must be exactly title, description, tags, path/);
  assert.doesNotMatch(result.stderr, /plans.*missing from docs\/index\.json/);
});
