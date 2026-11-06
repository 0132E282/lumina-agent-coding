# Thiết kế hệ thống — chọn đúng tài liệu và luôn bám theo

- Tài liệu chính `ARCHITECTURE.md` và `DESIGN.md` ở gốc repo; bản chi tiết chia theo loại (database, api, frontend...) trong `system/` và `design/`, ngoài `docs/`.
- Chọn tài liệu theo loại dự án và độ phức tạp thật (mặc định frontend web); loại khác (mobile, AI, desktop, SaaS, e-commerce, backend, hạ tầng) chỉ thêm khi dự án thuộc loại đó. Không viết đủ bộ, bỏ mục không áp dụng kèm lý do.
- Sơ đồ Mermaid chỉ khi có ≥3 thành phần/bước, từ cấu trúc đã xác minh. Design pattern chỉ khi có vấn đề cụ thể, ghi lý do ([`coding`](./coding.md#kiss-yagni-và-phạm-vi)).
- Lập plan, điều phối và coding luôn đọc các thiết kế này; mỗi task dẫn phần thiết kế nó thực hiện. Chưa có thiết kế thì ghi rõ, không bịa; code lệch thiết kế thì dừng và hỏi.
- Bám design system và UI hiện có; không tự redesign hay đổi UI library. Phần thiếu căn cứ ghi là giả định hoặc câu hỏi mở.

Vai trò: [`architect`](../../.claude/agents/architect.md) viết kiến trúc, [`designer`](../../.claude/agents/designer.md) viết giao diện. Sơ đồ: [`diagrams`](../skills/system-understanding/references/diagrams.md); bộ theo loại dự án và checklist: [`design-sets`](../skills/system-understanding/references/design-sets.md).
