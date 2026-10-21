---
name: refactoring-catalog
description: Tra cứu danh mục kỹ thuật refactor (theo Fowler/Refactoring.Guru) ứng với từng code smell cụ thể — Extract Method/Function, Extract Variable, Decompose Conditional, Replace Conditional with Polymorphism, Replace Magic Number with Symbolic Constant, Introduce Parameter Object, Extract Class, Replace Temp with Query — kèm khi nào nên và không nên áp dụng. Dùng khi thấy code smell cụ thể (hàm quá dài, điều kiện lồng sâu, trùng lặp, quá nhiều tham số) cần refactor nhưng chưa chắc kỹ thuật nào phù hợp. KHÔNG dùng để refactor tràn lan ngoài phạm vi đang sửa (xem rules/simplicity) hoặc khi vấn đề cần một design pattern mới cho cấu trúc mở rộng (dùng design-patterns).
license: MIT
metadata:
  version: "1.1"
---

# 🔨 Refactoring Catalog

Khác [`design-patterns`](../design-patterns/SKILL.md) (tạo cấu trúc mới cho nhu cầu mở rộng), skill này **cải tiến code đang có** mà không đổi hành vi quan sát được — input/output giữ nguyên, chỉ đổi cách tổ chức bên trong.

## Nguyên tắc bắt buộc

- Không đổi hành vi — output khác đi là sửa bug/thêm tính năng, không phải refactor.
- Phải có test bao phủ trước khi refactor ([`rules/quality-assurance`](../../rules/quality-assurance.md)); thiếu test → viết test chốt hành vi hiện tại trước (dùng [`testing-strategy`](../testing-strategy/SKILL.md)).
- Từng bước nhỏ, chạy lại test sau mỗi bước — không dồn nhiều kỹ thuật vào một lần sửa lớn.
- Rule of Three ([`rules/coding-principles`](../../rules/coding-principles.md)): smell lặp 2 lần có thể chấp nhận, lần 3 mới refactor.
- Giữ phạm vi ([`rules/simplicity`](../../rules/simplicity.md)): chỉ refactor phần cần thiết cho task đã giao.

## Code smell → kỹ thuật refactor

| Code smell | Kỹ thuật |
|---|---|
| Hàm quá dài, làm nhiều việc (tên có "và": `validateAndSave`) | **Extract Method/Function** |
| Biểu thức điều kiện/tính toán phức tạp khó đọc | **Extract Variable** |
| `if/else` lồng sâu nhiều tầng | **Decompose Conditional** / Guard Clauses (early return, [`rules/coding-principles`](../../rules/coding-principles.md)) |
| `switch`/`if-else` theo loại đối tượng, lặp ở **≥3 nơi** | **Replace Conditional with Polymorphism** — 1 nơi duy nhất thì giữ `if` ([`rules/simplicity`](../../rules/simplicity.md)) |
| Số/chuỗi "ma thuật" lặp lại không rõ nghĩa | **Replace Magic Number/String with Symbolic Constant** |
| Hàm nhận quá nhiều tham số cùng mô tả một khái niệm | **Introduce Parameter Object** (`street, city, zip` → `Address`) |
| Data clump — cùng nhóm field + hàm xử lý lặp ở nhiều chỗ | **Extract Class** ([`rules/coding-principles`](../../rules/coding-principles.md)) |
| Biến tạm chỉ dùng gọi lại một biểu thức một lần | **Replace Temp with Query** — cẩn trọng nếu biểu thức là query nặng (DB/network) |
| Comment giải thích "đoạn này làm gì" | **Extract Method + đặt tên rõ** thay comment ([`rules/comments`](../../rules/comments.md)) |

## Khi áp dụng

- Thấy code smell cụ thể ở bảng trên — tra để chọn đúng kỹ thuật, xác nhận đã có test bao phủ trước khi refactor.
- Không dùng để refactor lan ra ngoài phạm vi task ([`rules/simplicity`](../../rules/simplicity.md)), hoặc khi vấn đề cần pattern kiến trúc mới (→ [`design-patterns`](../design-patterns/SKILL.md)).
