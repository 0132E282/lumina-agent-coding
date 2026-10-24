---
title: "Tài liệu tham khảo animation/motion cho website và app"
description: "Tổng hợp nguyên tắc UX motion, accessibility, hiệu năng, kỹ thuật web và app (iOS, Android, React Native, Flutter) kèm URL nguồn và mức xác minh; dùng khi viết hoặc review hiệu ứng, và khi cập nhật skill animations."
tags: ["animation", "motion", "ux", "accessibility", "reduced-motion", "web", "mobile", "reference"]
---

# Animation/motion — tài liệu tham khảo

Ngày kiểm: 2026-10-24. Kết quả nghiên cứu bằng subagent `researcher`; nhiều trang chính thức trả nội dung rỗng nên một phần chưa xác minh được. Ký hiệu: **[XM]** đã xác minh từ nguồn chính thức, **[SL]** suy luận/kiến thức chung chưa xác minh, **[KT]** không tìm thấy. Skill dùng tài liệu này: [`.agents/skills/animations/SKILL.md`](../../.agents/skills/animations/SKILL.md).

## Nguyên tắc UX

- [XM] HIG Motion: motion phải có mục đích, dùng cho feedback ngắn, hạn chế zoom/xoay/parallax lớn. https://developer.apple.com/design/human-interface-guidelines/motion
- [XM] MDN: scale và pan vật thể lớn là trigger vestibular phổ biến; nên bỏ/giảm/thay (vd pulse scale → dissolve opacity). https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- [SL] Nên animate: feedback hành động, chuyển trạng thái, định hướng không gian, thứ bậc. Không nên: trang trí lặp vô hạn, animation chặn thao tác, animation là thông tin duy nhất.
- [KT] Số ms/easing chính thức: trang token Material 3 trả rỗng (https://m3.material.io/styles/motion/easing-and-duration/tokens-specs). Chỉ xác nhận M3 có token duration `short1..extra-long4` và easing emphasized/standard.

Thời lượng đề xuất [SL]: xem [`SKILL.md`](../../.agents/skills/animations/SKILL.md#thời-lượng-và-easing-mặc-định).

## Accessibility

- [XM] `prefers-reduced-motion`: `no-preference` | `reduce`; Baseline Widely available từ 01/2020; JS `matchMedia("(prefers-reduced-motion: reduce)")` + listener `change`. MDN link ở trên.
- [XM] WCAG 2.3.3 Animation from Interactions (AAA): motion do tương tác phải tắt được trừ khi thiết yếu; kỹ thuật C39 (CSS), SCR40 (JS). https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- [SL] 2.2.2 Pause/Stop/Hide (A, nội dung tự chuyển động quá 5 giây) và 2.3.1 Three Flashes (A, ≤ 3 lần/giây): cần xác minh ở W3C trước khi ghi tuân thủ.
- [SL] Không mất focus khi animate; trả focus khi đóng modal; không dùng animation làm tín hiệu duy nhất.

## Hiệu năng

- [XM] Chỉ animate `transform` và `opacity`; animate `top/left` rớt nhiều frame hơn; blur/shadow tốn paint; `will-change` chỉ gắn ngay trước khi cần rồi gỡ. https://web.dev/articles/animations-guide
- [SL] Ảnh hưởng CLS/INP/LCP (animate layout gây CLS, animation nặng trễ INP, không ẩn LCP bằng `opacity: 0`) và đo bằng DevTools Performance: chưa fetch nguồn.

## Kỹ thuật web

- [XM] `@starting-style`: Baseline Newly available từ 08/2024. https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style
- [XM] `transition-behavior: allow-discrete` cần để animate `display`/`overlay`; Baseline của nó [KT].
- [XM] View Transitions same-document: Baseline Newly available từ 16/10/2025 (Firefox 144 ngày 14/10/2025). https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available · https://developer.chrome.com/blog/view-transitions-in-2025
- Cross-document (`@view-transition { navigation: auto }`, `pageswap`/`pagereveal`): Chrome từ 2024 [XM]; Safari/Firefox [KT]; phải feature-detect + fallback. https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- [XM một phần] Scroll-driven animations (`animation-timeline`): MDN ghi hỗ trợ hạn chế; Chrome/Edge 115; Safari 26 và Firefox chỉ qua nguồn thứ cấp. https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline
- [SL] WAAPI: Baseline rộng, có `finished`, `cancel`, `commitStyles` (chưa fetch MDN).
- Thư viện: Motion (React) `motion` ~43 kB, `m` + LazyMotion ~5 kB + `domAnimation` 24 kB / `domMax` 38 kB, `useAnimate` mini 3,3 kB. https://motion.dev/docs/react-reduce-bundle-size · license Motion [KT]. GSAP trang chính thức ghi "now free for everyone", không nêu ngày hay plugin (https://gsap.com/community/standard-license/); đọc điều khoản trước khi dùng thương mại. Lottie, auto-animate: [KT] size/license.
- [SL] Chọn: CSS/WAAPI mặc định; View Transitions cho đổi route/DOM; scroll-driven chỉ khi có fallback; thư viện chỉ khi stack đã có.

## Mẫu hiệu ứng web [SL]

Xem [`references/web.md`](../../.agents/skills/animations/references/web.md#mẫu-hiệu-ứng-thông-dụng).

## App/mobile

- iOS: [XM từ HIG] reduce motion thay bằng crossfade/không animation. SwiftUI `accessibilityReduceMotion`, UIKit `UIAccessibility.isReduceMotionEnabled`, `withAnimation`, `spring` (iOS 17+ `spring(duration:bounce:)`, `.smooth/.snappy/.bouncy`), `matchedGeometryEffect`: [SL] vì docs Apple trả rỗng. https://developer.apple.com/documentation/swiftui/view/matchedgeometryeffect(id:in:properties:anchor:issource:)
- Android: [XM] Compose có `AnimatedVisibility`, `animateContentSize`, `AnimatedContent`, `animate*AsState`, `Transition`, `InfiniteTransition`, shared elements. https://developer.android.com/develop/ui/compose/animation/introduction (không nêu animator duration scale). `Settings.Global.ANIMATOR_DURATION_SCALE` (0 = kết thúc ngay): [SL].
- React Native: [XM] `AccessibilityInfo.isReduceMotionEnabled()` và sự kiện `reduceMotionChanged`; Android trả true khi Transition Animation Scale tắt. https://reactnative.dev/docs/accessibilityinfo · Reanimated `useReducedMotion`, chạy UI thread, `useNativeDriver`: [KT].
- Flutter: [XM] implicit (`AnimatedContainer`, `TweenAnimationBuilder`) trước, explicit (`AnimationController`, cần `vsync`) khi cần điều khiển; `Hero` cho shared element. https://docs.flutter.dev/ui/animations · `MediaQueryData.disableAnimations`; `AnimationController` đọc engine trực tiếp, override MediaQuery không tác động. https://api.flutter.dev/flutter/widgets/MediaQueryData/disableAnimations.html
- Khác biệt web và app (gesture-driven, haptics, 60/120 fps, thời lượng): [KT] trong nguồn chính thức; chỉ nên ghi như suy luận. Có nguồn: shared element có API riêng mỗi nền tảng.

## Cần xác minh trước khi coi là chuẩn

Bảng hỗ trợ MDN/caniuse (cross-document View Transitions, scroll-driven, `allow-discrete`), W3C 2.2.2/2.3.1, CLS/INP trên web.dev, token M3, tài liệu Apple/Android/Reanimated, license Motion/Lottie/auto-animate.
