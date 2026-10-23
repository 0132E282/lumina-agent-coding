---
name: coding-backend
description: Triển khai/sửa backend website/CMS — CRUD, xuất bản, slug/redirect, canonical, HTTP status, sitemap, API, cache, media, đa ngôn ngữ, bảo mật. Dùng khi code backend theo đặc tả và stack hiện có; không thay thiết kế kiến trúc hay audit SEO tổng thể.
license: MIT
metadata:
  version: "1.0"
---

# Coding Backend

Áp dụng invariant trong [`rules/backend`](../../rules/backend.md#backend--contract-nội-dung-và-bảo-mật), [`rules/backend`](../../rules/backend.md#an-toàn-dữ-liệu), [`rules/backend`](../../rules/backend.md#database-read-only-mặc-định) và checklist cross-stack [`coding-standards`](../coding-standards/SKILL.md).

Bảo đảm nội dung, URL và dữ liệu SEO nhất quán, website hoạt động nhanh và ổn định. Theo framework, database/ORM và kiến trúc thật của project; không mặc định Laravel, Node.js hay tự thêm service/library.

## Nguyên tắc

- Tuân thủ [backend](../../rules/backend.md#backend--contract-nội-dung-và-bảo-mật), [type-safety](../../rules/coding.md#an-toàn-type) và [database-read-only](../../rules/backend.md#database-read-only-mặc-định) khi áp dụng.

- Đọc hướng dẫn project, đặc tả, schema, route, API contract và cấu hình liên quan trước khi code. Tái sử dụng model, validation, service, serializer, job và cache hiện có; giữ tương thích contract ngoài phạm vi thay đổi.
- **Ranh giới sửa đổi bắt buộc**: chỉ thay đổi module/endpoint/hành vi nằm trong yêu cầu hoặc task đã duyệt. Không chỉnh luồng đang hoạt động ngoài phạm vi để tiện triển khai, dọn dẹp hoặc cải thiện thêm. Nếu cần tác động module/contract khác, dừng phần đó, báo file và tác động dự kiến, xin người dùng đồng ý; tiếp tục phần độc lập đã được giao.
- Tách HTTP/validation/phân quyền/nghiệp vụ theo cấu trúc project. Không tin quyền hiển thị từ frontend; kiểm tra quyền ở backend trên từng tài nguyên và tenant.

## Quy trình

1. **Khoanh phạm vi**: xác định module, endpoint, file và hành vi được yêu cầu; ghi nhận các luồng hiện có phải giữ nguyên. Xin chấp thuận trước nếu phương án cần đổi hành vi ngoài phạm vi.
2. **Khảo sát**: xác định entity, vòng đời nội dung, actor/quyền, URL công khai, metadata, contract frontend/SSR và tiêu chí nghiệm thu. Kiểm tra phiên bản stack, schema/index, timezone, job/cache/storage và lệnh kiểm tra thật.
3. **Triển khai**: xử lý nhóm liên quan trong bảng yêu cầu ở references, chọn thay đổi nhỏ nhất đáp ứng đặc tả. Thay đổi schema/API phải nêu cách giữ tương thích; đổi URL phải có mapping redirect và cập nhật nguồn metadata/sitemap/link liên quan nếu những phần này nằm trong phạm vi được duyệt.
4. **Kiểm chứng**: test hành vi, quyền truy cập, trạng thái nội dung, URL/status và cache; chạy lint/type check/build phù hợp. Với đường data access bị ảnh hưởng, đếm query cho một request/job bằng công cụ sẵn có và kiểm tra số query có tăng theo số record hay không; rà lazy loading quan hệ và truy vấn trong vòng lặp trên Laravel, EF/SQL hoặc ORM/framework khác. Nếu không có query log/profiler, kiểm tra tĩnh và ghi rõ chưa đo được query count thực tế. Fix bug viết regression test fail vì lỗi trước khi sửa theo [quality-assurance](../../rules/delivery.md#chất-lượng-và-bằng-chứng). Rà diff để xác nhận luồng ngoài yêu cầu không đổi; xin chấp thuận trước mọi thay đổi mở rộng.
5. **Bàn giao**: tự review diff và đồng bộ tài liệu bị ảnh hưởng. Báo hành vi/file đã đổi, lệnh và kết quả thật, migration/script cần chạy và giới hạn kiểm chứng; phân biệt code đã viết với thay đổi đã áp dụng vào database/deployment.

## Yêu cầu triển khai

Bảng yêu cầu theo nhóm (nội dung/CMS, dữ liệu SEO, URL/slug, canonical, HTTP status, sitemap, robots/index, API/render, query/cache, media, đa ngôn ngữ, bảo mật, vận hành): [references/implementation-requirements.md](./references/implementation-requirements.md). Mở khi triển khai và chỉ áp dụng nhóm liên quan.

## Kiểm tra trước khi hoàn thành

- Public chỉ thấy nội dung được phép; test user chưa đăng nhập, thiếu quyền và truy cập chéo tenant nếu có.
- Publish/unpublish/scheduled, đổi slug và request đồng thời giữ đúng trạng thái; redirect không loop, URL thiếu/gỡ trả đúng status.
- Metadata, canonical và sitemap nhất quán; cache không giữ nội dung cũ sau thay đổi hoặc lộ nội dung riêng tư.
- Upload/HTML và input sai được xử lý an toàn; API contract và test hiện có vẫn đúng.
- Nêu rõ check pass/fail/chưa chạy; không coi code đã viết là bằng chứng job, migration hoặc backup production đã hoạt động.

## Skill liên quan

- [database](../database/SKILL.md) khi viết/review query, index hoặc đo hiệu năng theo engine thật.
- [seo](../seo/references/website.md) khi cần audit SEO, kiểm chứng crawl/index hoặc tra hướng dẫn SEO hiện hành.
- [testing](../testing/references/unit-testing.md) khi viết test; [coding-frontend](../coding-frontend/SKILL.md) để đối chiếu contract render/metadata khi nhiệm vụ có cả frontend.
- Thiết kế kiến trúc mới do [architect](../../agents/architect.md) xử lý; không tự mở rộng nhiệm vụ code thành thiết kế lại hệ thống.
