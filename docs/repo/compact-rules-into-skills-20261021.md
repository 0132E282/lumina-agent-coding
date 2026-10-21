---
title: Rút gọn toàn bộ rule và chuyển chi tiết sang skill
description: Testcase cấp repository để kiểm tra rule mỏng, semantic owner, reference và cấu hình runtime sau khi refactor.
tags:
  - agent-rules
  - skills
  - configuration
  - regression
---

# Rút gọn toàn bộ rule và chuyển chi tiết sang skill

Trạng thái thực thi: **Not Run**. Tài liệu này chỉ thiết kế testcase từ cấu hình và luồng thực tế sau triển khai.

## Test cases

### TC-RULE-001 — Inventory và cấu trúc rule mỏng

- Tiền điều kiện: repository ở trạng thái sau triển khai plan.
- Bước: liệt kê `.agents/rules/*.md`, đếm file và đọc từng rule.
- Kết quả mong đợi: có đủ 18 rule; mỗi rule chỉ giữ trigger/phạm vi, invariant/policy cốt lõi và pointer tới owner; không còn ví dụ hoặc checklist vận hành dài.
- Trạng thái: Not Run.

### TC-RULE-002 — Bảo toàn semantics tại skill/role owner

- Tiền điều kiện: có semantic mapping trong plan triển khai.
- Bước: truy từng pointer từ rule tới skill/role, tìm các invariant Git authorization/conflict, scope authorization, report gate, plan schema, `any`, Rule of Three, comment label/length, UI evidence, database read-only, transaction, case accounting, docs registry, no-fabrication và response format.
- Kết quả mong đợi: mọi semantics trước refactor tồn tại đúng một owner chính hoặc pointer rõ; không xuất hiện policy mới hay mất constraint.
- Trạng thái: Not Run.

### TC-RULE-003 — Runtime adapter và reference

- Bước: chạy `python3 scripts/check-agent-config.py`, scan relative link và tên rule cũ `commit-discipline`/`pull-request-conflict`.
- Kết quả mong đợi: checker thành công; symlink/adapters hợp lệ; không còn stale reference ngoài lịch sử mô tả plan có chủ đích.
- Trạng thái: Not Run.

### TC-RULE-004 — Regression checks repository

- Bước: chạy `npm run check`, `npm test`, JSON validation, final-newline checker trên file text thay đổi và `git diff --check`.
- Kết quả mong đợi: mọi lệnh thành công; JSON parse được; không có whitespace/newline error.
- Trạng thái: Not Run.

### TC-RULE-005 — Scope và dirty-work preservation

- Bước: so `git status --short`, `git diff` và `git diff --cached` với baseline trước triển khai.
- Kết quả mong đợi: không commit/push; deleted Git rules vẫn deleted; các hunk có sẵn trong `bin/lumina-agent.mjs`, `tests/lumina-agent.test.mjs`, Git/database/dependency/hook được giữ; không có product-code diff mới ngoài scope.
- Trạng thái: Not Run.
