---
trigger: model_decision
description: "Áp dụng khi sửa backend, API, database hoặc xử lý dữ liệu/phân quyền"
paths:
  - "**/*.{sql,prisma,php,py,rb,go,java,cs}"
  - "**/{api,routes,controllers,services,models,migrations,database,db}/**"
---

# Quy tắc backend và dữ liệu

## Backend — contract, nội dung và bảo mật

- Đọc stack/schema/route/contract thật; không đổi contract, module dùng chung hoặc luồng ngoài phạm vi khi chưa được chấp thuận.
- API/route mới phải có URL hoặc tài liệu tham chiếu xác minh được; không tự bịa schema, endpoint hay response.
- Validate tại boundary; allowlist field ghi, parameterize query; không lộ secret, PII hoặc stack trace.
- Chỉ public nội dung được phép; preview/draft cần quyền, robots/noindex không thay authentication.
- Tránh N+1; transaction, cache, upload, HTML, timeout/retry và idempotency phải bảo toàn tính toàn vẹn và boundary bảo mật.

Quy trình/checklist: [`coding-backend`](../skills/coding-backend/SKILL.md), [`database`](../skills/database/SKILL.md), [`review-web-security`](../skills/review-web-security/SKILL.md).

## An toàn dữ liệu

- Authorization/tenant luôn ở backend, càng sớm càng tốt và đúng resource/action/owner; UI chỉ là UX, không phải kiểm soát quyền.
- Nhóm thao tác ghi phải cùng thành công hoặc thất bại phải dùng transaction.
- Không đặt side effect không thể rollback bên trong transaction.

Quy trình/checklist theo engine và security boundary: [`database`](../skills/database/SKILL.md), [`coding-backend`](../skills/coding-backend/SKILL.md), [`review-web-security`](../skills/review-web-security/SKILL.md).

## Database read-only mặc định

- Mọi database thật mặc định chỉ được đọc: không tự chạy write, DDL, migration, seed, đổi index/schema/collection hoặc flush production cache.
- Được soạn migration/script ghi khi được yêu cầu, nhưng viết xong không cấp quyền chạy.
- Chỉ chạy đúng mutation khi người dùng yêu cầu rõ cả thiết kế và thực thi; không suy rộng từ yêu cầu đọc/phân tích.
- Chỉ coi test/sandbox là ngoại lệ khi người dùng xác nhận rõ.

Phạm vi lệnh và quy trình theo engine: [`database`](../skills/database/SKILL.md). Transaction/authorization: [`data-safety`](#an-toàn-dữ-liệu). Explicit authorization tương tự Git: [`git`](./git.md).
