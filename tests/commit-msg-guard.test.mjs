import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const hook = path.join(repoRoot, '.claude/hooks/scripts/commit-msg-guard.sh');

function decisionOf(command) {
  const environment = { ...process.env };
  delete environment.CLAUDE_PROJECT_DIR;
  const result = spawnSync('bash', [hook], {
    cwd: repoRoot,
    input: JSON.stringify({ tool_name: 'Bash', tool_input: { command } }),
    encoding: 'utf8',
    env: environment,
  });
  assert.equal(result.status, 0, result.stderr);
  if (result.stdout.trim() === '') return null;
  return JSON.parse(result.stdout).hookSpecificOutput.permissionDecision;
}

test('git commit text inside heredoc data of another command is not treated as a commit', () => {
  const command = [
    "python3 - <<'EOF'",
    "p='docs/repo/example.md'; s=open(p).read()",
    "s += 'Run: git commit -m \"fix: handle empty cart\"\\n'",
    "open(p,'w').write(s)",
    'EOF',
  ].join('\n');
  assert.equal(decisionOf(command), null);
});

test('git commit text inside a quoted argument is not treated as a commit', () => {
  assert.equal(decisionOf("echo 'remember to git commit -m \"bad message\"'"), null);
  assert.equal(decisionOf("grep -n 'git commit' README.md"), null);
});

test('invalid message on an executed git commit is still denied', () => {
  assert.equal(decisionOf('git commit -m "bad message"'), 'deny');
  assert.equal(decisionOf('git add a.txt && git commit -m "bad message"'), 'deny');
  assert.equal(decisionOf('cd repo; git commit -m "bad message"'), 'deny');
  assert.equal(decisionOf('git -C repo commit -m "bad message"'), 'deny');
  assert.equal(decisionOf("git commit -m \"$(cat <<'EOF'\nbad message\nEOF\n)\""), 'deny');
});

test('valid message on an executed git commit is allowed', () => {
  assert.equal(decisionOf('git commit -m "fix: handle empty cart"'), null);
  assert.equal(decisionOf("git commit -m \"$(cat <<'EOF'\nfix(api): reject empty payload\n\nBody.\nEOF\n)\""), null);
});
