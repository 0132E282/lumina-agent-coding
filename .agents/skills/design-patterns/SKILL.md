---
name: design-patterns
description: Tra cứu 22 design pattern GoF (phân loại theo Refactoring.Guru) theo 3 nhóm Creational/Structural/Behavioral — ngữ cảnh nên dùng, ví dụ backend, và bảng phân biệt các cặp pattern dễ nhầm (Strategy/State, Factory Method/Abstract Factory, Adapter/Facade, Decorator/Proxy, Bridge/Adapter, Strategy/Template Method). Dùng khi: cần chọn pattern phù hợp cho một vấn đề cụ thể đang lặp lại hoặc khó sửa, cần giải thích một pattern, hoặc phân vân giữa hai pattern trông giống nhau. KHÔNG dùng để tự ý nhồi pattern vào code khi task chưa thực sự cần (xem rules/coding.md). Danh mục kỹ thuật refactor theo code smell: references/refactoring.md.
license: MIT
metadata:
  version: "1.1"
---

# 🧩 Design Patterns (GoF)

Chỉ chọn pattern khi có nhu cầu thay thế/mở rộng thật; ưu tiên composition và KISS/YAGNI theo [`coding-standards`](../coding-standards/SKILL.md).

Phân loại và mô tả theo Refactoring.Guru — 22 pattern trong danh mục của trang này, không phải toàn bộ pattern tồn tại trong lập trình.

> ⚠️ **Trước khi áp dụng bất kỳ pattern nào trong skill này**, đọc lại [`rules/coding.md`](../../rules/coding.md#kiss-yagni-và-phạm-vi): chỉ thêm pattern khi nó giải quyết rõ một vấn đề cụ thể đang lặp lại hoặc khó sửa — không đưa pattern vào "phòng khi cần mở rộng" sau này. Không cần đưa đủ 22 pattern vào một dự án.

## Tra cứu theo nhóm

| Nhóm | Số pattern | Mục đích chính | Chi tiết |
|---|---|---|---|
| Creational — khởi tạo | 5 | Kiểm soát cách tạo đối tượng khi việc khởi tạo có nhiều biến thể/cấu hình | [references/creational.md](./references/creational.md) |
| Structural — cấu trúc | 7 | Kết hợp đối tượng/lớp mà vẫn dễ thay đổi, mở rộng | [references/structural.md](./references/structural.md) |
| Behavioral — hành vi | 10 | Phân chia trách nhiệm, tổ chức thuật toán, điều phối giao tiếp giữa các đối tượng | [references/behavioral.md](./references/behavioral.md) |

## Pattern dễ nhầm — phân biệt nhanh

| Cặp pattern | Cách phân biệt |
|---|---|
| Factory Method / Abstract Factory | Factory Method cho lớp con quyết định **một** sản phẩm được tạo; Abstract Factory tạo cả **một họ** sản phẩm liên quan. |
| Strategy / State | Strategy thay **cách thực hiện** nhiệm vụ; State thay **hành vi theo trạng thái** và quy tắc chuyển trạng thái. |
| Strategy / Template Method | Strategy thay thuật toán qua đối tượng được truyền vào; Template Method giữ khung quy trình và cho lớp con thay một số bước. |
| Adapter / Facade | Adapter chuyển interface cho tương thích; Facade cung cấp lối gọi đơn giản vào subsystem phức tạp. |
| Decorator / Proxy | Decorator bổ sung hành vi có thể kết hợp; Proxy kiểm soát việc truy cập đối tượng thật. |
| Bridge / Adapter | Bridge chủ động tách hai chiều phát triển độc lập từ đầu; Adapter kết nối các interface đã tồn tại nhưng không tương thích. |

## Thứ tự học gợi ý (backend)

`Strategy (tính giá/discount) → Adapter (tích hợp API ngoài) → Observer (sự kiện) → Chain of Responsibility (pipeline request) → Factory Method/Template Method (import/export) → State (quy trình đơn hàng)`

## Khi áp dụng

- Đang refactor một đoạn code bị lặp hoặc khó mở rộng, muốn biết có pattern nào đã giải quyết đúng vấn đề này chưa.
- Cần giải thích một pattern cho người khác, hoặc trong lúc code review.
- Phân vân giữa hai pattern trông giống nhau — tra bảng "dễ nhầm" ở trên trước khi chọn.
- **Không** dùng skill này để tự thêm pattern vào code khi task không yêu cầu và chưa có vấn đề thật đang tồn tại — đó là over-engineering (xem [`rules/coding.md`](../../rules/coding.md#kiss-yagni-và-phạm-vi)).

## Danh mục refactor

Tra cứu kỹ thuật refactor theo code smell cụ thể (Extract Method, Decompose Conditional, Introduce Parameter Object...), khi nào nên và không nên áp dụng: [references/refactoring.md](./references/refactoring.md).
