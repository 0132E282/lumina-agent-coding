---
name: complexity-performance
description: Phân tích độ phức tạp thuật toán, vòng lặp, query/API, bộ nhớ và tài nguyên khi implement, sửa hoặc review code; dùng khi cần tính Big O, tìm bottleneck hoặc kiểm chứng hiệu năng.
license: MIT
metadata:
  version: "1.1"
---

# Complexity & Performance

Đánh giá chi phí xử lý bằng bằng chứng từ code, dữ liệu và phép đo; không kết luận hiệu năng chỉ từ Big O hoặc khi chưa benchmark/profile.

## Quy trình

1. Xác định đoạn xử lý, input và `n`/`m` đại diện cho dữ liệu nào.
2. Kiểm tra vòng lặp, traversal, lookup, sort, allocation, query database, network, I/O và retry. Nếu có database, đọc và áp dụng thêm skill [`database`](../database/SKILL.md) cùng rule [`database-read-only`](../../rules/backend.md#database-read-only-mặc-định).
3. Tính time/space complexity cho đường đi chính, worst case và khởi tạo/preprocessing nếu có.
4. Với vòng lặp lồng nhau, xác định kích thước từng tập; dùng `O(n × m)` khi chúng độc lập, không mặc định `O(n²)`.
5. Tìm N+1 query/API call, tải toàn bộ dữ liệu vào RAM, retry vô hạn và thiếu giới hạn page/batch/upload/input.
6. Với query database, đếm số query mỗi request/job trên tập dữ liệu nhiều record; kiểm tra số query có tăng theo số record không, lazy loading/N+1, join/eager loading, điều kiện `WHERE`, `JOIN`, `ORDER BY`, pagination, cột được đọc, index và lượng record quét/trả về. Áp dụng xuyên framework/ORM (Laravel/Eloquent, EF Core, SQL trực tiếp và stack khác). Dùng query log/profiler/test instrumentation và `EXPLAIN`/query plan khi có thể; nếu không có công cụ thì ghi rõ phần chưa đo.
7. Đánh giá cyclomatic complexity, độ dài hàm, số tham số và độ sâu lồng nhau như tín hiệu review.
8. Đề xuất tối ưu phù hợp: `Map`/`Set`, eager loading, batch, pagination, chunk, cursor, streaming, queue/job, cache hoặc index; nêu trade-off.
9. Kiểm chứng bằng test, benchmark, query log, `EXPLAIN` hoặc profiler; ghi rõ phần chưa đo.

## Ngưỡng cần chú ý

- Ưu tiên `O(n)` hoặc `O(n log n)` khi xử lý danh sách.
- `O(n²)` trở lên phải giải thích lý do, giới hạn input và hướng tối ưu.
- Retry phải có giới hạn số lần, timeout và điều kiện dừng.
- Cyclomatic complexity mục tiêu không quá 10; hàm trên 50 dòng logic, hơn 3–4 tham số hoặc lồng quá 3 cấp cần xem xét đơn giản hóa.
- Không tự đặt giới hạn tài nguyên nếu chưa có yêu cầu hoặc bằng chứng.

## Báo cáo

Với code/luồng xử lý phụ thuộc dữ liệu, dùng template [`change-report-template.md`](../report/assets/change-report-template.md) và ghi `**Big O: ...**` in đậm trong mục file (tiếng Anh, `<độ phức tạp> — Good | needs optimization`; N+1 ghi `N+1 — needs optimization`); phân tích nội bộ vẫn dùng Before/After, `n`/`m`, số query, dạng query, record quét/trả về, index/query plan nếu có, I/O/bộ nhớ, hành vi giữ nguyên, kiểm chứng và đánh giá coding. Khi có database, kết hợp kết quả từ skill [`database`](../database/SKILL.md), không tự chạy thao tác ghi/DDL hoặc thay đổi index.

Với rule, skill, docs, template hoặc config thuần túy, bỏ dòng Big O trong báo cáo; không suy diễn Big O từ việc agent đọc file hoặc số lượng file.

## Giới hạn

- Không khẳng định mức cải thiện nếu chưa đo.
- Không gộp các vòng lặp/query chỉ vì hình thức giống nhau khi input khác nhau.
- Chỉ đề xuất refactor liên quan bottleneck hoặc yêu cầu hiện tại.
