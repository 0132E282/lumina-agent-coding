---
title: "<Testcase cấp repo — tên plan>"
description: "<Khi nào AI nên tham khảo bộ testcase repo này>"
tags:
  - repo-testcase
  - "<feature-kebab-case>"
---

# <Testcase cấp repo — tên plan>

Chỉ thiết kế sau khi coding hoàn tất toàn bộ task của plan; bộ testcase này chưa thực thi.

## Mục lục

- [Phạm vi và nguồn](#phạm-vi-và-nguồn)
- [Testcase](#testcase)
- [Đối soát và giới hạn](#đối-soát-và-giới-hạn)

## Phạm vi và nguồn

- Plan: <link plan đã hoàn tất>.
- Nguồn yêu cầu/AC: <link nguồn thật>.
- Code, route, API, luồng đã kiểm tra: <path và bằng chứng thật>.
- Ngoài phạm vi: <phần không được giao>.

## Testcase

### <ID ổn định> — <Title>

- ID: <ID duy nhất, giữ ID cũ nếu có>.
- Requirement ID: <REQ/BR/AC có thật trong nguồn>.
- Title: <hành vi cụ thể>.
- Priority: <High / Medium / Low>.
- Preconditions: <trạng thái trước test>.
- Test data: <dữ liệu giả, không dùng secret/PII thật>.
- Steps:
  1. <thao tác cụ thể>.
- Expected result: <output/checkpoint quan sát được, gắn với bước tương ứng>.
- Postconditions / Cleanup: <trạng thái sau test/cách dọn hoặc không áp dụng>.
- Actual result: Chưa chạy.
- Status: Not Run
- Evidence / Bug ID: Chưa có (khi chạy: ảnh hoặc API theo [testcase mục 7.2](../../testing/references/testcase.md#72-bằng-chứng-và-kết-quả-api)).
- API (khi có): `METHOD URL` · tham số · Kết quả: Chưa chạy.

## Đối soát và giới hạn

- Tổng module/case: <số thật>; Not Run: <tổng case>; chưa thực thi bộ testcase.
- ID/truy vết: <kết quả đối soát thật>.
- Thiếu thông tin: <Draft/TBD và nguồn cần xác nhận hoặc Không có>.
- Menu cần cập nhật cùng lượt: `docs/repo/index.json` và `docs/index.json`.
