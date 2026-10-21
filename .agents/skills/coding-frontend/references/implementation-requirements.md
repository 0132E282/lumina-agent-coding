# Yêu cầu triển khai frontend

Chỉ áp dụng nhóm liên quan tới loại trang/phạm vi được giao; nhóm không liên quan bỏ qua, không mở rộng phạm vi.

| Nhóm | Cách áp dụng |
|---|---|
| HTML ngữ nghĩa | Dùng `header`, `nav`, `main`, `article`, `footer` đúng vai trò. Heading theo cấu trúc nội dung, không chọn cấp heading chỉ vì cỡ chữ. Điều hướng bằng `<a href>`/router link xuất ra anchor; thao tác bằng `<button>` với `type` phù hợp. |
| CSS/responsive | Theo token và breakpoint project; layout thích ứng nội dung trên mobile/tablet/desktop, chữ đọc được, không tràn toàn trang. Bảng/nội dung rộng có vùng cuộn hợp lý; không giấu lỗi layout bằng `overflow: hidden` toàn trang. |
| JavaScript/form | Xử lý loading, empty, success, error/retry, validation và pending submit. Tránh submit lặp; giữ dữ liệu form khi lỗi. JavaScript trang trí hoặc widget lỗi không được làm mất nội dung chính; xử lý race/stale response phù hợp. |
| Nội dung/CMS | Render bài viết, ảnh, bảng, danh sách và rich text theo cấu trúc dữ liệu thật; có fallback cho ảnh/dữ liệu thiếu. Không dùng dữ liệu giả để che API lỗi. Format ngày/giá/ngôn ngữ theo yêu cầu project. |
| Metadata/SEO | Title, description, canonical và robots theo từng route/dữ liệu; dùng API metadata/head của framework, tránh thẻ trùng hoặc metadata trang cũ khi navigation. Canonical tuyệt đối và nhất quán giữa HTML ban đầu/render; không canonical mọi trang về homepage. Không index admin/nội dung riêng tư. |
| CSR/SSR/SSG | Xác định nội dung có trong HTML ban đầu và nội dung cần JS. Với trang công khai cần SEO, ưu tiên server/static render khi phù hợp stack và yêu cầu cập nhật; không tự rewrite toàn bộ CSR. Tránh hydration mismatch, fetch waterfall và gọi browser API trong server code. |
| Ảnh/hiệu năng | Dùng kích thước/định dạng phù hợp và `srcset`/`sizes` hoặc image component có sẵn. Khai báo width/height hoặc aspect ratio để giữ chỗ. Lazy-load ảnh ngoài viewport, không lazy-load ảnh hero/LCP; chỉ ưu tiên tải asset thực sự quan trọng. Hạn chế script nặng, chia tải theo nhu cầu và đo trước khi kết luận nhanh hơn. |
| Accessibility | Native control trước ARIA; label gắn input, tên dễ hiểu cho nút icon, alt mô tả theo chức năng (ảnh trang trí alt rỗng). Keyboard/focus rõ, không chỉ dùng màu báo lỗi; dialog quản lý focus và trả focus khi đóng. Giữ contrast, reduced motion và thông báo trạng thái phù hợp. |
| Điều hướng | Menu, breadcrumb, phân trang và link nội bộ dùng URL thật; trang truy cập trực tiếp/refresh được. Infinite scroll có URL phân trang crawl được khi cần SEO. Trang không tồn tại hiển thị đúng và trả 404 khi server/router hỗ trợ; không giả trang lỗi 200. |
| Chia sẻ | Open Graph `og:title`, `og:description`, `og:image`, `og:url` và type phù hợp theo trang; URL/ảnh tuyệt đối, công khai truy cập được. Ưu tiên metadata trong HTML response cho crawler chia sẻ; fallback từ dữ liệu thật. |
| An toàn render | Text dùng escaping của framework; HTML CMS cần sanitizer được duy trì với allowlist, không tự lọc bằng regex hoặc đưa raw HTML vào DOM. Kiểm soát URL scheme nguy hiểm, serialize JSON-LD an toàn; không lộ secret trong bundle hoặc HTML. CSP là lớp bổ sung, không thay sanitization. |
