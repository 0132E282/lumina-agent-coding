# Checklist debug

## Tiêu chí

| Tiêu chí | Cần trả lời |
|---|---|
| Reproduce | Tái hiện được không? Các bước/điều kiện gây lỗi? |
| Expected vs Actual | Kết quả mong muốn (theo đặc tả) và thực tế khác nhau ở đâu? |
| Scope | Lỗi ở frontend, backend, database, network hay môi trường? |
| Root Cause | Đã tìm nguyên nhân gốc hay chỉ xử lý triệu chứng? |
| Origin | Nguồn gốc: code, dữ liệu, cấu hình/môi trường, input/thao tác người dùng ngoài đặc tả hay dependency? Input sai mà không được validate/báo lỗi rõ vẫn là lỗi code. |
| Evidence | Có log, stack trace, request, SQL query hoặc dữ liệu chứng minh? |
| Impact | Ảnh hưởng chức năng nào, bao nhiêu người dùng, có mất/sai dữ liệu? |
| Regression | Bản sửa có làm hỏng chức năng khác? |
| Performance | Có gây chậm API, tăng CPU/RAM, N+1 hoặc rò rỉ bộ nhớ? |
| Security | Liên quan phân quyền, lộ dữ liệu, SQL injection, XSS, xác thực? |
| Verification | Đã test lại case lỗi, case bình thường và case biên? |

## Mức độ

| Mức | Khi nào | Ưu tiên |
|---|---|---|
| S1 | Mất/sai dữ liệu, lỗ hổng bảo mật, hệ thống/luồng chính ngừng hoạt động | Xử lý ngay, báo người dùng |
| S2 | Chức năng chính sai hoặc chặn nhiều người dùng, có workaround khó | Ưu tiên trong task hiện tại |
| S3 | Chức năng phụ sai, có workaround rõ | Lên kế hoạch sửa |
| S4 | Hiển thị/văn bản nhỏ, không ảnh hưởng nghiệp vụ | Gom sửa sau |

Không chắc giữa hai mức thì chọn mức cao hơn và ghi lý do.

## Kiểm tra theo loại lỗi

| Loại lỗi | Kiểm tra |
|---|---|
| API trả sai dữ liệu | Request params, validation, business logic, response mapping |
| API chậm | Thời gian từng tầng, SQL query, N+1, cache, external API — dùng [`complexity-performance`](../../complexity-performance/SKILL.md), [`database`](../../database/SKILL.md) |
| HTTP 500 | Exception, stack trace, cấu hình, dependency |
| HTTP 401/403 | Token, authentication, middleware, RBAC/policy — dùng [`review-web-security`](../../review-web-security/SKILL.md) |
| Database | SQL, transaction, index, lock, dữ liệu thực tế (chỉ đọc) |
| Queue/Job | Retry, timeout, failed jobs, idempotency |
| Frontend | Console, Network, state, props, dữ liệu API, render/effect loop |
| Production quá tải | CPU, RAM, request rate, concurrency, worker, slow query |
| Lúc có lúc không | Race/concurrency, thời gian/timezone, thứ tự test, tài nguyên chung (thư mục, port, cache, DB), retry/timeout; chạy lặp và ghi tần suất |
| Bảo mật | Theo [`review-web-security`](../../review-web-security/SKILL.md); không ghi payload khai thác/dữ liệu nhạy cảm vào báo cáo |
| Chỉ lỗi trên production | Khác biệt cấu hình, phiên bản, quyền truy cập, dữ liệu, môi trường |

## Chất lượng một lần debug

- [ ] Tái hiện được lỗi hoặc xác định rõ điều kiện xảy ra
- [ ] Có bằng chứng cụ thể (log, stack trace, request, query, ảnh) đã che secret/PII, lưu hoặc dẫn đường dẫn trong `.agents/storage/evidence/<task-slug>/`
- [ ] Xác định nguồn gốc (code/dữ liệu/môi trường/người dùng/dependency) và nguyên nhân gốc
- [ ] Gán mức độ S1–S4 và đánh giá rủi ro bảo mật
- [ ] Sửa đúng nguyên nhân, không workaround tùy tiện
- [ ] Có test tái hiện lỗi: fail trước sửa, pass sau sửa, fail lại khi bỏ riêng bản sửa
- [ ] Đã chạy regression test phù hợp
- [ ] Bug UI: có ảnh trước/sau cùng route/viewport trong `.agents/storage/evidence/<task-slug>/` và đính vào báo cáo
- [ ] Đã xác minh trên môi trường mục tiêu (hoặc ghi rõ chưa xác minh được)
- [ ] Lỗi hiệu năng: có số đo trước/sau (p50/p95, số query/request, CPU/RAM khi đo được)
- [ ] Lỗi production: có log/phương án theo dõi và ghi chú postmortem ngắn

Mục chưa đạt phải ghi trong báo cáo là giới hạn còn lại; không đánh dấu đạt khi chưa có bằng chứng.
