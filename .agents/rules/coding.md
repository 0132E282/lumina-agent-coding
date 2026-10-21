---
trigger: model_decision
description: "Áp dụng khi viết hoặc sửa code: nguyên tắc code, phạm vi KISS/YAGNI, comment và TypeScript"
---

# Quy tắc code

## Nguyên tắc code

- Logic trùng chỉ được gom khi cùng ý nghĩa nghiệp vụ và lý do thay đổi; giữ Rule of Three.
- Một class/function có một lý do thay đổi; ưu tiên composition, abstraction chỉ khi có nhu cầu thay thế thật.
- Validate/fail fast tại boundary trước side effect; business logic tách khỏi HTTP/framework; lỗi phải cụ thể.
- Tên và cấu trúc phải tự giải thích; file text mới/sửa phải có final newline, giữ line ending hiện có.

Quy trình, checklist và ví dụ: [`coding-standards`](../skills/coding-standards/SKILL.md). Comment: [`comments`](#comment-có-kỷ-luật). Phạm vi/KISS: [`simplicity`](#kiss-yagni-và-phạm-vi).

## KISS, YAGNI và phạm vi

- Chọn giải pháp đơn giản nhất đáp ứng yêu cầu hiện tại; không thêm abstraction/config/layer cho nhu cầu giả định.
- Chỉ yêu cầu người dùng, task/plan đã duyệt và file/hành vi nêu rõ mới cấp quyền thay đổi.
- Vấn đề ngoài phạm vi phải nêu file, tác động, lý do và xin chấp thuận; vẫn tiếp tục phần độc lập đã được giao.
- Cleanup, accessibility, tối ưu hay convention không tự tạo quyền đổi hành vi.

Hướng dẫn vận hành: [`coding-standards`](../skills/coding-standards/SKILL.md#kissyagni), [`workflow-implement`](../skills/workflow-implement/SKILL.md) và [`design-patterns`](../skills/design-patterns/references/refactoring.md).

## Comment có kỷ luật

- Mặc định không comment logic tự giải thích; chỉ comment `why` mà code không thể hiện.
- Cấm code comment-out, TODO thiếu ngữ cảnh, comment lỗi thời và docblock lặp signature.
- Comment phải ngắn; khi sửa code phải cập nhật hoặc xoá comment không còn đúng.

Nhãn, giới hạn độ dài và checklist: [`coding-standards`](../skills/coding-standards/SKILL.md#comment).

## An toàn type

- Tuyệt đối không dùng `any`, implicit `any`, double assertion, `@ts-ignore` hoặc tắt lint để lách type; dữ liệu chưa biết dùng `unknown` rồi validate/narrow.
- Tái sử dụng và dẫn xuất type từ domain/SDK/schema gốc; không sao chép hoặc khai báo lại.
- Type thuộc owner domain, gom theo domain trong `types/` hoặc convention module hiện có.

Quy trình tìm, dẫn xuất, import và kiểm chứng type: [`coding-standards`](../skills/coding-standards/SKILL.md#typescript).
