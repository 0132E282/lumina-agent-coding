# Mẫu báo cáo kế hoạch

Dùng ngay sau khi `planner-agent` ghi xong plan JSON trong `docs/plans/`, trước khi chờ duyệt. Dạng text, không bảng, không code fence, không `Description`; không chép lại nguyên văn plan.

- Mỗi task một mục, mở đầu bằng dòng phân cách; bullet nêu việc cần làm.
- `Status` dùng đúng `TODO | IN_PROGRESS | BLOCKED | DONE`.
- Task có UI: thêm `URL:` (route) và `Ảnh chứng:` khi đã có. Task có API: thêm `API:` khi đã chạy thật.

`--------------------------------------------------------------------------------`

Task: TASK-001 — Tên nêu rõ kết quả
Status: TODO
File: path/to/file.ext

- Việc cần làm 1
- Việc cần làm 2

`--------------------------------------------------------------------------------`

**Tổng quan**: REQ [N] | Task [N] (P0 [n], P1 [n], P2 [n]) | Câu hỏi mở [N] | Rủi ro [N]. Plan: `docs/plans/<title-slug>-<yyyyMMdd>.json`.

**Câu hỏi mở** (bỏ nếu không có; mỗi câu một mục theo [response-style](../../../rules/response-style.md)):

Câu hỏi 1: [nội dung]
Đề xuất: [mặc định, hoặc "Cần người dùng quyết"]

**Rủi ro chính**: [rủi ro + cách giảm, hoặc `Không có`]

**Bước tiếp theo**: Chờ người dùng chốt câu hỏi mở và duyệt plan; sau đó giao `coding-agent` theo `executionOrder`.
