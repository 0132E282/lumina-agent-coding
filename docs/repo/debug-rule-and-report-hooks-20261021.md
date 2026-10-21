---
title: Rule/skill debug, dòng Token gọn và remind-cleanup theo ngưỡng context
description: Testcase cấp repository cho rule bug-fix, skill debugs, định dạng Token compact có tổng, và hook remind-cleanup (ngưỡng 80% context, bỏ qua thư mục cấu hình, nhắc mỗi file một lần).
tags:
  - agent-rules
  - skills
  - hooks
  - report
  - regression
---

# Rule/skill debug, dòng Token gọn và remind-cleanup theo ngưỡng context

Trạng thái thực thi: **Not Run**. Tài liệu này chỉ thiết kế testcase từ cấu hình và hook thực tế sau triển khai.

## Test cases

### TC-DBG-001 — Rule bug-fix và skill debugs liên kết đúng

- Bước: mở `.agents/rules/bug-fix.md`, `.agents/rules/delivery.md` (mục Chất lượng và bằng chứng), `.agents/skills/debugs/SKILL.md`, `.agents/skills/debugs/references/checklist.md`, `AGENTS.md` (Choosing skills by task); kiểm tra mọi relative link.
- Kết quả mong đợi: delivery trỏ `rules/bug-fix`; rule trỏ skill `debugs`; skill trỏ ngược rule và `references/checklist.md`; AGENTS.md có dòng "Debug / bug fix"; không còn link tới `rules/debug.md`.
- Trạng thái: Not Run.

### TC-DBG-002 — Nội dung tiêu chí debug đầy đủ

- Bước: đối chiếu `checklist.md` với 10 tiêu chí (Reproduce → Verification), 9 loại lỗi và 9 mục checklist chất lượng; đối chiếu SKILL.md có 7 bước quy trình.
- Kết quả mong đợi: đủ tiêu chí, loại lỗi và checklist; database chỉ đọc; không có chỉ dẫn sửa theo phỏng đoán.
- Trạng thái: Not Run.

### TC-TOK-001 — Hook report-usage phát dòng Token compact có tổng

- Tiền điều kiện: transcript có usage input 18, output 4448, cache đọc 912046, cache tạo 13421; đã có mốc báo cáo trước.
- Bước: gọi skill `report` (PostToolUse) và đọc `additionalContext`.
- Kết quả mong đợi: `📈 Token: input 18 | output 4.4k | cache đọc 912k | cache tạo 13.4k | tổng 930k (từ mốc trước).`; `emitted.json` lưu số thô kèm `total` 929933.
- Trạng thái: Not Run.

### TC-TOK-002 — Hook report-usage-check đối chiếu số compact/thô/tổng

- Bước: Stop với báo cáo chứa dòng Token (a) compact đúng, (b) số thô đúng, (c) compact sai `4.5k`, (d) thiếu `tổng`, (e) `tổng` sai.
- Kết quả mong đợi: (a)(b)(d) im lặng; (c)(e) cảnh báo lệch hiển thị số hook dạng compact kèm tổng.
- Trạng thái: Not Run.

### TC-CLN-001 — remind-cleanup im lặng dưới 80% context

- Tiền điều kiện: session đã Write `tmp-notes.md` ở gốc; usage message assistant cuối < 160k (giới hạn mặc định 200k).
- Bước: chạy Stop hook `remind-cleanup.sh`.
- Kết quả mong đợi: không output.
- Trạng thái: Not Run.

### TC-CLN-002 — remind-cleanup nhắc khi ≥ 80% và chỉ một lần mỗi file

- Bước: usage ≥ 80% → Stop lần 1; Stop lần 2 cùng file; Write thêm `scratch-new.txt` → Stop lần 3; lặp lại với `CLAUDE_CONTEXT_LIMIT=100000`.
- Kết quả mong đợi: lần 1 nhắc kèm `% (used/limit)` và 1 file; lần 2 không output; lần 3 chỉ nhắc file mới; override giới hạn đổi % tương ứng; không file nào bị xoá.
- Trạng thái: Not Run.

### TC-CLN-003 — Finder bỏ qua thư mục cấu hình/tài liệu

- Bước: session Write `.agents/rules/debug.md`, `.agents/skills/x/draft-skill.md`, `.claude/hooks/debug-hook.sh`, `docs/draft-x.md`, `tmp-notes.md`; chạy `find-session-scratch-files.sh <session_id>`.
- Kết quả mong đợi: chỉ liệt kê `tmp-notes.md`.
- Trạng thái: Not Run.

### TC-DBG-003 — Mức độ, lỗi lúc có lúc không, bảo mật và mẫu báo cáo Debug

- Bước: mở `.agents/rules/bug-fix.md`, `.agents/skills/debugs/SKILL.md`, `references/checklist.md` (mục Mức độ), `.agents/skills/report/assets/debug-report-template.md` và bảng template trong `.agents/skills/report/SKILL.md`.
- Kết quả mong đợi: có thang S1–S4; quy trình lỗi intermittent (chạy lặp, ghi tỉ lệ, thử race); bug bảo mật bắt buộc qua `review-web-security`, cấm ghi payload; số đo hiệu năng tối thiểu; postmortem cho lỗi production; regression test phải fail lại khi bỏ riêng bản sửa; skill report liệt kê mẫu Debug.
- Trạng thái: Not Run.

### TC-REV-001 — Rule review và mục C10

- Bước: mở `.agents/rules/review.md`, `.agents/skills/workflow-review/references/code-review-checklists.md` (C10), `.claude/agents/reviewer-agent.md`, `.claude/agents/coding-agent.md` (quy tắc 9).
- Kết quả mong đợi: review chỉ báo cáo, có bằng chứng, luôn gồm logic/Big O/bảo mật; C10 kiểm nguồn gốc, nguyên nhân gốc, regression test fail trên base, ảnh UI, mức độ, bảo mật; reviewer-agent và coding-agent trỏ đúng rule.
- Trạng thái: Not Run.

### TC-HOOK-001 — report-reminder bỏ qua Edit/Write của subagent

- Bước: ghi log audit có một Edit kèm `agent_id` (subagent) và chạy Stop hook `report-reminder.sh`; thêm Edit không có `agent_id` rồi chạy lại.
- Kết quả mong đợi: lần 1 không nhắc; lần 2 chỉ nhắc file của phiên chính.
- Trạng thái: Not Run.

### TC-HOOK-002 — Nhắc test cho commit sửa bug

- Bước: trong repo tạm, stage file nguồn không kèm test rồi gọi hook với lệnh commit có message type `fix`; lặp với file `tests/x.test.mjs` staged; lặp với type `feat`.
- Kết quả mong đợi: chỉ trường hợp fix không kèm test có lời nhắc; hook không chặn commit.
- Trạng thái: Not Run.

### TC-HOOK-003 — commit-msg-guard không bắt nhầm lệnh không phải commit

- Bước: chạy hook PreToolUse với lệnh Bash ghi file (heredoc/`python3 -`) có chứa chuỗi lệnh commit trong nội dung.
- Kết quả mong đợi: hook không chặn; chỉ kiểm message khi lệnh thực sự là commit.
- Trạng thái: Not Run.

### TC-CFG-001 — Checker link/anchor và mục lục docs

- Bước: chạy `python3 scripts/check-agent-config.py` trên repo; tạo link gãy, anchor sai và entry `docs/repo` lệch `docs/index.json` trong bản sao tạm rồi chạy lại.
- Kết quả mong đợi: repo hiện tại hợp lệ; bản sao lỗi báo đúng `file:dòng` và entry lệch, exit khác 0.
- Trạng thái: Not Run.

### TC-DBG-004 — verify-regression.sh chứng minh test fail trên base

- Bước: trong repo tạm có bug ở base và bản sửa + test mới ở working tree, chạy `bash .agents/skills/debugs/scripts/verify-regression.sh <base> -- node --test <test>`; lặp với test pass cả hai phía, head còn fail và không có file test.
- Kết quả mong đợi: exit 0 / 1 / 1 / 2 tương ứng; log ghi ở `.agents/storage/evidence/<slug>/`; worktree tạm được dọn, working tree/index không đổi.
- Trạng thái: Not Run.

### TC-REG-001 — Regression checks repository

- Bước: chạy `npm test`, `python3 scripts/check-agent-config.py`, `bash -n` các hook `.sh` đã sửa, JSON validation `docs/index.json`/`docs/repo/index.json` và `git diff --check`.
- Kết quả mong đợi: mọi lệnh thành công.
- Trạng thái: Not Run.
