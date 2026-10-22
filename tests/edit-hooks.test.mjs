import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const scripts = path.join(repoRoot, '.claude/hooks/scripts');
const scriptsViaSymlink = path.join(repoRoot, '.agents/hooks/scripts');
// PATH tối giản: chỉ thư mục fake + hệ thống (jq/git/bash nằm ở /usr/bin, /bin) để không chạm linter thật.
const systemPath = '/usr/bin:/bin';

const PRETTIER_EXTENSIONS = ['js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'json', 'jsonc', 'css', 'scss', 'less', 'html', 'vue', 'md', 'mdx', 'yaml', 'yml', 'graphql'];

function temporaryDirectory(context, prefix = 'edit-hooks-test-') {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function write(root, relativePath, content = '') {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return file;
}

function writeExecutable(root, relativePath, body) {
  const file = write(root, relativePath, `#!/bin/bash\n${body}\n`);
  fs.chmodSync(file, 0o755);
  return file;
}

function readCalls(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean) : [];
}

function runHook(script, { cwd, filePath, input, environment }) {
  const result = spawnSync('bash', [script], {
    cwd,
    input: input ?? JSON.stringify({ tool_name: 'Edit', tool_input: filePath === undefined ? {} : { file_path: filePath } }),
    encoding: 'utf8',
    env: environment,
  });
  assert.equal(result.status, 0, result.stderr);
  return result;
}

// ---------- format-on-edit.sh ----------

function prettierProject(context, { gitRepository = true, prettierBody } = {}) {
  const root = temporaryDirectory(context, 'format-on-edit-test-');
  if (gitRepository) assert.equal(spawnSync('git', ['init', '-q'], { cwd: root }).status, 0);
  const calls = path.join(temporaryDirectory(context, 'format-on-edit-calls-'), 'calls.log');
  const body = prettierBody ?? 'printf "%s|%s\\n" "$PWD" "$*" >> "$PRETTIER_CALLS"';
  writeExecutable(root, 'node_modules/.bin/prettier', body);
  const elsewhere = temporaryDirectory(context, 'format-on-edit-cwd-');
  const environment = { ...process.env, CLAUDE_PROJECT_DIR: root, PRETTIER_CALLS: calls };
  const format = (filePath, options = {}) => runHook(path.join(options.viaSymlink ? scriptsViaSymlink : scripts, 'format-on-edit.sh'), {
    cwd: elsewhere,
    filePath,
    input: options.input,
    environment,
  });
  return { root, calls, format };
}

test('format-on-edit runs prettier --write --ignore-unknown <file> from the project root for every supported extension', context => {
  const project = prettierProject(context);
  const files = PRETTIER_EXTENSIONS.map(extension => write(project.root, `src/nested/file.${extension}`, 'x\n'));
  for (const file of files) {
    const result = project.format(file);
    assert.equal(result.stdout, '');
  }
  assert.deepEqual(readCalls(project.calls), files.map(file => `${project.root}|--write --ignore-unknown ${file}`));
});

test('format-on-edit works through the .agents/hooks/scripts symlink', context => {
  const project = prettierProject(context);
  const file = write(project.root, 'a.ts', 'x\n');
  project.format(file, { viaSymlink: true });
  assert.deepEqual(readCalls(project.calls), [`${project.root}|--write --ignore-unknown ${file}`]);
});

test('format-on-edit skips unsupported extensions, missing files, missing file_path and invalid JSON', context => {
  const project = prettierProject(context);
  for (const name of ['script.py', 'run.sh', 'notes.txt', 'Makefile', 'style.css.bak']) project.format(write(project.root, name, 'x\n'));
  project.format(path.join(project.root, 'missing.ts'));
  project.format(undefined);
  project.format(undefined, { input: 'not json' });
  assert.deepEqual(readCalls(project.calls), []);
});

test('format-on-edit skips files outside a git repository', context => {
  const project = prettierProject(context, { gitRepository: false });
  project.format(write(project.root, 'a.ts', 'x\n'));
  assert.deepEqual(readCalls(project.calls), []);
});

test('format-on-edit skips when prettier is missing or not executable', context => {
  const project = prettierProject(context);
  const prettier = path.join(project.root, 'node_modules/.bin/prettier');
  fs.chmodSync(prettier, 0o644);
  project.format(write(project.root, 'a.ts', 'x\n'));
  fs.rmSync(prettier);
  project.format(write(project.root, 'b.ts', 'x\n'));
  assert.deepEqual(readCalls(project.calls), []);
});

test('format-on-edit exits 0 silently even when prettier fails', context => {
  const project = prettierProject(context, { prettierBody: 'echo "boom" >&2; echo "noise"; exit 2' });
  const result = project.format(write(project.root, 'a.ts', 'x\n'));
  assert.equal(result.stdout, '');
});

// ---------- lint-on-edit.sh ----------

// Fake npx: chỉ nhận tool có trong $FAKE_NPX_TOOLS; `--version` thành công, lệnh lint in $FAKE_OUTPUT.
const FAKE_NPX = [
  'case " $FAKE_NPX_TOOLS " in *" $2 "*) ;; *) exit 1 ;; esac',
  'printf "npx %s\\n" "$*" >> "$FAKE_CALLS"',
  'case "$*" in *--version*) echo 1.0.0; exit 0 ;; esac',
  'printf "%s\\n" "$FAKE_OUTPUT"',
  'exit 1',
].join('\n');
const fakeLinter = name => `printf "${name} %s\\n" "$*" >> "$FAKE_CALLS"\nprintf "%s\\n" "$FAKE_OUTPUT"\nexit 1`;

function lintProject(context, { tools = [], npxTools = '', output = 'src/a.ts(1,1): error TS2322: bad type' } = {}) {
  const root = temporaryDirectory(context, 'lint-on-edit-test-');
  const bin = temporaryDirectory(context, 'lint-on-edit-bin-');
  const calls = path.join(bin, 'calls.log');
  for (const tool of tools) writeExecutable(bin, tool, tool === 'npx' ? FAKE_NPX : fakeLinter(tool));
  const environment = {
    PATH: `${bin}:${systemPath}`,
    HOME: process.env.HOME,
    CLAUDE_PROJECT_DIR: root,
    FAKE_CALLS: calls,
    FAKE_NPX_TOOLS: npxTools,
    FAKE_OUTPUT: output,
  };
  const lint = (filePath, options = {}) => {
    const result = runHook(path.join(options.viaSymlink ? scriptsViaSymlink : scripts, 'lint-on-edit.sh'), { cwd: root, filePath, environment });
    return result.stdout.trim() === '' ? null : JSON.parse(result.stdout);
  };
  return { root, calls, lint };
}

function assertLintContext(output, filePath, expectedText) {
  assert.ok(output, 'expected additionalContext output');
  assert.equal(output.hookSpecificOutput.hookEventName, 'PostToolUse');
  assert.ok(output.hookSpecificOutput.additionalContext.includes(filePath));
  assert.ok(output.hookSpecificOutput.additionalContext.includes(expectedText));
}

test('lint-on-edit runs tsc --noEmit for .ts/.tsx when tsconfig.json exists and reports errors', context => {
  const project = lintProject(context, { tools: ['npx'], npxTools: 'tsc' });
  write(project.root, 'tsconfig.json', '{}\n');
  for (const name of ['src/a.ts', 'src/b.tsx']) {
    const file = write(project.root, name, 'x\n');
    assertLintContext(project.lint(file), file, 'error TS2322');
  }
  assert.ok(readCalls(project.calls).includes('npx --no-install tsc --noEmit --pretty false'));
});

test('lint-on-edit works through the .agents/hooks/scripts symlink', context => {
  const project = lintProject(context, { tools: ['npx'], npxTools: 'tsc' });
  write(project.root, 'tsconfig.json', '{}\n');
  const file = write(project.root, 'a.ts', 'x\n');
  assertLintContext(project.lint(file, { viaSymlink: true }), file, 'error TS2322');
});

test('lint-on-edit stays silent for .ts without tsconfig.json or without a local tsc', context => {
  const project = lintProject(context, { tools: ['npx'], npxTools: 'tsc' });
  const file = write(project.root, 'a.ts', 'x\n');
  assert.equal(project.lint(file), null);
  assert.deepEqual(readCalls(project.calls), []);

  const withoutTsc = lintProject(context, { tools: ['npx'], npxTools: '' });
  write(withoutTsc.root, 'tsconfig.json', '{}\n');
  assert.equal(withoutTsc.lint(write(withoutTsc.root, 'a.ts', 'x\n')), null);
});

test('lint-on-edit runs eslint for .js/.jsx only when an eslint config exists', context => {
  const output = '1:1 warning Unexpected var no-var';
  const withoutConfig = lintProject(context, { tools: ['npx'], npxTools: 'eslint', output });
  assert.equal(withoutConfig.lint(write(withoutConfig.root, 'a.js', 'x\n')), null);
  assert.deepEqual(readCalls(withoutConfig.calls), []);

  for (const config of ['.eslintrc', '.eslintrc.json', '.eslintrc.js', '.eslintrc.cjs', 'eslint.config.js', 'eslint.config.mjs']) {
    const project = lintProject(context, { tools: ['npx'], npxTools: 'eslint', output });
    write(project.root, config, '\n');
    const file = write(project.root, config === '.eslintrc' ? 'a.jsx' : 'a.js', 'x\n');
    assertLintContext(project.lint(file), file, 'no-var');
    assert.ok(readCalls(project.calls).includes(`npx --no-install eslint ${file}`), config);
  }
});

test('lint-on-edit prefers ruff over flake8 for .py and falls back to flake8', context => {
  const output = 'a.py:1:1: F401 error unused import';
  const both = lintProject(context, { tools: ['ruff', 'flake8'], output });
  const file = write(both.root, 'a.py', 'x\n');
  assertLintContext(both.lint(file), file, 'F401');
  assert.deepEqual(readCalls(both.calls), [`ruff check ${file}`]);

  const flake8Only = lintProject(context, { tools: ['flake8'], output });
  const flake8File = write(flake8Only.root, 'a.py', 'x\n');
  assertLintContext(flake8Only.lint(flake8File), flake8File, 'F401');
  assert.deepEqual(readCalls(flake8Only.calls), [`flake8 ${flake8File}`]);

  const none = lintProject(context, { tools: [], output });
  assert.equal(none.lint(write(none.root, 'a.py', 'x\n')), null);
});

test('lint-on-edit runs phpstan analyse for .php, falling back to vendor/bin/phpstan', context => {
  const output = 'Line 3: Error Undefined variable $x';
  const global = lintProject(context, { tools: ['phpstan'], output });
  const file = write(global.root, 'a.php', '<?php\n');
  assertLintContext(global.lint(file), file, 'Undefined variable');
  assert.deepEqual(readCalls(global.calls), [`phpstan analyse ${file} --no-progress`]);

  const vendor = lintProject(context, { output });
  writeExecutable(vendor.root, 'vendor/bin/phpstan', fakeLinter('vendor-phpstan'));
  const vendorFile = write(vendor.root, 'b.php', '<?php\n');
  assertLintContext(vendor.lint(vendorFile), vendorFile, 'Undefined variable');
  assert.deepEqual(readCalls(vendor.calls), [`vendor-phpstan analyse ${vendorFile} --no-progress`]);
});

test('lint-on-edit stays silent when linter output has no error/warning or is empty', context => {
  for (const output of ['All checks passed!', '']) {
    const project = lintProject(context, { tools: ['ruff'], output });
    assert.equal(project.lint(write(project.root, 'a.py', 'x\n')), null);
    assert.equal(readCalls(project.calls).length, 1);
  }
});

test('lint-on-edit stays silent for unsupported extensions, missing files and missing file_path', context => {
  const project = lintProject(context, { tools: ['npx', 'ruff', 'flake8', 'phpstan'], npxTools: 'tsc eslint' });
  write(project.root, 'tsconfig.json', '{}\n');
  write(project.root, 'eslint.config.js', '\n');
  for (const name of ['a.go', 'a.rb', 'a.md', 'a.json', 'Dockerfile']) assert.equal(project.lint(write(project.root, name, 'x\n')), null);
  assert.equal(project.lint(path.join(project.root, 'missing.ts')), null);
  assert.equal(project.lint(undefined), null);
  assert.deepEqual(readCalls(project.calls), []);
});

// lint-on-edit.sh:62 nói output "found 0 errors"/"no error" không cần báo lại, nhưng grep 'error|warning' ở :63 vẫn khớp nên vẫn báo.
test.todo('lint-on-edit stays silent when linter output only says "Found 0 errors" / "no errors"');
