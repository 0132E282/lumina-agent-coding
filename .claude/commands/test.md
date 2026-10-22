---
description: Kiểm thử tính năng theo plan, repository hoặc PR; lưu testcase/kết quả và Big O vào testcase.json
argument-hint: "[tính năng|repo [nhánh]|pr [URL|#số]]"
---

Giao cho agent `qa-tester` kiểm thử: $ARGUMENTS

## Scope

- `/test` hoặc `/test <tính năng>`: mặc định kiểm thử các tính năng/task trong plan đang được giao. Đọc `docs/plans/index.json` nếu có, mở đúng plan qua path và lấy REQ/AC/task/file đã chốt; không tự chạy lại planning. Không có plan thì dùng yêu cầu và code đã xác minh của task hiện tại; nhiều plan hoặc thiếu scope thì hỏi trước case phụ thuộc.
- `/test repo [nhánh]`: kiểm thử các tính năng của repo, mặc định nhánh hiện tại; nhánh chỉ định phải được xác minh bằng ref/SHA, không tự checkout ghi đè working tree. Bám code/contract thực tế, ghi phần chưa kiểm thử.
- `/test pr [URL|#số]`: kiểm thử hành vi đổi trong PR và regression liên quan theo base/head SHA. Thiếu target thì dùng PR của nhánh hiện tại; nhiều/không có thì hỏi. Không tự tạo PR, merge hoặc sửa code.

## Dữ liệu và kiểm chứng

- Mặc định lưu tại `testcase.json` ở **gốc repository đang kiểm thử**, theo [template](../skills/workflow-test/assets/testcase-template.json). Đọc file đã có trước, giữ ID/history; đọc `docs/testcases/index.json` cũ nếu có để tái dùng case liên quan, không tự ghi lại hai nguồn hoặc xóa dữ liệu cũ. Đường dẫn người dùng chỉ định rõ có ưu tiên.
- Suite/case mới có `title`, `createdAt`; case chưa chạy là `Not Run`. Mỗi lần thực thi ghi `executedAt`, scope/SHA, status, actual result, evidence và bug ID; giữ history. Pass/Fail chỉ khi thực thi có bằng chứng, thiếu môi trường thì Blocked/Not Run kèm lý do. Template là khung, không lưu placeholder như dữ liệu đã kiểm chứng.
- Thiết kế case bằng phân vùng tương đương/giá trị biên/bảng quyết định/chuyển trạng thái; lưu REQ/AC → case, tổng case/phân bổ/kết quả và coverage. Chạy runner đã có trong phạm vi được giao, không tự cài dependency hoặc dùng database thật để ghi dữ liệu ngoài quyền.
- `algorithmComplexity` ghi theo thuật toán/luồng được kiểm thử: input `n`/`m`, time/space Before–After, allocation, preprocessing, query/API/I/O, basis/evidence và giới hạn. Dùng skill `complexity-performance`; có database thì thêm `database`. Chỉ ghi Before khi có code/mốc thật; chưa có thì null kèm lý do. Phân tích tĩnh không phải benchmark; không suy Big O từ số testcase. Không có thuật toán/runtime liên quan thì `applies: false` và lý do `Không áp dụng — không có thuật toán/runtime phụ thuộc input`.
- Agent truy vết kết quả, báo bug/rủi ro bằng skill `report`; không tự triển khai tính năng hoặc sửa ứng dụng để test đạt.
