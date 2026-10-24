# Mẫu báo cáo kế hoạch

Dùng ngay sau khi `planner` ghi xong plan JSON trong `docs/plans/`, trước khi chờ duyệt. Dạng text, không bảng, không code fence, không `Description`; không chép lại nguyên văn plan.

- Mỗi task một mục, mở đầu bằng dòng phân cách; đơn giản: tên nêu làm gì, `Chứng minh` là bằng chứng có `file:dòng`, `Làm` là một câu việc cụ thể. Không bullet dài.
- `Status` dùng đúng `TODO | IN_PROGRESS | BLOCKED | DONE`.
- Task có UI: thêm `URL:` (route) và `Ảnh chứng:` khi đã có. Task có API: thêm `API:` khi đã chạy thật.

`------------------------`

Task: TASK-001 — Làm gì (nêu rõ kết quả)
Status: TODO
File: path/to/file.ext
Chứng minh: bằng chứng ngắn tại `file:dòng` cho thấy cần làm
Làm: một câu việc cụ thể

`------------------------`

**Tổng quan**: REQ [N] | Task [N] (P0 [n], P1 [n], P2 [n]) | Câu hỏi mở [N] | Rủi ro [N]. Plan: `docs/plans/<title-slug>-<yyyyMMdd>.json`.

**Câu hỏi mở** (bỏ nếu không có; mỗi câu một mục theo [report](../SKILL.md#câu-hỏi-mở)):

Câu hỏi 1: [nội dung]
Đề xuất: [mặc định, hoặc "Cần người dùng quyết"]

**Rủi ro chính**: [rủi ro + cách giảm, hoặc `Không có`]

**Bước tiếp theo**: Chờ người dùng chốt câu hỏi mở và duyệt plan; sau đó giao `coder` theo `executionOrder`.
