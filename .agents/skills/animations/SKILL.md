---
name: animations
description: "Thiết kế và triển khai hiệu ứng/animation/motion cho website và app (iOS, Android, React Native, Flutter): UX trước UI, thời lượng, easing, reduced-motion, hiệu năng. Dùng khi thêm hoặc sửa hiệu ứng chuyển trạng thái, hover, modal, route, list, loading. Admin giữ tối giản."
license: MIT
metadata:
  version: "1.0"
---

# Animations

Khi hoạt ảnh lấy từ link/nguồn tham chiếu (clone hoặc thiết kế theo mẫu): phân tích (trigger, thuộc tính đổi, thời lượng, easing, trạng thái, reduced-motion) rồi ghi vào `docs/design/animations.md` trước khi code; phần không đo được ghi chưa xác minh, không đoán số.

Chỉ thêm hiệu ứng khi người dùng yêu cầu hoặc task UI cần; không thêm hiệu ứng ngoài scope ([`rules/frontend`](../../rules/frontend.md), [`rules/coding`](../../rules/coding.md#kiss-yagni-và-phạm-vi)). Giữ design system, thư viện và quy ước motion sẵn có của project; mặc định chỉ dùng công nghệ platform, không thêm dependency khi chưa được duyệt.

## UX trước, UI sau

1. Trả lời trước: hiệu ứng này giúp người dùng làm việc gì (phản hồi hành động, báo thay đổi trạng thái, định hướng không gian, thể hiện thứ bậc)? Không trả lời được thì không thêm.
2. Không để hiệu ứng chặn thao tác, làm chậm tác vụ lặp lại hoặc là nguồn thông tin duy nhất (kèm text/icon/`aria-live`).
3. Sau khi luồng UX đúng mới chỉnh độ mượt, easing và phong cách; không đổi layout hay luồng để "đẹp hơn".
4. Giao diện quản trị/dashboard: đơn giản, dễ dùng, ít bước. Chỉ hiệu ứng có chức năng (hover/press/focus, mở đóng panel, báo lưu/lỗi, loading), thời lượng ngắn, không hiệu ứng trang trí hay lặp vô hạn.
5. Giao diện công khai/marketing có thể giàu hiệu ứng hơn, vẫn qua bước 1–2 và [reduced-motion](#reduced-motion-và-accessibility).

## Thời lượng và easing mặc định

Giá trị đề xuất (chưa có số chính thức; ưu tiên token của design system hiện có):

- Hover/focus/press: 100–150 ms, ease-out. Toggle, tab indicator: 150–250 ms.
- Modal/drawer/popover: 200–300 ms; vào ease-out, ra ngắn hơn khoảng 70–80%.
- Chuyển route/trang: 200–400 ms, ưu tiên crossfade. List stagger: 30–60 ms/mục, tổng không quá khoảng 400 ms.
- Scroll reveal: 300–500 ms, chạy một lần. Skeleton shimmer: chậm, nhẹ. Spinner: liên tục, tuyến tính.
- Nguyên tắc: phần tử càng lớn/xa càng dài; thoát ngắn hơn vào; app mobile giữ ngắn tương đương hoặc hơn web.

## Reduced-motion và accessibility

- Mọi hiệu ứng phải có nhánh giảm chuyển động khi hệ điều hành bật reduce motion: bỏ scale/slide/parallax/xoay, giữ fade ngắn hoặc đổi trạng thái tức thì. Chuyển động lớn (zoom, pan, parallax) là nguồn gây chóng mặt phổ biến.
- Animation tự chạy quá vài giây phải có cách dừng/ẩn; không nhấp nháy quá 3 lần/giây. Đối chiếu WCAG 2.2 (2.2.2, 2.3.1, 2.3.3) với W3C trước khi khẳng định tuân thủ.
- Không làm mất focus khi animate; trả focus đúng chỗ khi đóng modal/drawer.
- Spinner tiến độ có thể giữ khi reduce motion nếu là thông tin thiết yếu; nếu không, thay bằng text/progress tĩnh.

## Hiệu năng

- Chỉ animate thuộc tính compositor (`transform`, `opacity`) trên web; tránh animate layout (`width/height/top/left`), blur và shadow nặng.
- `will-change` chỉ gắn ngay trước khi cần và gỡ sau, không gắn sẵn cho nhiều phần tử.
- Không ẩn nội dung LCP bằng `opacity: 0` chờ animation; không animate gây layout shift.
- App: chạy animation trên UI thread/native driver, tránh làm việc nặng trong frame.
- Kiểm chứng bằng công cụ thật (DevTools Performance, profiler của platform). Không đo được thì ghi rõ chỉ rà tĩnh.

## Chọn theo nền tảng

- Web: [references/web.md](./references/web.md) (CSS, `@starting-style`, View Transitions, scroll-driven, WAAPI, thư viện, mẫu hiệu ứng).
- App: [references/app.md](./references/app.md) (iOS, Android, React Native, Flutter).
- Nguồn nghiên cứu, mức xác minh và URL: `docs/references/animation-motion-20261024.md` (nếu có trong máy).

## Checklist trước khi bàn giao

- Mỗi hiệu ứng trả lời được "giúp người dùng làm gì" và không ngoài scope.
- Có nhánh reduced-motion; không hiệu ứng nào là thông tin duy nhất; focus giữ đúng.
- Chỉ animate thuộc tính rẻ; không layout shift; kiểm bằng ảnh/quay hoặc profiler khi có thể.
- Tính năng platform mới (View Transitions cross-document, scroll-driven) có feature-detect và fallback; kiểm bảng hỗ trợ hiện tại trước khi dùng.
- UI có ảnh/URL chứng cứ theo [`rules/frontend`](../../rules/frontend.md); hiệu ứng chuyển động ghi rõ cách đã kiểm.
