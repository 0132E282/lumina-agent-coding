#!/usr/bin/env node
// Lưu trữ dùng chung của hook: MỘT file log và MỘT file state mỗi ngày (giờ LOCAL của máy), giữ N ngày gần nhất.
//   <root>/.agents/storage/logs/logs-YYYYMMDD.jsonl    JSON Lines, writer chỉ append
//   <root>/.agents/storage/state/state-YYYYMMDD.json   { "<session_id>": { "<key>": <json> } }, ghi atomic dưới lock
// Cùng quy ước với _hook-storage.sh (writer bash); mọi writer/reader phải đi qua hai helper này.
//
// Env: LUMINA_STORAGE_KEEP_DAYS (mặc định 7, tính cả hôm nay).
// Dọn file cũ chạy một lần mỗi khi file của ngày mới được tạo. File cũ trước khi có chính sách này
// (logs.jsonl, logs-<ngày>-<giờ>.jsonl, <session>.*.json, report-reminder-*) bị dọn theo mtime cũ hơn N ngày.
//
// CLI (dùng cho hook bash; luôn exit 0, best-effort):
//   node _hook-storage.mjs prune <root>
//   node _hook-storage.mjs state-get <root> <session_id> <key>     in JSON của key, không có thì không in gì
//   node _hook-storage.mjs state-set <root> <session_id> <key>     giá trị JSON đọc từ stdin
//   node _hook-storage.mjs state-push <root> <session_id> <key>    mỗi dòng stdin thêm vào mảng (không trùng)
import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_KEEP_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const LOCK_WAIT_MS = 5000;
const LOCK_STALE_MS = 10000;
const DATED_LOG = /^logs-(\d{8})\.jsonl$/;
const DATED_STATE = /^state-(\d{8})\.json$/;
const LEGACY_LOG = /^logs(-\d{8}-\d{6}(-\d+)?)?\.jsonl$/;
const LEGACY_STATE = /^(report-reminder-.+|.+\.(turn\.json|emitted\.json|checked|cleanup-reminded)|[A-Za-z0-9_-]+\.json)$/;

export function keepDays() {
  const configured = process.env.LUMINA_STORAGE_KEEP_DAYS ?? '';
  return /^[0-9]+$/.test(configured) && Number(configured) > 0 ? Number(configured) : DEFAULT_KEEP_DAYS;
}

export function dayStamp(date = new Date()) {
  const pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

export const logDirectoryOf = root => path.join(root, '.agents/storage/logs');
export const stateDirectoryOf = root => path.join(root, '.agents/storage/state');

function oldestKeptStamp() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (keepDays() - 1));
  return dayStamp(cutoff);
}

function removeQuietly(file) {
  try {
    fs.rmSync(file, { force: true });
  } catch {
    // Dọn file là best-effort: file đang bị tiến trình khác giữ thì để lần sau.
  }
}

function namesIn(directory) {
  try {
    return fs.readdirSync(directory);
  } catch {
    return [];
  }
}

function pruneDirectory(directory, datedPattern, legacyPattern) {
  const oldest = oldestKeptStamp();
  const legacyCutoff = Date.now() - keepDays() * DAY_MS;
  for (const name of namesIn(directory)) {
    const file = path.join(directory, name);
    const dated = datedPattern.exec(name);
    if (dated) {
      if (dated[1] < oldest) removeQuietly(file);
      continue;
    }
    if (!legacyPattern.test(name)) continue;
    try {
      const stat = fs.statSync(file);
      if (stat.isFile() && stat.mtimeMs < legacyCutoff) removeQuietly(file);
    } catch {
      // File biến mất giữa readdir và stat: bỏ qua.
    }
  }
}

export function pruneStorage(root) {
  pruneDirectory(logDirectoryOf(root), DATED_LOG, LEGACY_LOG);
  pruneDirectory(stateDirectoryOf(root), DATED_STATE, LEGACY_STATE);
}

// Đường dẫn log của hôm nay; tạo thư mục, và dọn file cũ ở lần đầu của ngày.
export function todayLogFile(root) {
  const directory = logDirectoryOf(root);
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, `logs-${dayStamp()}.jsonl`);
  if (!fs.existsSync(file)) {
    pruneDirectory(directory, DATED_LOG, LEGACY_LOG);
    fs.closeSync(fs.openSync(file, 'a'));
  }
  return file;
}

function datedFiles(directory, pattern) {
  return namesIn(directory).filter(name => pattern.test(name)).sort().map(name => path.join(directory, name));
}

// File log theo ngày còn trong cửa sổ giữ, cũ → mới.
export const datedLogFiles = root => datedFiles(logDirectoryOf(root), DATED_LOG);

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function withLock(lockPath, action) {
  const deadline = Date.now() + LOCK_WAIT_MS;
  for (;;) {
    try {
      fs.mkdirSync(lockPath);
      break;
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      try {
        if (Date.now() - fs.statSync(lockPath).mtimeMs > LOCK_STALE_MS) fs.rmSync(lockPath, { recursive: true, force: true });
      } catch {
        // Lock vừa được nhả: thử lại ngay.
      }
      if (Date.now() > deadline) throw new Error('state lock timeout');
      sleep(15);
    }
  }
  try {
    return action();
  } finally {
    try {
      fs.rmdirSync(lockPath);
    } catch {
      // Lock đã bị tiến trình khác coi là stale và gỡ.
    }
  }
}

function readStateFile(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? Object.assign(Object.create(null), parsed) : Object.create(null);
  } catch {
    return Object.create(null);
  }
}

// Record của session: file ngày mới nhất có session đó (session vắt qua nửa đêm vẫn thấy state hôm qua).
export function readSessionState(root, sessionId) {
  const files = datedFiles(stateDirectoryOf(root), DATED_STATE);
  for (let index = files.length - 1; index >= 0; index -= 1) {
    const sessions = readStateFile(files[index]);
    if (sessionId in sessions && sessions[sessionId] && typeof sessions[sessionId] === 'object') return sessions[sessionId];
  }
  return Object.create(null);
}

// Đọc-sửa-ghi record session vào state của hôm nay, atomic (temp + rename) và loại trừ nhau bằng lock.
export function updateSessionState(root, sessionId, mutate) {
  const directory = stateDirectoryOf(root);
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, `state-${dayStamp()}.json`);
  return withLock(`${file}.lock`, () => {
    const isNewDay = !fs.existsSync(file);
    const sessions = readStateFile(file);
    const record = Object.assign(Object.create(null), sessionId in sessions ? sessions[sessionId] : readSessionState(root, sessionId));
    const result = mutate(record);
    sessions[sessionId] = record;
    const temporary = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify(sessions)}\n`);
    fs.renameSync(temporary, file);
    if (isNewDay) pruneDirectory(directory, DATED_STATE, LEGACY_STATE);
    return result;
  });
}

export function getSessionValue(root, sessionId, key) {
  const record = readSessionState(root, sessionId);
  return key in record ? record[key] : undefined;
}

export function setSessionValue(root, sessionId, key, value) {
  updateSessionState(root, sessionId, record => {
    record[key] = value;
  });
}

// Thêm các dòng chưa có vào mảng; trả về số dòng đã thêm.
export function pushSessionValues(root, sessionId, key, values) {
  return updateSessionState(root, sessionId, record => {
    const current = Array.isArray(record[key]) ? record[key] : [];
    const added = values.filter((value, index) => !current.includes(value) && values.indexOf(value) === index);
    record[key] = [...current, ...added];
    return added.length;
  });
}

function runCli(argv) {
  const [command, root, sessionId, key] = argv;
  if (!root) return;
  if (command === 'prune') {
    pruneStorage(root);
    return;
  }
  if (!sessionId || !key) return;
  if (command === 'state-get') {
    const value = getSessionValue(root, sessionId, key);
    if (value !== undefined) process.stdout.write(`${JSON.stringify(value)}\n`);
  } else if (command === 'state-set') {
    setSessionValue(root, sessionId, key, JSON.parse(fs.readFileSync(0, 'utf8')));
  } else if (command === 'state-push') {
    pushSessionValues(root, sessionId, key, fs.readFileSync(0, 'utf8').split('\n').filter(Boolean));
  }
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  try {
    runCli(process.argv.slice(2));
  } catch {
    // Best-effort: hook phụ trợ không được làm hỏng phiên.
  }
}
