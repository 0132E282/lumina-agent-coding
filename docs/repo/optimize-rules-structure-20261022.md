---
title: Tối ưu rules và đánh giá cấu trúc repo
description: Testcase cấp repository kiểm tra rules đã gom về một chủ sở hữu, không mất ràng buộc, anchor còn sống và cấu trúc/symlink không đổi.
tags:
  - agent-rules
  - configuration
  - regression
  - token-optimization
---

# Tối ưu rules và đánh giá cấu trúc repo

Trạng thái thực thi: **Pass 5/5** (chạy 2026-10-22, xem [Kết quả](#kết-quả-thực-thi)). Plan: [`optimize-rules-structure-20261022.json`](../plans/optimize-rules-structure-20261022.json).

## Test cases

### TC-001 — Ràng buộc bị xoá vẫn còn ở chủ sở hữu

- Bước: với mỗi câu đã bỏ khỏi `AGENTS.md`, `CLAUDE.md` và rules, `grep` ý tương ứng ở owner: `CONTRACT.md` (#1 commit/push, #2 DB, #5 không bịa, #8 report), `coding.md#kiss-yagni-và-phạm-vi` (change authorization gate), `frontend.md` (UI gate, ảnh baseline/final), `delivery.md#chất-lượng-và-bằng-chứng` (N+1/loop trước bàn giao), `docs.md#đồng-bộ-tài-liệu` (testcase khi xong plan), `git.md` (deploy), skill `debugs` (S1–S4, flaky), `git-workflow` (conflict), `report` (`Token:`/`Issue lãng phí:`).
- Kỳ vọng: mọi ràng buộc đều tìm thấy đúng một owner.

### TC-002 — Link và anchor nội bộ

- Bước: `python3 scripts/check-agent-config.py`.
- Kỳ vọng: exit 0, không báo link/anchor gãy.

### TC-003 — Kích thước rules nạp mỗi phiên

- Bước: `wc -c .agents/rules/*.md CONTRACT.md AGENTS.md CLAUDE.md`.
- Kỳ vọng: tổng nhỏ hơn mốc 33366 byte trước refactor.

### TC-004 — Cấu trúc, symlink và path không đổi

- Bước: `find . -type l -not -path './node_modules/*' -not -path './.git/*'`; `git diff --stat -- bin .claude/settings.json .codex/hooks.json`; `npm test`.
- Kỳ vọng: 7 symlink như cũ (`.agents/{agents,commands,hooks}` → `.claude/`, `.claude|.codex/{rules,skills}` → `.agents/`); diff rỗng với `bin/`, `.claude/settings.json`, `.codex/hooks.json`; `npm test` pass.

### TC-005 — M1 commit all và O1 bỏ settings.snippet.json

- Bước: đọc `.agents/rules/git.md` và `.claude/commands/git.md:10`; `test ! -e .claude/hooks/settings.snippet.json`; `grep -rn "settings.snippet" .claude bin tests`.
- Kỳ vọng: `git.md` định nghĩa commit all là toàn bộ thay đổi hợp lệ trừ file cấm và `commit change` chỉ khi người dùng chọn rõ, khớp command; file snippet không còn; không còn tham chiếu trong `.claude/`, `bin/`, `tests/`; README hooks trỏ tới `.claude/settings.json`/installer.

## Kết quả thực thi

Chạy 2026-10-22 trên working tree chưa commit.

- TC-001 — Pass: 16/16 ràng buộc tìm thấy ở owner bằng `grep -F`.
- TC-002 — Pass: `python3 scripts/check-agent-config.py` exit 0.
- TC-003 — Pass: tổng 29421 byte < 33366.
- TC-004 — Pass: đủ 7 symlink đúng đích; `git diff --stat` rỗng với `bin/`, `.claude/settings.json`, `.codex/hooks.json`; `node --test tests/*.test.mjs` 267/267 pass.
- TC-005 — Pass: `git.md` có `commit change`, khớp "commit toàn bộ thay đổi hợp lệ" ở `.claude/commands/git.md`; snippet không còn; 0 tham chiếu `settings.snippet` trong `.claude/`, `bin/`, `tests/`.
