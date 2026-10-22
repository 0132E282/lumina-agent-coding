---
trigger: model_decision
description: "Áp dụng khi đọc, viết hoặc đồng bộ tài liệu trong docs/, kể cả implementation plan"
---

# Quy tắc tài liệu

## Đồng bộ tài liệu

- Docs là một phần Definition of Done: thay đổi làm tài liệu hiện có sai phải cập nhật đúng phần bị ảnh hưởng trong cùng lượt.
- Đọc/sửa `docs/` phải theo registry/index owner; không nhúng nội dung chi tiết vào menu và không trộn schema `docs/testcases/index.json` với catalog.
- Hoàn tất toàn bộ implementation plan phải tạo testcase repo Markdown trạng thái `Not Run`, rồi cập nhật `docs/repo/index.json` và `docs/index.json`.
- API đổi và đã có Postman artifact phù hợp thì cập nhật artifact hiện có, không tạo bản trùng.

Quy trình routing, schema, TOC và sync: [`docs`](../skills/docs/SKILL.md). Test artifact: [`testcase`](../skills/testing/references/testcase.md). Registry core: [`documentation-reading-and-toc`](#registry-tài-liệu).

## Registry tài liệu

- Trước khi đọc/viết tài liệu, đọc `index.json` phù hợp, tìm bằng metadata và mở file qua `path`.
- Catalog entry chỉ có `title`, `description`, `tags`, `path`; path repo-relative. Catalog chỉ quản lý nội dung trong `docs/` và không nhúng content.
- Đọc toàn bộ file đích và nguồn/convention quyết định nội dung trước khi sửa; phần không đọc được phải ghi rõ.
- Artifact chi tiết và index tương ứng phải cập nhật cùng lượt; giữ ID/history testcase và không bịa ngày/kết quả.

Routing từng index, schema artifact, TOC/anchor và kiểm chứng link: [`docs`](../skills/docs/SKILL.md).

## Implementation plan contract

- Implementation plan là JSON hợp lệ tại `docs/plans/<title-slug>-<yyyyMMdd>.json`, có `title`, `description`, `tags`, `content`, `createdAt`; không dùng Markdown plan tự do.
- `docs/plans/index.json` cập nhật cùng lượt và entry chỉ có `title`, `description`, `tags`, `path`.
- Task là object đồng nhất, giữ đủ field/schema kể cả khi giá trị là `null`/`[]`; mọi path phải được xác minh và trace REQ/BR → AC → task → test.
- Runtime plan mode/quyền ghi có ưu tiên; không vượt read-only hoặc tuyên bố đã lưu khi chưa ghi.

Luồng planning và schema task/traceability đầy đủ: [`workflow-plan`](../skills/workflow-plan/SKILL.md), [`planner`](../agents/planner.md) và [`implementation-plan-template.json`](../skills/docs/assets/implementation-plan-template.json).
