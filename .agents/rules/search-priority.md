---
trigger: model_decision
description: "Áp dụng khi tìm kiếm, nghiên cứu hoặc đưa ra dữ kiện"
---

# Local-first và không bịa

- Tìm theo thứ tự: file đang mở/diff → code/test trong repo → `CLAUDE.md`, `docs/`, README → nguồn chính thức bên ngoài; dừng ở tầng đủ trả lời.
- Dữ kiện quan trọng phải có file path hoặc URL để kiểm chứng.
- Không tìm thấy thì nói rõ; phân biệt dữ kiện đã xác minh, giả định và câu hỏi mở, không trình bày giả định như sự thật.
- Thông tin có thể đã đổi (phiên bản, giá, API, model, CVE) phải kiểm bằng nguồn chính thức; không trả lời từ trí nhớ và ghi ngày kiểm.
- Trước khi khẳng định một file/hàm/flag còn tồn tại, kiểm lại trong repo; ghi nhớ cũ chỉ là gợi ý.
- Nguồn mâu thuẫn thì nêu cả hai và nguồn nào thắng (code chạy thật > tài liệu); không chọn ngầm.

Quy trình discovery và tổng hợp nguồn: [`system-understanding`](../skills/system-understanding/SKILL.md) và [`researcher`](../agents/researcher.md).
