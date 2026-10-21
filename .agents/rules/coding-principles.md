# 🧱 Nguyên tắc code — DRY, SOLID, SRP, Fail Fast, Dễ đọc

**Nhóm quy tắc kết hợp**: DRY + SOLID/Composition + SRP/Separation of Concerns + Fail Fast/Validation + Clean Code

## DRY

- Gom logic trùng khi cùng ý nghĩa nghiệp vụ và cùng lý do thay đổi; không gom chỉ vì nhìn giống nhau (validate địa chỉ giao hàng khác thanh toán). Tách phần thật sự chung (`validatePostalFormat`), giữ phần riêng.
- Rule of Three: trùng 2 lần chấp nhận được, lần thứ 3 mới refactor.
- Trước khi tạo resource/config mới (log channel, biến môi trường, cột DB, route, flag...) tìm xem đã có cái cùng mục đích chưa (`grep`/đọc config); có thì báo người dùng và dùng lại.

## SOLID + Composition

- Mở rộng bằng code mới thay vì sửa code cũ đang ổn định; subclass thay thế được superclass; interface nhỏ, chuyên biệt; phụ thuộc abstraction.
- Kế thừa chỉ khi quan hệ "is-a" thật và ổn định; tái dùng hành vi thì compose/inject object nhỏ. Dùng interface/DI khi có nhu cầu thay thế thật, không tạo interface "phòng xa" cho 1 implementation ([simplicity.md](./simplicity.md)).

## Tách trách nhiệm

- Tách 4 lớp của luồng request: HTTP → Validation → Phân quyền → Nghiệp vụ (không biết gì về HTTP).
- Một class/function một lý do thay đổi; sửa một tính năng mà phải động nhiều phần không liên quan là dấu hiệu vi phạm SRP. Business logic không phụ thuộc framework/HTTP để test và tái dùng (job nền, CLI).

## Fail fast + Validation

- Kiểm tra input và điều kiện nghiệp vụ trước khi ghi/sửa dữ liệu; điều kiện tiên quyết không thỏa thì dừng, trả lỗi rõ ràng.
- Validate ở boundary (input người dùng, request client, response API ngoài), không lặp ở mọi layer nội bộ.
- Lỗi cụ thể (field nào sai, vì sao), không chỉ "Invalid input".

## Dễ đọc

- Tên rõ nghĩa, không viết tắt trừ thuật ngữ chuẩn (`id`, `url`); hàm làm một việc (tên cần chữ "và" thì tách); format thống nhất với codebase; early return thay vì lồng `if/else` sâu.
- File text không rỗng vừa tạo/sửa phải có newline cuối file (kể cả JSON/index/docs), giữ LF/CRLF hiện có; ghi file bằng script thì thêm newline sau nội dung. Bỏ qua binary, file sinh tự động ngoài scope, fixture cố ý thiếu newline; không format lại file ngoài task.
- Quy tắc comment: [`comments.md`](./comments.md).
