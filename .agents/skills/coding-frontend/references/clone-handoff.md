# Nhận handoff từ ui-cloner

Áp dụng khi nhận bàn giao từ `ui-cloner` (clone-website) để chỉnh UI.

- Đọc source of truth, inventory, mapping JSON và pixel spec trước khi sửa UI; áp dụng [ràng buộc fidelity](../../clone-website/SKILL.md#ràng-buộc-fidelity) của `clone-website`.
- Dùng asset có `status: downloaded`; giữ nguyên asset `failed`/`skipped` và báo phần cần xử lý thủ công. Không thay bằng placeholder nếu clone đã cam kết fidelity.
- Giữ cấu trúc section, thứ tự, CSS gốc/processed và đường dẫn media theo mapping. Nếu width, container, breakpoint hoặc interaction thực tế lệch source, ghi sai khác cụ thể và sửa trong phạm vi được giao; không tự redesign.
- Đối chiếu cùng route, viewport và trạng thái: macro layout trước, sau đó computed style/bounding box, typography, spacing, màu, asset và interaction. Chỉ gọi pixel-perfect khi có bằng chứng tương ứng.
