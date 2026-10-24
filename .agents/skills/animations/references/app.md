# Animation cho app

Nguồn và mức xác minh: `docs/references/animation-motion-20261024.md`. Nhiều API dưới đây chưa xác minh được từ tài liệu chính thức khi nghiên cứu; đối chiếu docs platform hiện hành trước khi dùng.

## Nguyên tắc chung

- Cùng UX như [SKILL.md](../SKILL.md): hiệu ứng phải giúp người dùng; admin app/màn hình công việc giữ tối giản.
- Tôn trọng cài đặt reduce motion của hệ điều hành; thay chuyển động lớn bằng crossfade hoặc đổi trạng thái tức thì.
- Shared element (chuyển phần tử giữa hai màn hình) có API riêng từng nền tảng; chỉ dùng khi giúp định hướng.
- Animation phản hồi gesture nên ngắt được và theo ngón tay; không khóa thao tác trong lúc chạy.

## iOS (SwiftUI/UIKit)

- Nguyên tắc: HIG Motion yêu cầu motion có mục đích, hạn chế zoom/xoay/parallax lớn.
- SwiftUI: `withAnimation`, `spring`, `matchedGeometryEffect` (shared element theo `id` + `Namespace`).
- Reduce motion: SwiftUI `accessibilityReduceMotion` (Environment); UIKit `UIAccessibility.isReduceMotionEnabled`. Chưa xác minh từ docs Apple.

## Android (Jetpack Compose)

- API: `AnimatedVisibility`, `AnimatedContent`, `animateContentSize`, `animate*AsState`, `Transition`, `InfiniteTransition`, shared elements; tùy biến duration/easing/spring.
- Material 3 có token duration/easing; giá trị số cụ thể chưa xác minh, dùng token của theme project.
- Tôn trọng cài đặt tắt animation của hệ thống (animator duration scale); chưa xác minh chi tiết API từ docs.

## React Native

- `AccessibilityInfo.isReduceMotionEnabled()` (Promise) và sự kiện `reduceMotionChanged`; Android trả true khi Transition Animation Scale tắt.
- Animation chạy trên UI thread khi có thể (native driver/Reanimated); chưa xác minh chi tiết Reanimated `useReducedMotion` từ docs. Dùng thư viện đã có trong project.

## Flutter

- Ưu tiên implicit animation (`AnimatedContainer`, `TweenAnimationBuilder`); dùng explicit (`AnimationController`, cần `vsync`) khi cần điều khiển. `Hero` cho shared element.
- `MediaQuery.disableAnimations` báo hệ điều hành yêu cầu tắt/giảm animation; `AnimationController` không tự đọc giá trị này, cần tự xử lý trong code.

## Khác biệt với web (suy luận, chưa có nguồn chính thức)

- Gesture-driven và spring ngắt được phổ biến hơn.
- Haptics đi kèm hiệu ứng quan trọng; 60/120 fps làm khung thời gian mỗi frame ngắn hơn.
