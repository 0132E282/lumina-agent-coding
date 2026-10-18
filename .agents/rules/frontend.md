---
trigger: model_decision
description: "Áp dụng khi nhiệm vụ liên quan: 🖥️ Frontend — Đúng mẫu + Trải nghiệm + Nội dung"
---

# 🖥️ Frontend — Đúng mẫu, dễ dùng, an toàn

- Đọc UI/Figma, component, token và contract thật. Không có yêu cầu redesign thì giữ mẫu, layout và hành vi; xin chấp thuận trước khi sửa component/page dùng chung hoặc luồng ngoài phạm vi.
- Trước khi dựng UI mới cho trang/luồng chưa có spec/source đối chiếu (route ngoài phạm vi đã crawl, hoặc khó crawl như AJAX cart/checkout), dừng lại kiểm tra: (a) người dùng đã gửi ảnh/screenshot/design reference nào cho đúng phần đó trong hội thoại chưa — có thì dùng làm source of truth tuyệt đối, không tự dựng layout "hợp lý"/generic; (b) chưa có thì áp dụng đúng quy trình crawl → đo geometry → viết spec (xem [`clone-website`](../skills/clone-website/SKILL.md)) cho phần đó trước khi code, hoặc hỏi người dùng nguồn nào dùng làm chuẩn. Không tự suy luận/generic hóa UI rồi để người dùng phát hiện sai sau khi code xong.
- Tái sử dụng route, state và data fetching hiện có. Không dùng dữ liệu giả che lỗi API hoặc tự đổi nội dung đã duyệt; không tạo global state/abstraction khi chưa cần.
- Dùng HTML native đúng vai trò; hỗ trợ responsive, keyboard, focus, label, alt, contrast và reduced motion. Xử lý loading/empty/error/success, validation, pending submit và stale response phù hợp.
- Giữ deep link, refresh và điều hướng hoạt động. Metadata theo route; chỉ áp dụng SEO cho trang công khai. Không tự đổi CSR/SSR/SSG hay theme.
- Escape text, sanitize HTML không tin cậy bằng thư viện phù hợp, kiểm soát URL và không lộ secret trong bundle. Tối ưu ảnh/script theo nhu cầu, đo trước khi kết luận hiệu năng.
- Trước khi hoàn thành, rà route/UI bị ảnh hưởng, vòng lặp render/state/effect và API call N+1 trên mọi framework; kiểm chứng theo [`quality-assurance`](./quality-assurance.md), ghi rõ phần chưa chạy.

> Quy trình UI/CMS chi tiết: [`coding-frontend`](../skills/coding-frontend/SKILL.md). TypeScript: [`type-safety`](./type-safety.md).
