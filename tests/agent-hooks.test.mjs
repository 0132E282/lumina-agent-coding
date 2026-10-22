import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const scripts = path.join(repoRoot, '.claude/hooks/scripts');

function runAgentHook(script, toolInput) {
  const environment = { ...process.env };
  delete environment.CLAUDE_PROJECT_DIR;
  const result = spawnSync('bash', [path.join(scripts, script)], {
    cwd: repoRoot,
    input: JSON.stringify({ tool_name: 'Agent', tool_input: toolInput }),
    encoding: 'utf8',
    env: environment,
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim() === '' ? null : JSON.parse(result.stdout).hookSpecificOutput;
}

test('agent-role-reminder asks on a short prompt for each heavy role name', () => {
  for (const role of ['analyst', 'planner', 'architect', 'reviewer', 'qa-tester', 'researcher']) {
    const output = runAgentHook('agent-role-reminder.sh', { subagent_type: role, prompt: 'short' });
    assert.equal(output.permissionDecision, 'ask', role);
    assert.match(output.permissionDecisionReason, /giao thẳng coder/);
  }
});

test('agent-role-reminder only informs for coder and for long heavy-role prompts', () => {
  const coder = runAgentHook('agent-role-reminder.sh', { subagent_type: 'coder', prompt: 'short' });
  assert.equal(coder.permissionDecision, 'allow');
  assert.equal(coder.permissionDecisionReason, 'Đang giao task cho agent: coder.');
  const longPlanner = runAgentHook('agent-role-reminder.sh', { subagent_type: 'planner', prompt: 'x'.repeat(150) });
  assert.equal(longPlanner.permissionDecision, 'allow');
});

test('condense-planner-input condenses an oversized prompt for subagent_type planner', () => {
  const prompt = `${'a'.repeat(13000)}${'m'.repeat(10000)}${'z'.repeat(6000)}`;
  const output = runAgentHook('condense-planner-input.sh', { subagent_type: 'planner', description: 'plan', prompt });
  assert.equal(output.updatedInput.subagent_type, 'planner');
  assert.equal(output.updatedInput.description, 'plan');
  assert.ok(output.updatedInput.prompt.length < prompt.length);
  assert.ok(output.updatedInput.prompt.startsWith('a'.repeat(13000)));
  assert.ok(output.updatedInput.prompt.endsWith('z'.repeat(6000)));
  assert.doesNotMatch(output.updatedInput.prompt, /m{10}/);
});

test('condense-planner-input leaves other roles and short planner prompts untouched', () => {
  const longPrompt = 'x'.repeat(25000);
  assert.equal(runAgentHook('condense-planner-input.sh', { subagent_type: 'coder', prompt: longPrompt }), null);
  assert.equal(runAgentHook('condense-planner-input.sh', { subagent_type: 'planner', prompt: 'short' }), null);
});
