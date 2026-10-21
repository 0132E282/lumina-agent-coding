---
name: database
description: "Chuyển yêu cầu nghiệp vụ thành truy vấn SQL/NoSQL, review tính đúng, phân tích độ phức tạp/tải, tìm query nặng và đề xuất tối ưu có bằng chứng. Dùng khi viết query, aggregation, filter, index, phân trang hoặc điều tra hiệu năng (MySQL, PostgreSQL, MongoDB, Redis...)."
---

# Database Query Analyzer

## Quy trình chung

1. Xác định engine, phiên bản, driver/ORM, connection, môi trường — không coi NoSQL là một dialect.
2. Đọc schema/document model, quan hệ, index, partition/shard key, kiểu dữ liệu; thu thập input/output, ordering, pagination, quyền tenant cần giữ. Khi cần minh họa quan hệ, kết hợp skill [`system-understanding`](../system-understanding/references/diagrams.md) để vẽ ERD từ schema đã xác minh.
3. Xác định quy mô, phân bố dữ liệu, selectivity, tần suất gọi, concurrency, giới hạn latency/tài nguyên — thiếu số liệu thì đánh dấu thiếu, không tự đặt ngưỡng.
4. Viết truy vấn native có tham số; không bịa field/index — thiếu schema thì cung cấp bản mẫu ghi rõ giả định. Có ORM tương đương khi cần, kiểm tra query thực do ORM phát sinh.
5. Review tính đúng đắn trước hiệu năng: duplicate, null/missing, cardinality join, count, rounding, timezone, stable ordering, phân trang, filter tenant, consistency, xử lý lỗi.
6. Phân tích tĩnh đường truy cập và chi phí dự kiến — đọc [analysis.md](references/analysis.md) để phân biệt độ phức tạp, chi phí thực thi, tải toàn hệ thống.
7. Nếu được phép và có môi trường phù hợp, thu execution plan/profiler/metrics đúng engine — đọc [engines.md](references/engines.md), kiểm tra tài liệu chính thức theo phiên bản trước khi dùng tính năng chưa chắc chắn.
8. Xếp hạng query theo bằng chứng (dữ liệu xử lý, latency, tài nguyên, fan-out, tần suất) — không gọi nặng chỉ vì dài/nhiều JOIN/không dùng index.
9. Đề xuất thay đổi nhỏ nhất giữ đúng semantics (query rewrite, index, data model, batch, pagination, cache, precompute) kèm tradeoff write/storage/freshness/consistency.
10. Kiểm chứng trước/sau với dữ liệu đại diện, tham số đa dạng, cùng môi trường/cache — so sánh correctness và metrics, không bịa % cải thiện.

## Liên quan

Khi cần thiết kế data model mới ở mức khái niệm (entity/quan hệ, trước khi có schema cụ thể), đó là việc của agent [`system-design-agent`](../../agents/system-design-agent.md) mục "Dữ liệu & API". Skill này vào việc khi đã có (hoặc đang soạn) schema cụ thể theo một engine thật — xác nhận bằng chi tiết đúng engine: cú pháp DDL, chiến lược index, chi phí truy vấn.

## Đầu vào và câu hỏi

Ưu tiên dữ liệu đã có: yêu cầu, query, bindings đã ẩn dữ liệu nhạy cảm, schema/index, plan, cardinality, log tổng hợp và mục tiêu đo. Hỏi gộp thông tin thiếu ảnh hưởng trực tiếp. Tiếp tục phân tích tĩnh khi chưa có quyền kết nối; ghi rõ chưa kiểm chứng.

## Phạm vi và bảo vệ dữ liệu

- Soạn query không đồng nghĩa được phép chạy. Chỉ truy cập engine/môi trường trong phạm vi đã được cho phép.
- Không tự chạy DDL, update/delete, backfill, cache flush, đổi index/config hoặc workload benchmark trên production.
- Actual plan/analyze có thể thực thi query và tiêu tốn tài nguyên; xác minh semantics theo engine, dùng môi trường phù hợp. Không mặc định transaction rollback loại bỏ mọi side effect.
- Không dùng query text để suy ra an toàn read-only: kiểm tra stored function, procedure, script và tính năng thực thi liên quan.
- Parameterize giá trị; allowlist identifier, sort field/operator động. Với NoSQL, không nhận nguyên object/operator từ input không tin cậy để ghép trực tiếp.
- Không đọc toàn bộ dữ liệu hay log secret khi chỉ cần plan, thống kê hoặc mẫu đã ẩn danh.
- Giữ tenant/authorization filter. Với Redis keyspace và NoSQL partition, kiểm tra phạm vi key và quyền truy cập.

## Tài liệu theo tình huống

- Đọc [analysis.md](references/analysis.md) khi đánh giá độ phức tạp, query nặng, xếp hạng và kiểm chứng.
- Đọc [engines.md](references/engines.md) để chọn metrics và cách tiếp cận theo SQL/NoSQL.
- Đọc [output.md](references/output.md) khi viết báo cáo hoặc bàn giao query.

## Điều kiện hoàn thành

Trả query và bindings/schema giả định rõ ràng; mô tả đúng semantics; gắn mỗi finding với bằng chứng hoặc giả thuyết; đưa đề xuất và cách kiểm chứng. Nếu chưa chạy query hoặc chưa có plan, ghi rõ. Không hứa hỗ trợ mọi tính năng của mọi database: engine chưa biết cần tra tài liệu chính thức và giữ kết luận có điều kiện.
