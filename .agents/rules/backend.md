---
trigger: model_decision
description: "Áp dụng khi nhiệm vụ liên quan: ⚙️ Backend — Contract + Nội dung + Bảo mật"
---

# ⚙️ Backend — Contract, nội dung và bảo mật

- Đọc stack, schema, route và contract thật; chỉ sửa hành vi trong phạm vi yêu cầu. Xin chấp thuận trước khi đổi contract, module dùng chung hoặc luồng ngoài phạm vi.
- Trước khi thêm route/API hoàn toàn mới (tự xây hoặc tích hợp bên thứ ba), phải có URL/tài liệu tham chiếu cụ thể làm nguồn (API thật để gọi thử/crawl, spec/Postman/OpenAPI, hoặc URL do người dùng cung cấp) — không tự bịa schema/endpoint/response khi chưa có nguồn xác nhận. Chưa có thì hỏi người dùng nguồn nào dùng làm chuẩn trước khi code.
- Validate tại boundary; kiểm tra quyền/tenant ở backend; allowlist field ghi và parameterize query. Không lộ secret, PII hoặc stack trace.
- Chỉ public nội dung được phép truy cập. Giữ URL, status, cache và metadata nhất quán; draft/preview cần quyền. Không dùng robots/noindex thay authentication.
- Tránh N+1, phân trang ổn định, chọn field cần thiết, index theo truy vấn thật; tách cache theo tenant/quyền/locale và invalidate sau commit khi cần.
- Kiểm tra upload theo quyền, kích thước và loại file thực; sanitize HTML bằng thư viện phù hợp. Giới hạn timeout/retry, dùng idempotency khi cần; transaction cho nhóm thao tác phải thành công cùng nhau.
- Database mặc định read-only theo [`database-read-only`](./database-read-only.md). Kiểm chứng hành vi bị ảnh hưởng theo [`quality-assurance`](./quality-assurance.md), ghi rõ phần chưa chạy.

> Quy trình CMS/SEO/API chi tiết: [`coding-backend`](../skills/coding-backend/SKILL.md). TypeScript: [`type-safety`](./type-safety.md). Chỉ áp dụng phần liên quan task.
