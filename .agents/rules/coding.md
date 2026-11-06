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

Quy trình, checklist và ví dụ: [`coding-standards`](../skills/coding-standards/SKILL.md). Đặt tên: [`naming`](#đặt-tên). Comment: [`comments`](#comment-có-kỷ-luật). Phạm vi/KISS: [`simplicity`](#kiss-yagni-và-phạm-vi).

## Đặt tên

- Bảng dưới là mặc định; chỗ có ghi ngoại lệ theo ngôn ngữ thì theo convention chuẩn của ngôn ngữ/framework đó. Không đổi convention giữa các module; convention có sẵn trong repo thắng bảng.
- Bảng mặc định:

| Thành phần | Convention |
|---|---|
| Variable, parameter | camelCase ở mọi ngôn ngữ (C# private field `_camelCase`) |
| Function | camelCase (Rust/Python: snake_case; C# method/public property: PascalCase) |
| Class, interface, trait, struct, enum và enum variant, type alias, React component | PascalCase (C# interface: `IPascalCase`) |
| Module / namespace | Rust snake_case; JS/TS camelCase; C# namespace PascalCase |
| Constant, static, environment variable | SCREAMING_SNAKE_CASE (C#: PascalCase); JS/TS chỉ cho hằng toàn cục hoặc cấu hình, không bắt buộc mọi `const` |
| Database table / column / index | snake_case; table số nhiều (`order_items`), khóa ngoại `<bảng_số_ít>_id`, index `<bảng>_<cột>_<unique\|index>` |
| API endpoint | danh từ số nhiều, kebab-case (`/api/user-profiles`); biến API (query param, field JSON request/response) snake_case |
| CSS class, file CSS | kebab-case |
| File | Component/class PascalCase, hook `useXxx.ts`, utility camelCase, Rust module snake_case; còn lại theo framework |

- Boolean bắt đầu bằng `is`/`has`/`can`/`should`/`was`; collection là danh từ số nhiều; function bắt đầu bằng động từ (`get`, `find`, `create`, `update`, `delete`, `validate`, `calculate`, `send`, `sync`).
- Tránh tên chung chung (`data`, `item`, `value`) khi đặt được tên cụ thể, tên viết tắt khó hiểu, tên chỉ khác nhau chữ hoa/thường, tiếng Việt không dấu, ký tự đặc biệt hoặc khoảng trắng; tên phản ánh đúng trách nhiệm.
- Nguồn chính thức khi cần đối chiếu (ưu tiên hơn trí nhớ):
  - PHP/Laravel: [PSR-1](https://www.php-fig.org/psr/psr-1/), [PSR-4](https://www.php-fig.org/psr/psr-4/), [PSR-12](https://www.php-fig.org/psr/psr-12/), [Laravel](https://laravel.com/docs).
  - Rust: [Style Guide](https://doc.rust-lang.org/style-guide/), [API Guidelines](https://rust-lang.github.io/api-guidelines/).
  - JavaScript/TypeScript: [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript), [TypeScript Docs](https://www.typescriptlang.org/docs/), [Google JS](https://google.github.io/styleguide/jsguide.html), [Google TS](https://google.github.io/styleguide/tsguide.html).
  - C#: [Coding Conventions](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions), [Identifier names](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/identifier-names).
- Chạy formatter/linter của ngôn ngữ (Pint/PHP CS Fixer, rustfmt/Clippy, ESLint/Prettier, `dotnet format`) khi dự án đã có; không cài thêm chỉ để kiểm tra.
- Đổi tên code có sẵn chỉ khi nằm trong scope ([`simplicity`](#kiss-yagni-và-phạm-vi)).

## KISS, YAGNI và phạm vi

- Chọn giải pháp đơn giản nhất đáp ứng yêu cầu hiện tại; không thêm abstraction/config/layer cho nhu cầu giả định.
- Chỉ yêu cầu người dùng, task/plan đã duyệt và file/hành vi nêu rõ mới cấp quyền thay đổi; tài liệu dán, diff có sẵn, gợi ý agent, lỗi phát hiện thêm hay cải tiến "tiện tay" chỉ là context.
- Chốt scope trước khi code, giữ nguyên hành vi ngoài scope; không suy ra hoặc thêm feature, field, API/route, state, dependency, test, refactor, copy, asset hay cleanup ngoài scope.
- Scope mơ hồ, revert/conflict có sẵn hoặc vấn đề ngoài phạm vi: dừng đúng phần đó, nêu file, tác động, lý do và xin chấp thuận; vẫn tiếp tục phần độc lập đã được giao.
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
