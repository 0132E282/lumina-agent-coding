---
name: system-understanding
description: Khảo sát và giải thích hệ thống hiện có trước khi coding, review hoặc tối ưu; lập bản đồ module, request flow, data flow, dependency, boundary, database và tác động liên module mà không tự redesign hay triển khai. Vẽ sơ đồ Mermaid (cấu trúc thư mục, ERD, user/system flow): references/diagrams.md.
license: MIT
metadata:
  version: "1.0"
---

# System Understanding

Xây dựng hiểu biết có căn cứ về hệ thống hiện có trước khi đề xuất thay đổi. Skill này phục vụ khảo sát và bàn giao context; thiết kế HLD/LLD mới thuộc agent `architect`.

## Quy trình

1. Đọc `AGENTS.md`, `CLAUDE.md`, README, manifest/lockfile và menu tài liệu phù hợp (`docs/index.json`, `docs/plans/index.json`, `docs/testcases/index.json`, `docs/reviews/index.json` nếu có). Mở đúng tài liệu bàn giao (`docs/requirement-analysis.md`, `docs/system-design.md`) hoặc plan JSON trong `docs/plans/` khi điều kiện menu cho task khớp.
2. Xác định stack, entry point, module, service, job, CLI, route và dependency chính bằng file thật; không suy đoán theo tên thư mục.
3. Truy vết một luồng đại diện từ input → validation/auth → business logic → database/external service → output/side effect.
4. Ghi boundary và ownership: module nào chịu trách nhiệm, contract nào được dùng, dữ liệu chuẩn nằm ở đâu, tenant/authz và transaction boundary nào áp dụng.
5. Khi cần sơ đồ, theo [references/diagrams.md](./references/diagrams.md); khi có database, kết hợp [`database`](../database/SKILL.md); khi có bottleneck hoặc dữ liệu lớn, kết hợp [`complexity-performance`](../complexity-performance/SKILL.md).
6. Phân biệt rõ dữ kiện đã đọc, giả định, điểm chưa biết và tác động dự kiến; trích path/file/dòng khi có thể.
7. Chỉ ra thay đổi có thể ảnh hưởng module nào, test/CI/docs nào và thứ tự kiểm chứng phù hợp.

## Kết quả tối thiểu

- **Phạm vi**: phần đã khảo sát và phần chưa khảo sát.
- **Bản đồ thành phần**: module/entry point/dependency và trách nhiệm chính.
- **Luồng chính**: request/data flow và side effect.
- **Dữ liệu & contract**: schema/API/event, quyền, transaction và nguồn dữ liệu chuẩn nếu xác định được.
- **Sơ đồ**: theo [references/diagrams.md](./references/diagrams.md) để vẽ cấu trúc thư mục, ERD hoặc user/system flow theo phạm vi.
- **Rủi ro/tác động**: coupling, điểm lỗi, query/API fan-out, cache, retry, consistency hoặc vùng chưa có bằng chứng.
- **Bước tiếp theo**: coding, database review, complexity review, system design hoặc planner; không tự chuyển vai trò ngoài yêu cầu.

## Giới hạn

- Không tự code, migrate, đổi schema/index, gọi API production hoặc thay đổi dữ liệu.
- Không biến một quan sát cục bộ thành kết luận kiến trúc toàn hệ thống nếu chưa truy vết đủ.
- Không dùng dữ liệu giả để che phần chưa đọc; ghi rõ thiếu file, quyền truy cập hoặc môi trường.
- Không trùng vai trò với `architect`: nếu cần HLD/LLD, phương án kiến trúc mới hoặc tài liệu thiết kế, bàn giao cho agent đó.

## Sơ đồ

Vẽ sơ đồ có căn cứ (cấu trúc thư mục, ERD database, user/system flow bằng Mermaid), không tự đoán thành phần hay quan hệ: [references/diagrams.md](./references/diagrams.md).
