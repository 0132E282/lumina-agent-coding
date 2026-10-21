---
name: coding-backend
description: Triển khai và sửa backend website/CMS cung cấp nội dung, URL và dữ liệu SEO chính xác — CRUD, xuất bản, slug/redirect, canonical, HTTP status, sitemap, API, cache, media, đa ngôn ngữ và bảo mật. Dùng khi code backend theo đặc tả và stack hiện có; không thay thế thiết kế kiến trúc, viết content hay audit SEO tổng thể. Áp dụng cho Claude Code, Codex và coding agent khác.
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
3. **Triển khai**: xử lý nhóm liên quan bên dưới, chọn thay đổi nhỏ nhất đáp ứng đặc tả. Thay đổi schema/API phải nêu cách giữ tương thích; đổi URL phải có mapping redirect và cập nhật nguồn metadata/sitemap/link liên quan nếu những phần này nằm trong phạm vi được duyệt.
4. **Kiểm chứng**: test hành vi, quyền truy cập, trạng thái nội dung, URL/status và cache; chạy lint/type check/build phù hợp. Với đường data access bị ảnh hưởng, đếm query cho một request/job bằng công cụ sẵn có và kiểm tra số query có tăng theo số record hay không; rà lazy loading quan hệ và truy vấn trong vòng lặp trên Laravel, EF/SQL hoặc ORM/framework khác. Nếu không có query log/profiler, kiểm tra tĩnh và ghi rõ chưa đo được query count thực tế. Fix bug viết regression test fail vì lỗi trước khi sửa theo [quality-assurance](../../rules/delivery.md#chất-lượng-và-bằng-chứng). Rà diff để xác nhận luồng ngoài yêu cầu không đổi; xin chấp thuận trước mọi thay đổi mở rộng.
5. **Bàn giao**: tự review diff và đồng bộ tài liệu bị ảnh hưởng. Báo hành vi/file đã đổi, lệnh và kết quả thật, migration/script cần chạy và giới hạn kiểm chứng; phân biệt code đã viết với thay đổi đã áp dụng vào database/deployment.

## Yêu cầu triển khai

| Nhóm | Cách áp dụng |
|---|---|
| Nội dung/CMS | CRUD theo entity thật; draft, published, scheduled và unpublish khi có yêu cầu. API công khai không lộ bản nháp/nội dung tương lai; preview phải có quyền và không bị cache công khai. Lịch đăng dùng timezone xác định, job có thể chạy lại mà không xuất bản trùng. |
| Dữ liệu SEO | Dùng field có sẵn hoặc bổ sung theo đặc tả: `seo_title`, `meta_description`, slug, ảnh chia sẻ, indexability. Fallback từ nội dung thật, không ghi đè giá trị người biên tập đã nhập; response frontend/SSR và sitemap dùng cùng quy tắc. |
| URL/slug | Quy tắc chuẩn hóa nhất quán; uniqueness đúng phạm vi (domain/tenant/ngôn ngữ theo mô hình thật), có constraint database để xử lý tạo đồng thời. Lưu lịch sử slug theo nhu cầu; redirect về URL hiện hành, tránh loop/chain và xung đột slug cũ. |
| Canonical | Xác định URL chính cho biến thể đường dẫn/tham số tương đương. URL tuyệt đối theo cấu hình host/protocol tin cậy; không lấy tùy ý từ header đầu vào, không canonical mọi nội dung về homepage. |
| HTTP status | Trang tồn tại trả 200; đổi URL vĩnh viễn 301/308, tạm thời 302/307. Không tìm thấy 404, đã gỡ vĩnh viễn 410 khi đúng chính sách, lỗi server 5xx phù hợp. API CRUD dùng status theo contract (ví dụ 201/204); không bọc mọi lỗi trong 200 hoặc redirect trang lỗi về homepage. |
| Sitemap | Lấy URL canonical, công khai, đã xuất bản và muốn index; loại draft, noindex, redirect, lỗi và trang riêng tư. `lastmod` phản ánh thay đổi có ý nghĩa, không lấy thời gian request. Batch/chia sitemap và cache theo quy mô; kiểm tra giới hạn hiện hành khi triển khai. |
| Robots/index | Cung cấp robots.txt và dữ liệu robots/header theo route; robots.txt kiểm soát crawl, không thay thế noindex hoặc xác thực. Crawler cần truy cập để đọc noindex; trang riêng tư phải có authentication/authorization. |
| API/render | Trả đủ nội dung và metadata cho frontend/SSR; URL trang công khai truy cập trực tiếp được. Validation, pagination và error contract nhất quán; không trả field nội bộ/secret trong serializer. |
| Query/cache | Tránh N+1, chọn field cần thiết, phân trang có thứ tự ổn định, index theo truy vấn thật. Cache key tách tenant/ngôn ngữ/quyền khi cần; không cache riêng tư như công khai. Invalidate sau commit khi publish/update/delete/đổi slug, gồm trang, metadata, sitemap và redirect liên quan. Đo trước/sau, không tuyên bố tối ưu chỉ từ code. |
| Media | Kiểm tra quyền, kích thước và loại file thực tế, không chỉ extension/client MIME. Tên/key storage an toàn, không cho upload thực thi; quản lý alt và biến thể ảnh theo nhu cầu. Xử lý SVG/HTML theo chính sách an toàn, giới hạn tài nguyên xử lý ảnh; không tự xóa asset đang được tham chiếu. |
| Đa ngôn ngữ | Chỉ triển khai khi có bản dịch thật; quản lý URL, slug và quan hệ bản dịch, fallback rõ ràng. Hreflang trỏ đúng phiên bản công khai tương ứng và liên kết đối ứng; không gán mọi locale về một trang mặc định. |
| Bảo mật | Validate boundary, allowlist field để tránh mass assignment, parameterize query và kiểm soát operator/sort động. HTML CMS sanitize bằng thư viện được duy trì, escape khi render; không tự lọc XSS bằng regex. CSRF theo cơ chế auth, rate limit phù hợp; không ghi secret/PII vào log. |
| Vận hành | Log lỗi có ngữ cảnh/request ID, không lộ stack trace ra public. Timeout/retry có giới hạn, idempotency khi thao tác có thể lặp; không retry mọi lỗi. Tận dụng backup/monitoring hiện có, đề xuất kiểm tra restore khi thuộc phạm vi; không báo backup an toàn nếu chưa kiểm chứng. |

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
- Thiết kế kiến trúc mới do [system-design-agent](../../agents/system-design-agent.md) xử lý; không tự mở rộng nhiệm vụ code thành thiết kế lại hệ thống.
