# 🔨 Refactoring Catalog

Khi refactor, áp dụng Rule of Three, SRP, comment/readability và KISS/YAGNI từ [`coding-standards`](../../coding-standards/SKILL.md); không dùng catalog để mở rộng scope.

Khác [`design-patterns`](../SKILL.md) (tạo cấu trúc mới cho nhu cầu mở rộng), skill này **cải tiến code đang có** mà không đổi hành vi quan sát được — input/output giữ nguyên, chỉ đổi cách tổ chức bên trong.

## Nguyên tắc bắt buộc

- Không đổi hành vi — output khác đi là sửa bug/thêm tính năng, không phải refactor.
- Phải có test bao phủ trước khi refactor ([`rules/delivery`](../../../rules/delivery.md#chất-lượng-và-bằng-chứng)); thiếu test → viết test chốt hành vi hiện tại trước (dùng [`testing`](../../testing/references/unit-testing.md)).
- Từng bước nhỏ, chạy lại test sau mỗi bước — không dồn nhiều kỹ thuật vào một lần sửa lớn.
- Rule of Three ([`rules/coding`](../../../rules/coding.md#nguyên-tắc-code)): smell lặp 2 lần có thể chấp nhận, lần 3 mới refactor.
- Giữ phạm vi ([`rules/coding`](../../../rules/coding.md#kiss-yagni-và-phạm-vi)): chỉ refactor phần cần thiết cho task đã giao.

## Code smell → kỹ thuật refactor

| Code smell | Kỹ thuật |
|---|---|
| Hàm quá dài, làm nhiều việc (tên có "và": `validateAndSave`) | **Extract Method/Function** |
| Biểu thức điều kiện/tính toán phức tạp khó đọc | **Extract Variable** |
| `if/else` lồng sâu nhiều tầng | **Decompose Conditional** / Guard Clauses (early return, [`rules/coding`](../../../rules/coding.md#nguyên-tắc-code)) |
| `switch`/`if-else` theo loại đối tượng, lặp ở **≥3 nơi** | **Replace Conditional with Polymorphism** — 1 nơi duy nhất thì giữ `if` ([`rules/coding`](../../../rules/coding.md#kiss-yagni-và-phạm-vi)) |
| Số/chuỗi "ma thuật" lặp lại không rõ nghĩa | **Replace Magic Number/String with Symbolic Constant** |
| Hàm nhận quá nhiều tham số cùng mô tả một khái niệm | **Introduce Parameter Object** (`street, city, zip` → `Address`) |
| Data clump — cùng nhóm field + hàm xử lý lặp ở nhiều chỗ | **Extract Class** ([`rules/coding`](../../../rules/coding.md#nguyên-tắc-code)) |
| Biến tạm chỉ dùng gọi lại một biểu thức một lần | **Replace Temp with Query** — cẩn trọng nếu biểu thức là query nặng (DB/network) |
| Comment giải thích "đoạn này làm gì" | **Extract Method + đặt tên rõ** thay comment ([`rules/coding`](../../../rules/coding.md#comment-có-kỷ-luật)) |

## Khi áp dụng

- Thấy code smell cụ thể ở bảng trên — tra để chọn đúng kỹ thuật, xác nhận đã có test bao phủ trước khi refactor.
- Không dùng để refactor lan ra ngoài phạm vi task ([`rules/coding`](../../../rules/coding.md#kiss-yagni-và-phạm-vi)), hoặc khi vấn đề cần pattern kiến trúc mới (→ [`design-patterns`](../SKILL.md)).
