---
title: "Tài liệu tham khảo animation/motion cho website và app"
description: "Nguồn chính thức và mức xác minh cho skill animations: UX motion, accessibility, hiệu năng, kỹ thuật web và app (iOS, Android, React Native, Flutter); dùng khi viết hoặc review hiệu ứng."
tags: ["animation", "motion", "ux", "accessibility", "reduced-motion", "web", "mobile", "reference"]
---

# Animation/motion — nguồn và mức xác minh

Ngày kiểm: 2026-10-24, bằng subagent `researcher`; nhiều trang chính thức trả nội dung rỗng. **[XM]** đã xác minh từ nguồn chính thức, **[SL]** chưa xác minh, **[KT]** không tìm thấy. Quy tắc áp dụng nằm trong [`animations`](../../.agents/skills/animations/SKILL.md); tài liệu này chỉ giữ nguồn.

## UX và accessibility

- [XM] HIG Motion: motion có mục đích, feedback ngắn, hạn chế zoom/xoay/parallax lớn. https://developer.apple.com/design/human-interface-guidelines/motion
- [XM] MDN: scale/pan vật thể lớn gây vestibular; `prefers-reduced-motion` (`no-preference`/`reduce`) Baseline Widely available từ 01/2020; JS `matchMedia` + `change`. https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- [XM] WCAG 2.3.3 (AAA): motion do tương tác phải tắt được trừ khi thiết yếu; kỹ thuật C39, SCR40. https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- [SL] WCAG 2.2.2 (A, tự chuyển động quá 5 giây) và 2.3.1 (A, ≤ 3 lần nháy/giây): xác minh ở W3C trước khi ghi tuân thủ.
- [KT] Số ms/easing chính thức: trang token M3 trả rỗng (https://m3.material.io/styles/motion/easing-and-duration/tokens-specs); chỉ biết có token `short1..extra-long4`. Thời lượng trong skill là đề xuất [SL].

## Hiệu năng

- [XM] Chỉ animate `transform`/`opacity`; `top/left` rớt nhiều frame; blur/shadow tốn paint; `will-change` gắn ngay trước khi cần rồi gỡ. https://web.dev/articles/animations-guide
- [SL] Tác động CLS/INP/LCP và đo bằng DevTools Performance: chưa fetch nguồn.

## Web

- [XM] `@starting-style`: Baseline Newly available từ 08/2024. https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style
- [XM] `transition-behavior: allow-discrete` cần để animate `display`/`overlay`; Baseline [KT].
- [XM] View Transitions same-document: Baseline Newly available từ 16/10/2025. https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available · https://developer.chrome.com/blog/view-transitions-in-2025
- Cross-document: Chrome từ 2024 [XM]; Safari/Firefox [KT]; cần feature-detect. https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- [XM một phần] Scroll-driven (`animation-timeline`): MDN ghi hỗ trợ hạn chế; Chrome/Edge 115; Safari 26, Firefox chỉ qua nguồn thứ cấp. https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline
- [SL] WAAPI Baseline rộng (chưa fetch MDN).
- Thư viện: Motion (React) `motion` ~43 kB, `m` + LazyMotion ~5 kB + `domAnimation` 24 kB / `domMax` 38 kB, `useAnimate` mini 3,3 kB (https://motion.dev/docs/react-reduce-bundle-size); license Motion, Lottie, auto-animate [KT]. GSAP ghi "now free for everyone" (https://gsap.com/community/standard-license/); đọc điều khoản trước khi dùng thương mại.

## App

- iOS: reduce motion [XM từ HIG]. `accessibilityReduceMotion`, `UIAccessibility.isReduceMotionEnabled`, `spring`, `matchedGeometryEffect`: [SL], docs Apple trả rỗng. https://developer.apple.com/documentation/swiftui/view/matchedgeometryeffect(id:in:properties:anchor:issource:)
- Android: [XM] Compose `AnimatedVisibility`, `AnimatedContent`, `animateContentSize`, `animate*AsState`, `Transition`, `InfiniteTransition`, shared elements. https://developer.android.com/develop/ui/compose/animation/introduction · `ANIMATOR_DURATION_SCALE` [SL].
- React Native: [XM] `AccessibilityInfo.isReduceMotionEnabled()` và `reduceMotionChanged`; Android true khi Transition Animation Scale tắt. https://reactnative.dev/docs/accessibilityinfo · Reanimated `useReducedMotion`, `useNativeDriver` [KT].
- Flutter: [XM] implicit trước, explicit (`AnimationController`, `vsync`) khi cần điều khiển; `Hero`. https://docs.flutter.dev/ui/animations · `MediaQueryData.disableAnimations`; `AnimationController` không tự đọc giá trị này. https://api.flutter.dev/flutter/widgets/MediaQueryData/disableAnimations.html
- Khác biệt web/app (gesture, haptics, 60/120 fps, thời lượng): [KT], chỉ là suy luận.

## Cần xác minh trước khi coi là chuẩn

Bảng hỗ trợ MDN/caniuse (cross-document, scroll-driven, `allow-discrete`), W3C 2.2.2/2.3.1, CLS/INP trên web.dev, token M3, docs Apple/Android/Reanimated, license Motion/Lottie/auto-animate.
