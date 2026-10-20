---
trigger: model_decision
description: "Áp dụng khi nhiệm vụ liên quan: 🖥️ Frontend — Đúng mẫu + Trải nghiệm + Nội dung"
---

# 🖥️ Frontend — Đúng mẫu, dễ dùng, an toàn

- Đọc UI/Figma, component, token và contract thật. Không có yêu cầu redesign thì giữ mẫu, layout và hành vi; xin chấp thuận trước khi sửa component/page dùng chung hoặc luồng ngoài phạm vi.
- **UI change gate**: plan/diff/screenshot hoặc đề xuất của agent chỉ là context, không phải quyền thay đổi. Chỉ sửa đúng route/component/section và hành vi được nêu rõ; không tự thêm, xóa, khôi phục, sắp xếp lại hoặc restyle UI, copy, modal, CTA, asset, route, responsive behavior hay state ngoài scope. Nếu thấy file/section đã bị revert hoặc có diff mâu thuẫn, ghi rõ vị trí và dừng phần đó để xin xác nhận.
- Trước khi sửa UI, ghi rõ file/section nằm trong scope và chụp baseline cùng route/viewport khi có browser; trước bàn giao phải chụp trạng thái cuối cùng cùng viewport, đối chiếu diff và loại mọi thay đổi UI chưa được duyệt.
- Trước khi dựng UI mới cho trang/luồng chưa có spec/source đối chiếu (route ngoài phạm vi đã crawl, hoặc khó crawl như AJAX cart/checkout), dừng lại kiểm tra: (a) người dùng đã gửi ảnh/screenshot/design reference nào cho đúng phần đó trong hội thoại chưa — có thì dùng làm source of truth tuyệt đối, không tự dựng layout "hợp lý"/generic; (b) chưa có thì áp dụng đúng quy trình crawl → đo geometry → viết spec (xem [`clone-website`](../skills/clone-website/SKILL.md)) cho phần đó trước khi code, hoặc hỏi người dùng nguồn nào dùng làm chuẩn. Không tự suy luận/generic hóa UI rồi để người dùng phát hiện sai sau khi code xong.
- Tái sử dụng route, state và data fetching hiện có. Không dùng dữ liệu giả che lỗi API hoặc tự đổi nội dung đã duyệt; không tạo global state/abstraction khi chưa cần.
- Dùng HTML native đúng vai trò; hỗ trợ responsive, keyboard, focus, label, alt, contrast và reduced motion. Xử lý loading/empty/error/success, validation, pending submit và stale response phù hợp.
- Giữ deep link, refresh và điều hướng hoạt động. Metadata theo route; chỉ áp dụng SEO cho trang công khai. Không tự đổi CSR/SSR/SSG hay theme.
- Escape text, sanitize HTML không tin cậy bằng thư viện phù hợp, kiểm soát URL và không lộ secret trong bundle. Tối ưu ảnh/script theo nhu cầu, đo trước khi kết luận hiệu năng.
- Trước khi hoàn thành, rà route/UI bị ảnh hưởng, vòng lặp render/state/effect và API call N+1 trên mọi framework; kiểm chứng theo [`quality-assurance`](./quality-assurance.md), ghi rõ phần chưa chạy.
- Trước khi báo hoàn thành một thay đổi UI/frontend (gồm clone-website), chạy app thật và chụp ảnh màn hình **ở trạng thái kết quả cuối cùng đã hoàn thành** (sau khi mọi sửa đổi trong scope đã xong), đúng route/viewport đã sửa — không chụp ở bước giữa chừng/WIP rồi báo xong. Khi có trạng thái để so sánh (source đang clone, UI lỗi trước khi fix, bản thiết kế tham chiếu), chụp thêm ảnh "trước" (source/trạng thái cũ) cùng viewport để đối chứng cạnh ảnh "kết quả"; task tạo mới hoàn toàn không có gì để so sánh thì chỉ cần ảnh kết quả. Lưu ảnh vào `.agents/storage/evidence/<task-slug>/` (không commit, chỉ làm bằng chứng). Change report phải có dòng `URL:` (route đã kiểm tra) và `Ảnh chứng:` (đường dẫn ảnh — nêu rõ `trước` và `kết quả` nếu có cả hai) cạnh danh sách file đã đổi — không chỉ mô tả bằng lời là đã khớp mẫu/đã test. Môi trường không chạy/chụp được thì ghi rõ lý do cụ thể, không im lặng bỏ qua hoặc tự nhận đã verify.

> Quy trình UI/CMS chi tiết: [`coding-frontend`](../skills/coding-frontend/SKILL.md). TypeScript: [`type-safety`](./type-safety.md).
