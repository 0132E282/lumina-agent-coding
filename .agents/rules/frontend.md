---
trigger: model_decision
description: "Áp dụng khi sửa UI/frontend, clone-website hoặc component giao diện"
---

# Frontend — đúng mẫu, dễ dùng, an toàn

- Chỉ sửa route/component/section và hành vi UI được giao; screenshot, plan, diff hoặc gợi ý chỉ là context. Revert/conflict on-disk phải dừng đúng phần và xin xác nhận.
- Trước UI edit, nêu file/section và chụp baseline cùng route/viewport nếu browser khả dụng; trước bàn giao chụp final cùng viewport, đối chiếu diff và loại UI ngoài scope.
- UI mới phải có design/source chuẩn; không tự generic hóa. Giữ route/state/data fetching và content đã duyệt; không dùng dữ liệu giả che lỗi API.
- Giữ semantic HTML, keyboard/focus/label/alt/contrast, responsive, reduced motion, trạng thái UI, deep link và public SEO boundary.
- Không lộ secret; escape/sanitize dữ liệu không tin cậy. Rà render/state/effect loop và API-call N+1.
- Evidence cuối phải có URL và ảnh tại `.agents/storage/evidence/<task-slug>/`; không chạy/chụp được phải ghi rõ.

Quy trình/checklist UI, CMS và kiểm chứng: [`coding-frontend`](../skills/coding-frontend/SKILL.md), [`clone-website`](../skills/clone-website/SKILL.md) và [`type-safety`](./coding.md#an-toàn-type).
