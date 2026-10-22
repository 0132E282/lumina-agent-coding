---
title: Giao Codex - CLI thống kê token Claude dùng để code
description: Bàn giao cho Codex xây lệnh `lumina-agent usage` đọc transcript Claude Code và logs.jsonl để thống kê token theo phiên, lượt, subagent và ngày; dùng khi triển khai hoặc review CLI token.
tags:
  - handoff
  - codex
  - cli
  - token-usage
  - claude-code
---

# Giao Codex: CLI thống kê token Claude dùng để code

## Mục tiêu

Thêm lệnh `lumina-agent usage` vào CLI có sẵn [`bin/lumina-agent.mjs`](../../bin/lumina-agent.mjs) để người dùng xem Claude Code đã tiêu bao nhiêu token khi code: theo phiên, theo lượt (yêu cầu của người dùng), theo subagent và theo ngày. Chỉ đọc dữ liệu local, không gọi mạng, không sửa transcript/log.

## Trước khi làm

- Đọc `AGENTS.md`, `CONTRACT.md`, toàn bộ `.agents/rules/`; làm theo vai trò `coder` ([`.claude/agents/coder.md`](../../.claude/agents/coder.md)) qua `$workflow-implement`.
- Không commit/push. Không cài dependency mới (Node >= 20, chỉ dùng thư viện chuẩn).
- Không đụng `~/.claude`, `~/.codex` ngoài việc **đọc** transcript.

## Nguồn dữ liệu (đã có, dùng lại)

| Nguồn | Vị trí | Ghi chú |
|---|---|---|
| Transcript phiên chính | `~/.claude/projects/<project-slug>/<session-id>.jsonl` | `<project-slug>` = đường dẫn project, `/` thay bằng `-`. Mỗi assistant message có `message.usage` (`input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`) và `message.id`. |
| Transcript subagent | `<transcript không đuôi .jsonl>/subagents/agent-<agentId>.jsonl` (+ `.meta.json`) | Mọi entry `isSidechain: true`. Đây là nguồn đúng cho token subagent; `totalTokens` trong tool result chỉ là context của lần gọi cuối, **không** phải tổng. |
| Bản ghi theo lượt | `<project>/.agents/storage/logs/logs.jsonl` và file đã xoay vòng `logs-<UTC>.jsonl` | Dòng `"type":"turn"` do hook `turn-log` ghi: `request`, `tools`, `files`, `tokens`, `subagentTokens`, `subagentsPending`. Việc xoay vòng log đang được triển khai song song; CLI phải đọc cả file đã xoay vòng. |
| Hàm đo có sẵn | [`.agents/skills/report/scripts/task-usage.mjs`](../../.agents/skills/report/scripts/task-usage.mjs) | `export function measure(lines, sinceLine, criteria, { includeSidechain })`: giữ usage mới nhất theo `message.id`, bỏ entry subagent. Dùng lại, không viết lại logic khử trùng. |
| Định dạng số gọn | [`.claude/hooks/scripts/compact-number.mjs`](../../.claude/hooks/scripts/compact-number.mjs) | `formatCompactNumber`, `formatUsageTotals` (18, 4.4k, 1.2M). |

## Yêu cầu (REQ)

- **REQ-1 Phạm vi chọn**: mặc định project hiện tại (`cwd`). Tùy chọn `--project <dir>`, `--session <id>`, `--since <YYYY-MM-DD>`, `--until <YYYY-MM-DD>`, `--all-projects`.
- **REQ-2 Gom nhóm**: `--by session|turn|agent|day` (mặc định `session`). `agent` tách phiên chính và từng subagent theo `subagent_type` (tên vai trò như `coder`, `planner`), lấy từ tool_use `Agent` khớp `agentId` trong kết quả.
- **REQ-3 Số liệu**: mỗi dòng có `input`, `output`, `cacheRead`, `cacheCreate`, `total`, số message; khử trùng theo `message.id` như `measure`. Phiên chính và subagent tính riêng rồi cộng ở dòng tổng.
- **REQ-4 Đầu ra**: bảng chữ dễ đọc (số gọn k/M) mặc định; `--json` in JSON thô (số nguyên) để máy đọc. Sắp xếp theo `total` giảm dần, `--limit N`.
- **REQ-5 An toàn**: không in nội dung prompt/tool output; cột `request` (khi `--by turn`) cắt 80 ký tự và che secret như `turn-log.mjs` đang làm. Chỉ đọc file.
- **REQ-6 Lỗi**: không tìm thấy transcript → thông báo rõ, exit 1, không stack trace. Dòng JSONL hỏng → bỏ qua và đếm số dòng bỏ qua trong phần cuối báo cáo.
- **REQ-7 Chi phí (tùy chọn)**: chỉ tính tiền khi người dùng truyền `--rates <file.json>` (giá mỗi triệu token theo model). Không hardcode giá vì giá thay đổi.

## Ràng buộc kỹ thuật

- Đặt logic ở module riêng (ví dụ `bin/usage.mjs`), `bin/lumina-agent.mjs` chỉ thêm nhánh lệnh `usage` và dòng help; không làm đổi hành vi lệnh `install`.
- Mọi CLI entry guard so sánh bằng `realpathSync(process.argv[1])` (bài học lỗi symlink ở `compact-number.mjs`).
- Đọc file theo dòng (stream/`readline`) để transcript lớn không nạp hết vào RAM; độ phức tạp O(tổng số dòng).
- Cập nhật `package.json` `files` nếu thêm file mới dưới `bin/`.

## Kiểm thử (bắt buộc)

Thêm `tests/usage-cli.test.mjs` (node:test, fixture JSONL trong thư mục tạm, đặt `HOME` giả để không đọc transcript thật):

- Tổng theo phiên đúng, kể cả `message.id` lặp (lấy bản mới nhất).
- `--by agent` tách phiên chính và từng subagent theo tên vai trò; subagent chưa xong (không có transcript/`finished`) được báo riêng, không cộng.
- `--by turn` đọc dòng `type:"turn"` từ cả `logs.jsonl` và `logs-*.jsonl`; `request` bị che secret.
- `--since/--until`, `--session`, `--limit`, `--json` (JSON hợp lệ, số nguyên).
- Transcript thiếu → exit 1, stderr rõ ràng, stdout rỗng; dòng hỏng được đếm.
- Gọi qua đường dẫn symlink vẫn chạy.
- `npm test` toàn bộ pass; `npm run check`, `python3 scripts/check-agent-config.py`, `git diff --check`.

## Tiêu chí hoàn thành

- `lumina-agent usage` chạy được trên transcript thật của repo này, in bảng hợp lý (không tuyên bố số liệu khi chưa chạy).
- Cập nhật mục lệnh trong `README.md` và `AGENTS.md` nếu có danh sách lệnh CLI.
- Báo cáo bằng skill `report` (template Change): file/dòng đổi, lệnh đã chạy và kết quả thật, giới hạn còn lại.

## Ngoài phạm vi

- Không sửa hook `turn-log`, `report-usage`, `audit-log` hay logic xoay vòng log.
- Không gửi số liệu ra ngoài, không dashboard web.
