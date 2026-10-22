import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const SUCCESS = /Shared rules\/skills, symlinks, Codex agent adapters, Markdown links and docs indexes are valid\./;
const DOCS_ENTRY = { title: 'Documentation index', description: 'Index.', tags: ['index'], path: 'docs/index.json' };
const TOML = 'name = "coding-agent"\ndescription = "Implements code."\ndeveloper_instructions = "Read .claude/agents/coding-agent.md"\n';

function write(root, relativePath, content) {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`);
}

function link(root, target, relativePath) {
  fs.mkdirSync(path.dirname(path.join(root, relativePath)), { recursive: true });
  fs.symlinkSync(target, path.join(root, relativePath));
}

// Script tự lấy root = thư mục cha của scripts/, nên copy cả checker và check_docs.py vào fixture.
function validTree(context) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'check-agent-config-test-')));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const name of ['check-agent-config.py', 'check_docs.py']) {
    fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
    fs.copyFileSync(path.join(repoRoot, 'scripts', name), path.join(root, 'scripts', name));
  }
  write(root, 'AGENTS.md', '# Agents\n\nSee [delivery](.agents/rules/delivery.md#báo-cáo-bắt-buộc) and [skill](.claude/skills/report/SKILL.md).\n');
  write(root, '.agents/rules/delivery.md', '# Delivery\n\n## Báo cáo bắt buộc\n');
  write(root, '.agents/skills/report/SKILL.md', '# Report\n\n[rule](../../rules/delivery.md)\n');
  write(root, '.claude/agents/coding-agent.md', '# Coding agent\n');
  write(root, '.claude/hooks/scripts/hook.sh', '#!/usr/bin/env bash\n');
  write(root, '.codex/agents/coding-agent.toml', TOML);
  for (const tool of ['.claude', '.codex']) {
    for (const folder of ['rules', 'skills']) link(root, `../.agents/${folder}`, `${tool}/${folder}`);
  }
  link(root, '../.claude/agents', '.agents/agents');
  link(root, '../.claude/hooks', '.agents/hooks');
  write(root, 'docs/index.json', { version: 1, entries: [DOCS_ENTRY] });
  return root;
}

function check(root) {
  return spawnSync('python3', [path.join(root, 'scripts/check-agent-config.py')], { encoding: 'utf8' });
}

function assertFails(root, expected) {
  const result = check(root);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, expected);
  assert.doesNotMatch(result.stdout, SUCCESS);
  return result;
}

test('the real repository configuration is valid', () => {
  const result = spawnSync('python3', [path.join(repoRoot, 'scripts/check-agent-config.py')], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, SUCCESS);
});

test('a valid fixture tree passes with the success message and is not modified', context => {
  const root = validTree(context);
  const before = fs.readdirSync(root, { recursive: true }).sort();
  const result = check(root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, SUCCESS);
  assert.equal(result.stderr, '');
  assert.deepEqual(fs.readdirSync(root, { recursive: true }).sort(), before);
});

test('.claude/.codex rules/skills must be symlinks to the matching .agents folder', context => {
  const root = validTree(context);
  fs.rmSync(path.join(root, '.claude/rules'));
  fs.mkdirSync(path.join(root, '.claude/rules'));
  fs.rmSync(path.join(root, '.codex/skills'));
  link(root, '../.agents/rules', '.codex/skills');
  const result = assertFails(root, /^\.claude\/rules: expected link to \.agents\/rules$/m);
  assert.match(result.stderr, /^\.codex\/skills: expected link to \.agents\/skills$/m);
});

test('a broken .claude/skills symlink is reported', context => {
  const root = validTree(context);
  fs.rmSync(path.join(root, '.claude/skills'));
  link(root, '../.agents/missing-skills', '.claude/skills');
  assertFails(root, /^\.claude\/skills: expected link to \.agents\/skills$/m);
});

test('a broken symlink directly under .agents is reported', context => {
  const root = validTree(context);
  fs.rmSync(path.join(root, '.claude/hooks'), { recursive: true });
  assertFails(root, /^Broken link: \.agents\/hooks$/m);
});

test('a skill folder without SKILL.md is reported; dot folders are ignored', context => {
  const root = validTree(context);
  write(root, '.agents/skills/empty-skill/notes.txt', 'x\n');
  write(root, '.agents/skills/.hidden/notes.txt', 'x\n');
  const result = assertFails(root, /^Missing SKILL\.md: empty-skill$/m);
  assert.doesNotMatch(result.stderr, /\.hidden/);
});

test('a Codex adapter without a matching .claude/agents role source is reported', context => {
  const root = validTree(context);
  write(root, '.codex/agents/ghost-agent.toml', TOML);
  assertFails(root, /^Missing role source: ghost-agent$/m);
});

test('a Codex adapter missing name/description/developer_instructions is reported', context => {
  const root = validTree(context);
  write(root, '.codex/agents/coding-agent.toml', 'name = "coding-agent"\ndescription = ""\ndeveloper_instructions = "x"\n');
  assertFails(root, /^Missing agent fields: coding-agent\.toml$/m);
});

test('an invalid TOML adapter is reported with its file name', context => {
  const root = validTree(context);
  write(root, '.codex/agents/coding-agent.toml', 'name = "coding-agent\n');
  assertFails(root, /^coding-agent\.toml: /m);
});

test('broken Markdown link targets and anchors are reported', context => {
  const root = validTree(context);
  write(root, 'AGENTS.md', '# Agents\n\n[gone](.agents/rules/missing.md)\n[bad](.agents/rules/delivery.md#bao-cao)\n');
  const result = assertFails(root, /^AGENTS\.md:3: missing link target \.agents\/rules\/missing\.md$/m);
  assert.match(result.stderr, /^AGENTS\.md:4: missing anchor #bao-cao in \.agents\/rules\/delivery\.md$/m);
});

test('invalid docs indexes are reported', context => {
  const invalidJson = validTree(context);
  write(invalidJson, 'docs/index.json', '{ not json');
  assertFails(invalidJson, /^docs\/index\.json: cannot read JSON/m);

  const missingPath = validTree(context);
  write(missingPath, 'docs/index.json', { entries: [DOCS_ENTRY, { ...DOCS_ENTRY, path: 'docs/missing.md' }] });
  assertFails(missingPath, /^docs\/index\.json: entry docs\/missing\.md path does not exist$/m);

  const unsynced = validTree(context);
  write(unsynced, 'docs/repo/case.md', '# Case\n');
  write(unsynced, 'docs/repo/index.json', [{ title: 'Case', description: 'Case.', tags: [], path: 'docs/repo/case.md' }]);
  assertFails(unsynced, /^docs\/repo\/index\.json: entry docs\/repo\/case\.md missing from docs\/index\.json$/m);
});
