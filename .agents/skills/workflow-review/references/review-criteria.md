# Tiêu chí review code và đánh giá Big O

Dùng cùng [code-review-checklists](./code-review-checklists.md) khi review code.

| Tiêu chí | Cần kiểm tra |
|---|---|
| Cú pháp/type | Parse/compile/import/export, type/nullability và async có đúng? Có bằng chứng từ công cụ sẵn có hoặc giới hạn kiểm tra tĩnh? |
| Rule/codebase/format | Có tuân thủ rule áp dụng, convention hiện có và cấu hình formatter/linter thật? Dẫn rule vi phạm; check không auto-fix. |
| Đúng yêu cầu | Code giải quyết đúng nghiệp vụ? Có bỏ sót điều kiện hoặc thay đổi hành vi ngoài yêu cầu? |
| Đúng logic | Điều kiện, phép tính, trạng thái và thứ tự xử lý có đúng? Có xử lý null, dữ liệu rỗng, giá trị biên? |
| An toàn dữ liệu | Có nguy cơ mất dữ liệu, ghi trùng hoặc cập nhật một phần? Các thao tác liên quan có cần transaction? |
| Bảo mật | Có kiểm tra quyền trên từng tài nguyên? Validate đầu vào? Lộ thông tin nhạy cảm hoặc tin dữ liệu frontend? |
| Tương thích | Có làm hỏng API, cấu trúc response, database hoặc chức năng đang dùng? |
| Dễ đọc | Tên biến/hàm rõ nghĩa? Luồng xử lý dễ theo dõi? Có quá nhiều điều kiện lồng nhau? |
| Trách nhiệm rõ ràng | Mỗi hàm/class có mục đích rõ? Controller có chứa quá nhiều logic nghiệp vụ? |
| Ít phức tạp | Có code thừa, nhánh không thể chạy, abstraction không cần thiết hoặc logic lặp dễ sai lệch? |
| Xử lý lỗi | Khi thất bại, hệ thống phản hồi rõ và giữ dữ liệu nhất quán? Có nuốt exception hoặc báo thành công giả? |
| Hiệu năng | Có N+1 query, truy vấn trong vòng lặp, lấy dữ liệu quá lớn hoặc thiếu phân trang? |
| Kiểm thử | Có bằng chứng kiểm tra luồng chính, trường hợp lỗi, quyền truy cập và các chức năng dễ bị ảnh hưởng? |
| Phạm vi thay đổi | Diff có tập trung vào yêu cầu? Có trộn refactor lớn hoặc sửa phần không liên quan? |

Ánh xạ tới rule có sẵn trong repo khi cần dẫn chứng: Đúng logic/Xử lý lỗi → [`rules/coding`](../../../../.claude/rules/coding.md#nguyên-tắc-code); An toàn dữ liệu/Bảo mật → [`rules/backend`](../../../../.claude/rules/backend.md#an-toàn-dữ-liệu); Trách nhiệm rõ ràng → [`rules/coding`](../../../../.claude/rules/coding.md#nguyên-tắc-code); Ít phức tạp → [`rules/coding`](../../../../.claude/rules/coding.md#kiss-yagni-và-phạm-vi); Kiểm thử → [`rules/delivery`](../../../../.claude/rules/delivery.md#chất-lượng-và-bằng-chứng).

## Đánh giá độ phức tạp (Big O)

- Dùng [`complexity-performance`](../../../../.claude/skills/complexity-performance/SKILL.md) cho mọi luồng phụ thuộc dữ liệu đã review, kể cả chưa thấy bottleneck; có query dùng thêm [`database`](../../../../.claude/skills/database/SKILL.md). Config/docs hoặc tập cố định ghi N/A với lý do.
- Xác định `n`/`m`, time/space đường chính và worst case, preprocessing/allocation, lookup/sort/đệ quy; phân biệt vòng lặp liên tiếp với lồng nhau trên tập độc lập. Nêu giả định về cấu trúc dữ liệu/runtime, không suy độ phức tạp chỉ từ cú pháp.
- Đếm API/request và query/record, kiểm tra N+1 cả frontend và backend/ORM, render/state/effect loop, pagination/batch, timeout/retry và dữ liệu trong RAM. Báo số lời gọi riêng với chi phí xử lý; chi phí query phụ thuộc plan/index/rows, không suy từ số dòng code.
- Mỗi assessment ghi vị trí/luồng, input, time/space hiện tại, query/API/I/O và căn cứ. Có đề xuất thì ghi hiện tại → dự kiến cùng trade-off; chưa đo thì ghi phân tích tĩnh, không khẳng định nhanh hơn. Không dùng ngưỡng input tự đặt để bỏ qua đánh giá.
