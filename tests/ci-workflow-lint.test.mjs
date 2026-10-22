import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test, { after } from 'node:test';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const hook = path.join(repoRoot, '.claude/hooks/scripts/ci-workflow-lint.sh');
const hookViaSymlink = path.join(repoRoot, '.agents/hooks/scripts/ci-workflow-lint.sh');
const systemPath = '/usr/bin:/bin';
const LINT_OUTPUT = 'ci.yml:3:5: "runs-on" section is missing in job "build"';

// macOS quét mỗi file thực thi mới ở lần chạy đầu, nên fake linter được tạo một lần cho cả file test.
const fakeRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'ci-workflow-lint-fakes-')));
after(() => fs.rmSync(fakeRoot, { recursive: true, force: true }));
for (const tool of ['actionlint', 'yamllint']) {
  const file = path.join(fakeRoot, `bin-${tool}`, tool);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `#!/bin/bash\nprintf "${tool} %s\\n" "$*" >> "$FAKE_CALLS"\nprintf "%s\\n" "$FAKE_OUTPUT"\nexit 1\n`);
  fs.chmodSync(file, 0o755);
}

function workflowProject(context) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'ci-workflow-lint-test-')));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const calls = path.join(root, 'calls.log');
  const file = relativePath => {
    const absolute = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, 'name: ci\n');
    return absolute;
  };
  const lint = (filePath, { tools = ['actionlint', 'yamllint'], output = LINT_OUTPUT, script = hook } = {}) => {
    fs.rmSync(calls, { force: true });
    const result = spawnSync('bash', [script], {
      cwd: root,
      input: JSON.stringify({ tool_name: 'Edit', tool_input: filePath === undefined ? {} : { file_path: filePath } }),
      encoding: 'utf8',
      env: {
        PATH: [...tools.map(tool => path.join(fakeRoot, `bin-${tool}`)), systemPath].join(':'),
        HOME: process.env.HOME,
        CLAUDE_PROJECT_DIR: root,
        FAKE_CALLS: calls,
        FAKE_OUTPUT: output,
      },
    });
    assert.equal(result.status, 0, result.stderr);
    const calledCommands = fs.existsSync(calls) ? fs.readFileSync(calls, 'utf8').split('\n').filter(Boolean) : [];
    return { output: result.stdout.trim() === '' ? null : JSON.parse(result.stdout), calledCommands };
  };
  return { file, lint };
}

function assertReported(output, filePath) {
  assert.ok(output, 'expected additionalContext output');
  assert.equal(output.hookSpecificOutput.hookEventName, 'PostToolUse');
  const message = output.hookSpecificOutput.additionalContext;
  assert.ok(message.includes(filePath), message);
  assert.ok(message.includes(LINT_OUTPUT), message);
  assert.match(message, /ci-pipeline/);
}

test('GitHub Actions workflows (.yml/.yaml) are linted with actionlint in preference to yamllint', context => {
  const project = workflowProject(context);
  for (const name of ['.github/workflows/ci.yml', '.github/workflows/release.yaml']) {
    const file = project.file(name);
    const { output, calledCommands } = project.lint(file);
    assertReported(output, file);
    assert.deepEqual(calledCommands, [`actionlint ${file}`]);
  }
});

test('GitHub Actions workflows fall back to yamllint when actionlint is missing', context => {
  const project = workflowProject(context);
  const file = project.file('.github/workflows/ci.yml');
  const { output, calledCommands } = project.lint(file, { tools: ['yamllint'] });
  assertReported(output, file);
  assert.deepEqual(calledCommands, [`yamllint ${file}`]);
});

test('GitLab CI and Azure Pipelines files are linted with yamllint only', context => {
  const project = workflowProject(context);
  for (const name of ['.gitlab-ci.yml', 'azure-pipelines.yml', 'nested/azure-pipelines.yaml']) {
    const file = project.file(name);
    const { output, calledCommands } = project.lint(file);
    assertReported(output, file);
    assert.deepEqual(calledCommands, [`yamllint ${file}`], name);
    assert.equal(project.lint(file, { tools: ['actionlint'] }).output, null, name);
  }
});

test('works through the .agents/hooks/scripts symlink', context => {
  const project = workflowProject(context);
  const file = project.file('.github/workflows/ci.yml');
  assertReported(project.lint(file, { script: hookViaSymlink }).output, file);
});

test('non-workflow files are ignored without running a linter', context => {
  const project = workflowProject(context);
  for (const name of ['docker-compose.yml', '.github/dependabot.yml', '.github/workflows/README.md', 'gitlab-ci.yml', 'src/app.ts']) {
    const result = project.lint(project.file(name));
    assert.equal(result.output, null, name);
    assert.deepEqual(result.calledCommands, [], name);
  }
});

test('silent when the linter prints nothing, no linter is installed, or the file/file_path is missing', context => {
  const project = workflowProject(context);
  const file = project.file('.github/workflows/ci.yml');
  const clean = project.lint(file, { output: '' });
  assert.equal(clean.output, null);
  assert.deepEqual(clean.calledCommands, [`actionlint ${file}`]);
  assert.equal(project.lint(file, { tools: [] }).output, null);
  assert.equal(project.lint(path.join(path.dirname(file), 'missing.yml')).output, null);
  assert.equal(project.lint(undefined).output, null);
});
