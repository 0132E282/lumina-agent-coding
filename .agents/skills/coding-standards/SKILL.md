---
name: coding-standards
description: Checklist code cross-stack về DRY/SOLID/SRP/fail-fast, comment, TypeScript strict typing, readability và KISS/YAGNI.
---

# Coding standards

Đọc các invariant trong [`coding-principles`](../../rules/coding.md#nguyên-tắc-code), [`comments`](../../rules/coding.md#comment-có-kỷ-luật), [`type-safety`](../../rules/coding.md#an-toàn-type) và [`simplicity`](../../rules/coding.md#kiss-yagni-và-phạm-vi) trước khi dùng checklist này.

## DRY, SOLID và trách nhiệm

- Chỉ gom logic có cùng ý nghĩa nghiệp vụ và cùng lý do thay đổi. Rule of Three: chấp nhận hai lần lặp; lần thứ ba mới refactor.
- Trước khi tạo resource/config mới, tìm resource cùng mục đích trong code/config và dùng lại khi phù hợp.
- Ưu tiên composition; chỉ kế thừa khi quan hệ `is-a` thật và ổn định. Chỉ tạo interface/DI khi có nhu cầu thay thế thật.
- Với request flow, tách HTTP, validation, authorization và business logic. Business logic không phụ thuộc HTTP/framework nếu cần tái dùng hoặc test độc lập.
- Validate boundary và điều kiện nghiệp vụ trước khi ghi dữ liệu; trả lỗi cụ thể. Dùng early return, tên rõ nghĩa và function một trách nhiệm.
- Giữ format codebase. File text mới/sửa phải có final newline và giữ line ending hiện có; không format file ngoài scope.

## Comment

- Không comment logic tự giải thích. Chỉ giải thích `why`: business constraint, workaround hoặc hành vi bất ngờ của bên thứ ba.
- Nhãn: `*` thông tin quan trọng, `!` cảnh báo, `?` câu hỏi cần xác nhận, `TODO:` kèm ngữ cảnh; `@param`/`@return` chỉ khi bổ sung type mà signature không có.
- Không giữ code comment-out, TODO thiếu ngữ cảnh, banner, comment lỗi thời hoặc PHPDoc/JSDoc lặp signature.
- Mỗi dòng tối đa 180 ký tự, mỗi đoạn 1–3 dòng. Dài hơn thì rút còn invariant/hệ quả, tách hàm hoặc chuyển docs; nhiều cảnh báo dùng từng dòng `!` riêng.
- Khi sửa code, cập nhật hoặc xoá comment không còn đúng.

## TypeScript

- Không dùng `any`, implicit `any`, `as unknown as T`, `@ts-ignore` hoặc tắt lint để lách type. Dữ liệu chưa biết dùng `unknown` rồi validate/narrow.
- Tìm và tái sử dụng type domain/SDK/schema trước; dùng inference khi đủ rõ. Dẫn xuất bằng `extends`, intersection, `Pick`, `Omit`, `Partial` khi đúng ngữ nghĩa.
- Chỉ tạo type mới cho contract/khái niệm thật sự khác. Gom type theo domain trong `types/` hoặc convention module; không khai báo lại trong component/service/hook.
- Dùng `import type` khi phù hợp; import generated type từ nguồn và chỉ dẫn xuất khi cần.
- Chạy type checker/lint sẵn có; sửa lỗi ở nguồn, không dùng assertion che dữ liệu chưa kiểm chứng.

## KISS/YAGNI

- Chọn giải pháp đơn giản nhất cho yêu cầu hiện tại; ba dòng lặp còn tốt hơn abstraction sinh non.
- Không thêm config/interface/layer hay design pattern cho nhu cầu giả định. Nếu giải pháp cần sơ đồ mới giải thích được, đơn giản hoá lại.
- Phát hiện vấn đề ngoài scope thì ghi file, tác động, lý do và xin chấp thuận; tiếp tục phần độc lập. Cleanup, accessibility, tối ưu hoặc convention không tự tạo quyền đổi hành vi.

## Checklist bàn giao

- Logic trùng đã được phân biệt theo ý nghĩa nghiệp vụ; abstraction mới có nhu cầu thật.
- Boundary validation, authorization và side effect nằm đúng lớp.
- Comment và type tuân thủ các mục trên.
- Diff không chứa thay đổi ngoài scope; formatter, lint và type checker liên quan đã chạy hoặc được ghi rõ chưa chạy.
