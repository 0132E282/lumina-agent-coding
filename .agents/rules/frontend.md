---
trigger: model_decision
description: "Áp dụng khi sửa UI/frontend, clone-website hoặc component giao diện"
---

# Frontend — đúng mẫu, dễ dùng, an toàn

- Chỉ sửa route/component/section và hành vi UI được giao; plan, diff, screenshot hoặc gợi ý chỉ là context. Không thêm, xoá, khôi phục, đổi thứ tự hay restyle UI, copy, modal, CTA, asset, route, responsive hoặc state ngoài scope. Revert/conflict on-disk: báo đúng file/section và dừng phần đó đến khi người dùng xác nhận.
- Trước UI edit, nêu file/section và chụp baseline cùng route/viewport nếu browser khả dụng; trước bàn giao chụp final cùng viewport, đối chiếu diff và loại UI ngoài scope. Evidence cuối có URL và ảnh tại `.agents/storage/evidence/<task-slug>/` của project đang làm; ảnh công cụ trình duyệt lưu ở thư mục tạm hệ thống (`/var/folders`, `/tmp`) phải copy vào đó trước khi dẫn vào báo cáo, không dẫn đường dẫn tạm; không chạy/chụp được phải ghi rõ.
- UI mới phải có design/source chuẩn; không tự generic hóa. Giữ route/state/data fetching và content đã duyệt; không dùng dữ liệu giả che lỗi API.
- Giữ semantic HTML, keyboard/focus/label/alt/contrast, responsive, reduced motion, trạng thái UI, deep link và public SEO boundary.
- Không lộ secret; escape/sanitize dữ liệu không tin cậy.

Quy trình/checklist UI, CMS và kiểm chứng: [`coding-frontend`](../skills/coding-frontend/SKILL.md), [`clone-website`](../skills/clone-website/SKILL.md) và [`type-safety`](./coding.md#an-toàn-type). Render/state/effect loop và N+1 trước bàn giao: [`delivery`](./delivery.md#chất-lượng-và-bằng-chứng).
