---
trigger: model_decision
description: "Áp dụng khi sửa UI/frontend, clone-website hoặc component giao diện"
paths:
  - "**/*.{tsx,jsx,vue,svelte,astro,html,css,scss,sass,less}"
---

# Frontend — đúng mẫu, dễ dùng, an toàn

- Chỉ sửa route/component/section và hành vi UI được giao; không thêm, xoá, khôi phục, đổi thứ tự hay restyle UI, copy, modal, CTA, asset, route, responsive hoặc state ngoài scope (quyền và xử lý revert/conflict theo [`coding`](./coding.md#kiss-yagni-và-phạm-vi)).
- Trước UI edit, nêu file/section và chụp baseline cùng route/viewport nếu browser khả dụng; trước bàn giao chụp final cùng viewport, đối chiếu diff và loại UI ngoài scope. Evidence cuối có URL và ảnh tại `.agents/storage/evidence/<task-slug>/` của project đang làm; ảnh công cụ trình duyệt lưu ở thư mục tạm hệ thống (`/var/folders`, `/tmp`) phải copy vào đó trước khi dẫn vào báo cáo, không dẫn đường dẫn tạm; không chạy/chụp được phải ghi rõ.
- UI mới phải có design/source chuẩn; không tự thiết kế rồi code, không tự generic hóa. Project đã thiết lập `/design` (có `docs/design/DESIGN.md`) thì code bám đúng tài liệu đó (trang, base, màu, ảnh, `animations.md`); thiếu hoặc chưa đủ thì dừng, giao `designer` hoặc hỏi. Project chưa dùng thì bám nguồn người dùng chỉ định (Figma, ảnh, link); `/design <link>` là cách tùy chọn để thiết lập tài liệu này. Giữ route/state/data fetching và content đã duyệt; không dùng dữ liệu giả che lỗi API.
- Giữ semantic HTML, keyboard/focus/label/alt/contrast, responsive, reduced motion, trạng thái UI, deep link và public SEO boundary.
- UX trước UI: chốt luồng, số bước, trạng thái và nhãn dễ hiểu rồi mới chỉnh giao diện và hiệu ứng; giao diện quản trị phải đơn giản, dễ dùng, không trang trí thừa. Hiệu ứng theo [`animations`](../skills/animations/SKILL.md) (website và app, có nhánh reduced-motion).
- Không lộ secret; escape/sanitize dữ liệu không tin cậy.

Quy trình/checklist UI, CMS và kiểm chứng: [`coding-frontend`](../skills/coding-frontend/SKILL.md), [`clone-website`](../skills/clone-website/SKILL.md) và [`type-safety`](./coding.md#an-toàn-type). Render/state/effect loop và N+1 trước bàn giao: [`delivery`](./delivery.md#chất-lượng-và-bằng-chứng).
