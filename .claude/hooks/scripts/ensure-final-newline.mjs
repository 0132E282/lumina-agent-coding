#!/usr/bin/env node
import * as fs from 'node:fs';
import path from 'node:path';

const extensions = new Set(['.txt', '.md', '.mdx', '.json', '.jsonc', '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.py', '.php', '.sh', '.bash', '.zsh', '.toml', '.yaml', '.yml', '.sql', '.css', '.scss', '.sass', '.less', '.html', '.htm', '.xml', '.svg', '.csv', '.tsv', '.ini', '.conf', '.cfg', '.properties', '.vue', '.svelte', '.go', '.rs', '.rb', '.java', '.kt', '.kts', '.c', '.h', '.cpp', '.hpp', '.cs', '.swift', '.graphql', '.gql']);
const names = new Set(['.editorconfig', '.gitignore', '.gitattributes', '.npmrc', '.nvmrc', '.prettierrc', '.eslintrc', '.dockerignore', 'Makefile', 'Dockerfile', 'LICENSE', 'Gemfile', 'Procfile', 'config']);
const help = `Usage: node ensure-final-newline.mjs --check PATH... | --write PATH...
Without arguments, reads a Claude PostToolUse Edit/Write payload from stdin.
--check is read-only; exits 1 for missing final newline or file errors.
--write adds only a missing final LF (CRLF when present); preserves permissions,
existing blank lines and all other bytes. Empty files are unchanged.
Only recognized UTF-8 text extensions/config names are inspected. Unsupported,
binary (NUL), invalid UTF-8, symlink and nonregular files are skipped.
Hook fixes only its touched file inside real payload.cwd; outside paths and
parent symlink escapes are skipped. Hook errors never block the tool (exit 0).
Output contains paths/status only; no file contents or shell execution.
`;

function supported(filePath) {
  const basename = path.basename(filePath);
  return extensions.has(path.extname(basename).toLowerCase()) || names.has(basename) || basename === '.env' || basename.startsWith('.env.');
}

function withinRoot(filePath, root) {
  const relative = path.relative(root, filePath);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function inspect(filePath, write, root) {
  if (!supported(filePath)) return 'skipped';
  const stat = fs.lstatSync(filePath);
  if (!stat.isFile() || stat.isSymbolicLink()) return 'skipped';
  if (root && !withinRoot(fs.realpathSync(filePath), root)) return 'skipped';
  const descriptor = fs.openSync(filePath, (write ? fs.constants.O_RDWR : fs.constants.O_RDONLY) | fs.constants.O_NOFOLLOW);
  try {
    const opened = fs.fstatSync(descriptor);
    if (!opened.isFile()) return 'skipped';
    const buffer = fs.readFileSync(descriptor);
    if (buffer.length === 0 || buffer.includes(0)) return 'skipped';
    let text;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      return 'skipped';
    }
    if (buffer.at(-1) === 10) return 'unchanged';
    if (!write) return 'missing';
    const current = fs.fstatSync(descriptor);
    if (current.size !== opened.size || current.mtimeMs !== opened.mtimeMs) throw new Error('File changed during inspection.');
    const newline = text.endsWith('\r') ? '\n' : text.includes('\r\n') ? '\r\n' : '\n';
    fs.writeSync(descriptor, newline, buffer.length, 'utf8');
    return 'corrected';
  } finally {
    fs.closeSync(descriptor);
  }
}

function emitContext(text) {
  process.stdout.write(`${JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: text } })}\n`);
}

async function runHook() {
  try {
    let input = '';
    for await (const chunk of process.stdin) input += chunk;
    const payload = JSON.parse(input);
    if (payload?.hook_event_name !== 'PostToolUse' || !['Edit', 'Write'].includes(payload.tool_name)) return;
    const touchedPath = payload.tool_input?.file_path;
    if (typeof touchedPath !== 'string' || !touchedPath || typeof payload.cwd !== 'string' || !path.isAbsolute(payload.cwd)) {
      emitContext('Final newline: không kiểm tra được file_path/cwd của tool.');
      return;
    }
    const root = fs.realpathSync(payload.cwd);
    const target = path.resolve(root, touchedPath);
    if (!withinRoot(target, root)) return;
    const status = inspect(target, true, root);
    if (status === 'corrected') emitContext(`Final newline: đã thêm newline cuối file ${JSON.stringify(touchedPath)}.`);
  } catch {
    emitContext('Final newline: không thể kiểm tra/sửa file vừa thao tác; chạy --check trên file khi có thể.');
  }
}

const argumentsList = process.argv.slice(2);
// ! Hook mode: bỏ qua nếu project đã có cùng hook (tránh chạy 2 lần với bản user-level).
function projectOwnsHook() {
  try {
    const ownDirectory = fs.realpathSync(path.dirname(new URL(import.meta.url).pathname));
    const projectDirectory = fs.realpathSync(path.join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), '.claude/hooks/scripts'));
    return ownDirectory !== projectDirectory && fs.existsSync(path.join(projectDirectory, path.basename(process.argv[1])));
  } catch {
    return false;
  }
}

if (argumentsList.length === 0) {
  if (!projectOwnsHook()) await runHook();
} else if (argumentsList.length === 1 && argumentsList[0] === '--help') {
  process.stdout.write(help);
} else if (!['--check', '--write'].includes(argumentsList[0]) || argumentsList.length < 2) {
  process.stderr.write('Use --check PATH..., --write PATH... or --help.\n');
  process.exitCode = 1;
} else {
  for (const filePath of argumentsList.slice(1)) {
    try {
      const status = inspect(filePath, argumentsList[0] === '--write');
      if (status === 'missing') {
        process.stderr.write(`Missing final newline: ${JSON.stringify(filePath)}\n`);
        process.exitCode = 1;
      } else if (status === 'corrected') {
        process.stdout.write(`Added final newline: ${JSON.stringify(filePath)}\n`);
      }
    } catch {
      process.stderr.write(`Cannot inspect file: ${JSON.stringify(filePath)}\n`);
      process.exitCode = 1;
    }
  }
}
