# Yêu cầu triển khai backend

Chỉ áp dụng nhóm liên quan tới phạm vi được giao; nhóm không liên quan bỏ qua, không mở rộng phạm vi.

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
