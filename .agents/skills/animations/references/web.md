# Animation cho website

Nguồn và mức xác minh: `docs/references/animation-motion-20261024.md`. Kiểm bảng hỗ trợ trình duyệt hiện tại (MDN, caniuse) trước khi dùng tính năng mới.

## Kỹ thuật theo mức

1. CSS `transition`/`@keyframes` cho trạng thái đơn giản (mặc định).
2. `@starting-style` kèm `transition-behavior: allow-discrete` để animate phần tử vào/ra (`display`, popover, dialog). `@starting-style` đạt Baseline "Newly available" từ 08/2024.
3. View Transitions cho đổi route/DOM: `document.startViewTransition` (same-document, Baseline "Newly available" từ 10/2025). Cross-document (`@view-transition { navigation: auto }`) chưa xác minh hỗ trợ ngoài Chrome: bắt buộc feature-detect và fallback.
4. Scroll-driven animations (`animation-timeline`): MDN ghi hỗ trợ hạn chế; dùng `@supports (animation-timeline: scroll())`, coi là nâng cấp tùy chọn, nội dung vẫn hiện đủ khi không hỗ trợ.
5. Web Animations API (`element.animate`) khi cần điều khiển bằng JS (hủy, kết thúc, đảo chiều).
6. Thư viện chỉ khi stack đã có: Motion (React: gesture/layout/exit), GSAP (timeline phức tạp; đọc điều khoản license trước khi dùng thương mại), Lottie (asset do designer xuất). Kiểm kích thước bundle và license hiện tại.

## Reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  .item { transition: opacity 0.1s linear; transform: none; }
}
```

JS: `matchMedia("(prefers-reduced-motion: reduce)")` kèm listener `change`. Thiết kế mặc định "có chuyển động" rồi giảm khi `reduce`, hoặc mặc định tĩnh rồi thêm khi `no-preference`; chọn theo design system.

## Mẫu hiệu ứng thông dụng

Thời lượng theo [SKILL.md](../SKILL.md#thời-lượng-và-easing-mặc-định). Cột cuối là hành vi khi reduce motion.

- Hover/press: `transform`/`opacity`/màu. Reduced: chỉ đổi màu. Focus ring luôn hiện, không animate chuyển động.
- Toggle, tab indicator: translate hoặc `scaleX`. Reduced: nhảy tức thì.
- Accordion: `grid-template-rows` từ `0fr` sang `1fr` (hoặc `interpolate-size` nếu đã hỗ trợ). Reduced: không animate.
- Modal/drawer/popover: `@starting-style` + `allow-discrete`. Reduced: chỉ fade.
- Toast: fade + translate nhỏ, kèm `aria-live`. Reduced: chỉ fade.
- Skeleton: shimmer chậm. Reduced: tĩnh hoặc pulse opacity nhẹ.
- List stagger: delay theo index. Reduced: bỏ delay.
- Scroll reveal: `IntersectionObserver` hoặc scroll-driven, chạy một lần. Reduced: hiện luôn.
- Route transition: View Transitions crossfade. Reduced: tắt hoặc crossfade ngắn.
- Number counter: reduced hiển thị giá trị cuối.

## Lỗi thường gặp

- Animate `width/height/top/left` gây reflow; dùng `transform`.
- `will-change` gắn khắp nơi; ẩn LCP bằng `opacity: 0`.
- Animation chặn nút hoặc form; loop vô hạn ở admin.
- Quên reduced-motion hoặc hiệu ứng là tín hiệu duy nhất.
- Dùng tính năng chỉ Chrome mà không fallback.
