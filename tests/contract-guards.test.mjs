import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const scripts = path.join(repoRoot, '.claude/hooks/scripts');
// Giá trị giả, dựng bằng nối chuỗi để chính file test không khớp pattern secret.
const fakePrivateKeyHeader = '-----BEGIN RSA ' + 'PRIVATE KEY-----';

function temporaryDirectory(context) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'contract-guards-')));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

// PATH chỉ có các tool mà hook cần để tới bước `command -v`, thêm tool trong `include`.
function restrictedPath(context, include = []) {
  const bin = temporaryDirectory(context);
  for (const name of ['dirname', 'basename', 'cat', ...include]) {
    const found = spawnSync('bash', ['-c', `command -v ${name}`], { encoding: 'utf8' }).stdout.trim();
    fs.symlinkSync(found, path.join(bin, name));
  }
  return bin;
}

function runHook(script, payload, { cwd = repoRoot, projectDir, pathOverride } = {}) {
  const environment = { ...process.env };
  delete environment.CLAUDE_PROJECT_DIR;
  if (projectDir !== undefined) environment.CLAUDE_PROJECT_DIR = projectDir;
  if (pathOverride !== undefined) environment.PATH = pathOverride;
  const result = spawnSync('/bin/bash', [path.join(scripts, script)], {
    cwd,
    input: JSON.stringify({ cwd, ...payload }),
    encoding: 'utf8',
    env: environment,
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim() === '' ? null : JSON.parse(result.stdout).hookSpecificOutput;
}

const writePayload = (filePath, extra = {}, toolName = 'Write') => ({ tool_name: toolName, tool_input: { file_path: filePath, ...extra } });

// write-path-guard

function pathGuard(context, filePath, extra, options = {}) {
  const project = temporaryDirectory(context);
  return { project, output: runHook('write-path-guard.sh', writePayload(filePath(project), extra), { cwd: project, projectDir: project, ...options }) };
}

test('write-path-guard denies .env and .env.* files but allows templates', (context) => {
  for (const name of ['.env', '.env.local', '.env.production', 'app/.env']) {
    const { output } = pathGuard(context, (project) => path.join(project, name), { content: 'A=1' });
    assert.equal(output?.permissionDecision, 'deny', name);
    assert.doesNotMatch(output.permissionDecisionReason, /A=1/);
  }
  for (const name of ['.env.example', '.env.sample', '.env.template', '.env.dist', 'environment.ts']) {
    const { output } = pathGuard(context, (project) => path.join(project, name), { content: 'A=1' });
    assert.equal(output, null, name);
  }
});

test('write-path-guard denies private key content without echoing it', (context) => {
  const { output } = pathGuard(context, (project) => path.join(project, 'notes.txt'), { content: `${fakePrivateKeyHeader}\nabc` });
  assert.equal(output.permissionDecision, 'deny');
  assert.doesNotMatch(output.permissionDecisionReason, /BEGIN/);
  const edit = pathGuard(context, (project) => path.join(project, 'a.txt'), { new_string: fakePrivateKeyHeader }).output;
  assert.equal(edit.permissionDecision, 'deny');
  assert.equal(pathGuard(context, (project) => path.join(project, 'a.txt'), { content: 'plain text' }).output, null);
});

test('write-path-guard denies plan and agent config outside the project', (context) => {
  const outside = temporaryDirectory(context);
  for (const relative of ['.claude/plans/p.md', '.codex/config.toml', '.gemini/x.md', 'repo/plans/p.json']) {
    const { output } = pathGuard(context, () => path.join(outside, relative));
    assert.equal(output?.permissionDecision, 'deny', relative);
    assert.match(output.permissionDecisionReason, /docs\/plans/);
  }
});

test('write-path-guard normalizes ~ and .. before matching', (context) => {
  const home = temporaryDirectory(context);
  const project = temporaryDirectory(context);
  const check = (filePath) => {
    const result = spawnSync('/bin/bash', [path.join(scripts, 'write-path-guard.sh')], {
      cwd: project,
      input: JSON.stringify({ cwd: project, ...writePayload(filePath) }),
      encoding: 'utf8',
      env: { ...process.env, HOME: home, CLAUDE_PROJECT_DIR: project },
    });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim() === '' ? null : JSON.parse(result.stdout).hookSpecificOutput.permissionDecision;
  };
  assert.equal(check('~/.claude/plans/p.md'), 'deny');
  assert.equal(check(`${project}/../${path.basename(home)}/.codex/x.md`), 'deny');
  assert.equal(check('../plans/p.json'), 'deny');
  // Thoát ra ngoài rồi quay lại project qua `..` vẫn là trong project.
  assert.equal(check(`${project}/sub/../docs/plans/p.json`), null);
});

test('write-path-guard resolves a symlinked parent directory', (context) => {
  const outside = temporaryDirectory(context);
  const project = temporaryDirectory(context);
  fs.mkdirSync(path.join(outside, '.claude/plans'), { recursive: true });
  fs.symlinkSync(path.join(outside, '.claude/plans'), path.join(project, 'link'));
  const output = runHook('write-path-guard.sh', writePayload(path.join(project, 'link/p.md')), { cwd: project, projectDir: project });
  assert.equal(output?.permissionDecision, 'deny', 'symlink trong project trỏ ra ngoài vẫn bị xét theo đường dẫn thực');
});

test('write-path-guard allows project paths and non-plan writes outside the project', (context) => {
  const project = temporaryDirectory(context);
  const outside = temporaryDirectory(context);
  const allowed = [
    path.join(project, 'docs/plans/p.json'),
    path.join(project, '.claude/plans/p.md'),
    path.join(outside, '.claude/projects/-x/memory/note.md'),
    path.join(outside, 'Documents/backup/agents/claude-20260101/settings.json'),
    path.join(outside, 'scratchpad/out.txt'),
    path.join(outside, 'evidence/shot.png'),
  ];
  for (const filePath of allowed) {
    assert.equal(runHook('write-path-guard.sh', writePayload(filePath), { cwd: project, projectDir: project }), null, filePath);
  }
});

test('write-path-guard ignores other tools and does nothing without jq', (context) => {
  const project = temporaryDirectory(context);
  const options = { cwd: project, projectDir: project };
  assert.equal(runHook('write-path-guard.sh', { tool_name: 'Read', tool_input: { file_path: path.join(project, '.env') } }, options), null);
  const pathOverride = restrictedPath(context);
  assert.equal(runHook('write-path-guard.sh', writePayload(path.join(project, '.env')), { ...options, pathOverride }), null);
});

// main-session-code-guard

const mainGuard = (project, filePath, extra = {}) =>
  runHook('main-session-code-guard.sh', { ...writePayload(filePath, {}, 'Edit'), ...extra }, { cwd: project, projectDir: project })?.permissionDecision ?? null;

test('main-session-code-guard asks for code files in the main session', (context) => {
  const project = temporaryDirectory(context);
  for (const name of ['src/app.ts', 'bin/tool.mjs', 'scripts/run.sh', 'index.php', 'tests/a.test.mjs']) {
    assert.equal(mainGuard(project, path.join(project, name)), 'ask', name);
  }
  assert.equal(mainGuard(project, 'src/app.ts'), 'ask', 'relative path');
});

test('main-session-code-guard allows config and docs in the main session', (context) => {
  const project = temporaryDirectory(context);
  for (const name of ['README.md', 'AGENTS.md', 'CLAUDE.md', 'CONTRACT.md', 'package.json', 'a.toml', 'ci.yml', 'ci.yaml',
    '.agents/hooks/scripts/x.sh', '.claude/hooks/scripts/x.sh', '.codex/x.py', 'docs/a.txt', '.github/workflows/x.sh']) {
    assert.equal(mainGuard(project, path.join(project, name)), null, name);
  }
});

test('main-session-code-guard lets subagents and outside files through', (context) => {
  const project = temporaryDirectory(context);
  const outside = temporaryDirectory(context);
  assert.equal(mainGuard(project, path.join(project, 'src/app.ts'), { agent_id: 'agent-1' }), null);
  assert.equal(mainGuard(project, path.join(outside, 'src/app.ts')), null);
  assert.equal(runHook('main-session-code-guard.sh', { tool_name: 'Read', tool_input: { file_path: path.join(project, 'a.ts') } }, { cwd: project, projectDir: project }), null);
});

test('main-session-code-guard does nothing without jq', (context) => {
  const project = temporaryDirectory(context);
  const pathOverride = restrictedPath(context);
  assert.equal(runHook('main-session-code-guard.sh', writePayload(path.join(project, 'src/app.ts')), { cwd: project, projectDir: project, pathOverride }), null);
});

// db-write-guard

const dbGuard = (command, options = {}) => runHook('db-write-guard.sh', { tool_name: 'Bash', tool_input: { command } }, options)?.permissionDecision ?? null;

test('db-write-guard asks on SQL writes through database clients', () => {
  for (const command of [
    'psql -c "INSERT INTO t VALUES (1)" db',
    'mysql -e "update t set a=1"',
    'mariadb -e "DROP TABLE t"',
    'sqlite3 app.db "DELETE FROM t"',
    'sqlite3 app.db "ALTER TABLE t ADD c int"',
    'psql db -c "TRUNCATE t"',
    'mysql -e "CREATE DATABASE x"',
    'redis-cli FLUSHALL',
    'redis-cli flushdb',
    'cd app && psql db -c "delete from t"',
    "psql db <<'EOF'\nINSERT INTO t VALUES (1);\nEOF",
    'bash -c "mysql -e \\"drop table x\\""',
  ]) {
    assert.equal(dbGuard(command), 'ask', command);
  }
});

test('db-write-guard asks on migrate and seed commands', () => {
  for (const command of [
    'php artisan migrate',
    'php artisan migrate:fresh --seed',
    'php artisan db:seed',
    'npx prisma migrate dev',
    'prisma db push',
    'prisma db seed',
    'bin/rails db:migrate',
    'rails db:seed',
    'npx knex migrate:latest',
    'knex seed:run',
    'alembic upgrade head',
    'npx sequelize db:migrate',
    'sequelize-cli db:seed:all',
    'npx typeorm migration:run',
  ]) {
    assert.equal(dbGuard(command), 'ask', command);
  }
});

test('db-write-guard allows reads and mentions inside data', () => {
  for (const command of [
    'psql -c "SELECT * FROM users WHERE updated_at > now()" db',
    'sqlite3 app.db ".tables"',
    'redis-cli GET key',
    'echo "psql -c \'DROP TABLE t\'"',
    'echo "php artisan migrate"',
    'grep -n "prisma migrate" README.md',
    'php artisan route:list',
    'npx prisma generate',
    'git commit -m "docs: explain insert and delete"',
    'ls',
  ]) {
    assert.equal(dbGuard(command), null, command);
  }
});

test('db-write-guard does nothing without jq', (context) => {
  const pathOverride = restrictedPath(context);
  assert.equal(dbGuard('redis-cli FLUSHALL', { pathOverride }), null);
});

// deps-check

test('deps-check stays silent when jq and node are available', () => {
  assert.equal(runHook('deps-check.sh', { hook_event_name: 'SessionStart' }), null);
});

test('deps-check reports every missing tool as valid SessionStart context', (context) => {
  const none = runHook('deps-check.sh', {}, { pathOverride: restrictedPath(context) });
  assert.equal(none.hookEventName, 'SessionStart');
  assert.match(none.additionalContext, /Thiếu jq, node/);
  const jqOnly = runHook('deps-check.sh', {}, { pathOverride: restrictedPath(context, ['jq']) });
  assert.match(jqOnly.additionalContext, /Thiếu node trong PATH/);
  const nodeOnly = runHook('deps-check.sh', {}, { pathOverride: restrictedPath(context, [path.basename(process.execPath)]) });
  assert.match(nodeOnly.additionalContext, /Thiếu jq trong PATH/);
});

test('hooks run outside a git repository when CLAUDE_PROJECT_DIR is set', (context) => {
  const project = temporaryDirectory(context);
  const result = spawnSync('bash', ['-c', 'bash "$CLAUDE_PROJECT_DIR/.agents/hooks/scripts/write-path-guard.sh"'], {
    cwd: temporaryDirectory(context),
    input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: path.join(project, '.env'), content: 'A=1' } }),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: repoRoot },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).hookSpecificOutput.permissionDecision, 'deny');
});
