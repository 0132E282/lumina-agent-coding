import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test, { after } from 'node:test';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const hook = path.join(repoRoot, '.claude/hooks/scripts/dependency-audit-reminder.sh');
const hookViaSymlink = path.join(repoRoot, '.agents/hooks/scripts/dependency-audit-reminder.sh');
const systemPath = '/usr/bin:/bin';
const AUDIT_TOOLS = ['npm', 'yarn', 'pnpm', 'composer', 'pip-audit'];
const VULNERABLE_OUTPUT = 'lodash  <4.17.21  Severity: high  Prototype Pollution';

// Fake package manager: ghi lại lệnh và in $FAKE_OUTPUT, không bao giờ chạm mạng.
// macOS quét mỗi file thực thi mới ở lần chạy đầu, nên fake được tạo một lần cho cả file test.
const fakeRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'dependency-audit-fakes-')));
after(() => fs.rmSync(fakeRoot, { recursive: true, force: true }));
for (const tool of AUDIT_TOOLS) {
  const file = path.join(fakeRoot, `bin-${tool}`, tool);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `#!/bin/bash\nprintf "${tool} %s\\n" "$*" >> "$FAKE_CALLS"\nprintf "%s\\n" "$FAKE_OUTPUT"\nexit 1\n`);
  fs.chmodSync(file, 0o755);
}

function runReminder(context, { command, toolName = 'Bash', tools = AUDIT_TOOLS, output = VULNERABLE_OUTPUT, script = hook }) {
  const project = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'dependency-audit-test-')));
  context.after(() => fs.rmSync(project, { recursive: true, force: true }));
  const calls = path.join(project, 'calls.log');
  const result = spawnSync('bash', [script], {
    cwd: project,
    input: JSON.stringify({ tool_name: toolName, tool_input: command === undefined ? {} : { command } }),
    encoding: 'utf8',
    env: {
      PATH: [...tools.map(tool => path.join(fakeRoot, `bin-${tool}`)), systemPath].join(':'),
      HOME: process.env.HOME,
      CLAUDE_PROJECT_DIR: project,
      FAKE_CALLS: calls,
      FAKE_OUTPUT: output,
    },
  });
  assert.equal(result.status, 0, result.stderr);
  const calledCommands = fs.existsSync(calls) ? fs.readFileSync(calls, 'utf8').split('\n').filter(Boolean) : [];
  return { output: result.stdout.trim() === '' ? null : JSON.parse(result.stdout), calledCommands };
}

const INSTALL_COMMANDS = [
  ['npm install lodash', 'npm audit'],
  ['npm i lodash', 'npm audit'],
  ['npm add lodash', 'npm audit'],
  ['cd app && npm install', 'npm audit'],
  ['yarn add lodash', 'yarn audit'],
  ['yarn install', 'yarn audit'],
  ['composer require monolog/monolog', 'composer audit'],
  ['composer update', 'composer audit'],
  ['pip install requests', 'pip-audit'],
];

for (const [command, auditCommand] of INSTALL_COMMANDS) {
  test(`"${command}" runs "${auditCommand}" and reports vulnerabilities via additionalContext`, context => {
    const { output, calledCommands } = runReminder(context, { command });
    assert.deepEqual(calledCommands, [auditCommand === 'pip-audit' ? 'pip-audit ' : auditCommand]);
    assert.equal(output.hookSpecificOutput.hookEventName, 'PostToolUse');
    const message = output.hookSpecificOutput.additionalContext;
    assert.ok(message.includes(`${auditCommand} báo:`), message);
    assert.ok(message.includes(VULNERABLE_OUTPUT), message);
    assert.match(message, /dependency-audit/);
  });
}

test('works through the .agents/hooks/scripts symlink', context => {
  const { output, calledCommands } = runReminder(context, { command: 'npm install lodash', script: hookViaSymlink });
  assert.deepEqual(calledCommands, ['npm audit']);
  assert.ok(output.hookSpecificOutput.additionalContext.includes(VULNERABLE_OUTPUT));
});

test('"no vulnerabilities" style output or empty output stays silent', context => {
  for (const output of [
    'found 0 vulnerabilities',
    '0 vulnerabilities found - Packages audited: 12',
    'No known vulnerabilities found',
    'No security vulnerability advisories found.',
    '',
  ]) {
    const result = runReminder(context, { command: 'npm install lodash', output });
    assert.deepEqual(result.calledCommands, ['npm audit'], output);
    assert.equal(result.output, null, output);
  }
});

test('non-Bash tool, unrelated command or missing command stays silent without running any audit', context => {
  for (const options of [
    { command: 'npm install lodash', toolName: 'Write' },
    { command: 'npm test' },
    { command: 'npm ci' },
    { command: 'git status' },
    { command: '' },
    { command: undefined },
  ]) {
    const result = runReminder(context, options);
    assert.equal(result.output, null, JSON.stringify(options));
    assert.deepEqual(result.calledCommands, [], JSON.stringify(options));
  }
});

test('missing audit tool stays silent', context => {
  for (const [command, tool] of [['npm install x', 'npm'], ['yarn add x', 'yarn'], ['composer require x', 'composer'], ['pip install x', 'pip-audit']]) {
    const result = runReminder(context, { command, tools: AUDIT_TOOLS.filter(name => name !== tool) });
    assert.equal(result.output, null, command);
    assert.deepEqual(result.calledCommands, [], command);
  }
});

// Regression: *"npm install"*/*"npm add"* từng khớp cả "pnpm install/add", nên pnpm chạy npm audit.
test('"pnpm add <pkg>" runs "pnpm audit", not "npm audit"', context => {
  for (const command of ['pnpm add lodash', 'cd web && pnpm add -D vitest']) {
    const { output, calledCommands } = runReminder(context, { command });
    assert.deepEqual(calledCommands, ['pnpm audit'], command);
    assert.ok(output.hookSpecificOutput.additionalContext.includes('pnpm audit báo:'), command);
  }
});

test('"pnpm install" runs "pnpm audit", not "npm audit"', context => {
  for (const command of ['pnpm install', 'cd web && pnpm install --frozen-lockfile']) {
    const { output, calledCommands } = runReminder(context, { command });
    assert.deepEqual(calledCommands, ['pnpm audit'], command);
    assert.ok(output.hookSpecificOutput.additionalContext.includes('pnpm audit báo:'), command);
  }
});

// Regression: glob *"pnpm install"*/*"yarn add"*... từng khớp chữ nằm trong thân heredoc, chuỗi
// trong nháy, commit message, echo/grep — nên audit thật chạy dù không có lệnh cài nào thực thi.
test('install words inside heredoc data, quoted arguments or messages do not run any audit', context => {
  for (const command of [
    "git commit -F - <<'EOF'\nfix: chặn pnpm install chạy nhầm\nEOF",
    "python3 - <<'EOF'\nprint(\"yarn add x\")\nEOF",
    'echo "composer require foo"',
    'grep -r "pip install" .',
    'git commit -m "npm install docs"',
    "cat <<EOF > notes.md\nRun npm install then pnpm add x\nEOF",
    'printf "%s" "yarn install"',
  ]) {
    const result = runReminder(context, { command });
    assert.deepEqual(result.calledCommands, [], command);
    assert.equal(result.output, null, command);
  }
});

test('executed install after cd, env prefix, wrapper or bash -c still runs the right audit', context => {
  for (const [command, auditCommand] of [
    ['cd web && pnpm add x', 'pnpm audit'],
    ['FOO=1 yarn add x', 'yarn audit'],
    ['bash -c "npm install lodash"', 'npm audit'],
    ['git status; composer update', 'composer audit'],
    ['python -m pip install requests', 'pip-audit '],
    ['python3 -m pip install requests', 'pip-audit '],
    ['pip3 install requests', 'pip-audit '],
    ['pnpm i', 'pnpm audit'],
  ]) {
    const { output, calledCommands } = runReminder(context, { command });
    assert.deepEqual(calledCommands, [auditCommand], command);
    assert.ok(output.hookSpecificOutput.additionalContext.includes(VULNERABLE_OUTPUT), command);
  }
});
