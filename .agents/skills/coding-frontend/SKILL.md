---
name: coding-frontend
description: Triển khai và sửa frontend website có nội dung/CMS, hỗ trợ SEO, responsive và accessibility — HTML ngữ nghĩa, render dữ liệu, metadata, điều hướng, ảnh, form và an toàn XSS. Dùng khi code giao diện theo đặc tả hoặc mẫu UI/Figma có sẵn; không thay thế thiết kế UX/UI hay lập chiến lược nội dung. Áp dụng cho Claude Code, Codex và coding agent khác. Chuyển HTML/CSS tĩnh sang component framework: references/html-to-component.md.
license: MIT
metadata:
  version: "1.0"
---

# Coding Frontend

Áp dụng invariant trong [`rules/frontend`](../../rules/frontend.md), [`rules/coding`](../../rules/coding.md#an-toàn-type) và checklist cross-stack [`coding-standards`](../coding-standards/SKILL.md).

Triển khai giao diện đúng đặc tả, hiển thị nội dung đáng tin cậy và hoạt động tốt với người dùng lẫn công cụ tìm kiếm. Theo stack thật của project, không mặc định React/Next.js hoặc cài thư viện mới.

## Nguyên tắc

- Tuân thủ rule [coding-frontend](../../rules/frontend.md) cho các phần liên quan đến nhiệm vụ.
- **Ranh giới sửa đổi bắt buộc**: chỉ thay đổi page/component/hành vi nằm trong yêu cầu hoặc task đã duyệt. Không sửa luồng đang hoạt động ngoài phạm vi để “tiện”, đồng bộ, dọn dẹp hoặc cải thiện thêm. Nếu cần ảnh hưởng component/page dùng chung hoặc hành vi ngoài phạm vi, dừng phần thay đổi đó, báo file và tác động dự kiến, xin người dùng đồng ý; tiếp tục phần độc lập đã được giao.

- Đọc hướng dẫn project, đặc tả, manifest, route, component và API/CMS contract liên quan trước khi code. Tái sử dụng component, token, metadata và cơ chế fetch/cache có sẵn.
- **Có UI/Figma thì bám mẫu**: xác định nguồn chuẩn, đọc đúng màn hình/component/asset; giữ layout, màu, typography, spacing và tương tác. Không tự tạo design system, đổi theme/UI library hoặc redesign khi chỉ được giao thêm tính năng/fix. Không đọc được mẫu thì nêu giới hạn, không đoán chi tiết.
- TypeScript tuân thủ [type-safety](../../rules/coding.md#an-toàn-type): không `any` hay assertion lách type; tái sử dụng/dẫn xuất type có sẵn, gom type cùng domain trong `types/`. Validate dữ liệu chưa tin cậy tại boundary.
- Giữ phạm vi: không sửa nghiệp vụ/backend, nâng dependency, publish hoặc deploy ngoài yêu cầu. Không bịa nội dung, API, asset hoặc kết quả kiểm chứng.

## Quy trình

1. **Khoanh phạm vi**: liệt kê page/component/hành vi được yêu cầu và giữ nguyên các hành vi khác. Nêu sớm thay đổi phụ thuộc ngoài phạm vi để xin chấp thuận trước khi sửa phần đó.
2. **Khảo sát**: xác định trang/luồng, dữ liệu đầu vào, mẫu UI và tiêu chí nghiệm thu. Kiểm tra cách render hiện có (CSR/SSR/SSG), phiên bản framework và lệnh test/lint/build thật.
3. **Triển khai**: chọn component có sẵn, nối dữ liệu và xử lý trạng thái; áp dụng các nhóm bên dưới theo loại trang. Giữ logic nghiệp vụ/data fetching theo ranh giới module hiện tại, không tạo abstraction hoặc global state khi local state đủ dùng.
4. **Kiểm chứng**: kiểm tra luồng chính, dữ liệu thiếu, lỗi API, route trực tiếp và responsive; chạy test/lint/type check/build phù hợp. Rà vòng lặp render/state/effect trên framework đang dùng và kiểm tra network/API call không tăng theo từng item (N+1). Với luồng backend đi kèm, phối hợp đếm query theo request/job trong skill backend; không giới hạn vào React/Next.js hay một framework cụ thể. Fix bug cần regression test tái hiện trước theo [quality-assurance](../../rules/delivery.md#chất-lượng-và-bằng-chứng); dùng [testing](../testing/references/unit-testing.md) khi cần viết test kỹ thuật. Rà diff để xác nhận không đổi hành vi ngoài yêu cầu; nếu có thay đổi cần thêm quyền, dừng và xin chấp thuận.
5. **Bàn giao**: tự review diff, cập nhật docs bị ảnh hưởng. Báo file/hành vi đã đổi, check và kết quả thật, phần chưa kiểm chứng; không coi preview local là bằng chứng Google đã index.

### Khi nhận handoff từ `agent-clone`

- Đọc source of truth, inventory, mapping JSON và pixel spec trước khi sửa UI; áp dụng [ràng buộc fidelity](../clone-website/SKILL.md#ràng-buộc-fidelity) của `clone-website`.
- Dùng asset có `status: downloaded`; giữ nguyên asset `failed`/`skipped` và báo phần cần xử lý thủ công. Không thay bằng placeholder nếu clone đã cam kết fidelity.
- Giữ cấu trúc section, thứ tự, CSS gốc/processed và đường dẫn media theo mapping. Nếu width, container, breakpoint hoặc interaction thực tế lệch source, ghi sai khác cụ thể và sửa trong phạm vi được giao; không tự redesign.
- Đối chiếu cùng route, viewport và trạng thái: macro layout trước, sau đó computed style/bounding box, typography, spacing, màu, asset và interaction. Chỉ gọi pixel-perfect khi có bằng chứng tương ứng.

## Yêu cầu triển khai

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

## Kiểm tra trước khi hoàn thành

- UI đúng mẫu, nội dung dài/thiếu ảnh không phá layout; kiểm tra mobile, tablet, desktop và keyboard.
- Form hợp lệ/không hợp lệ, pending, lỗi mạng, retry và luồng thành công hoạt động; không có lỗi console/hydration do thay đổi gây ra.
- Deep link, refresh, back/forward, link nội bộ và trang lỗi đúng; metadata thuộc đúng trang trong HTML response và DOM khi phù hợp.
- Dữ liệu CMS không thể chèn script qua thay đổi đã làm; dependency và type được tái sử dụng đúng quy ước.
- Nêu rõ check nào pass/fail/chưa chạy. Tách số liệu lab với field; không hứa thứ hạng SEO hay hiệu năng chưa đo.

## Skill liên quan và tài liệu

- [seo](../seo/references/website.md) khi cần audit crawl/index, sitemap, structured data hoặc vấn đề SEO rộng hơn frontend.
- [seo](../seo/references/content.md) khi được giao lập kế hoạch/viết nội dung; không tự đổi content đã duyệt chỉ để thêm từ khóa.
- Thiết kế mới/redesign giao cho [ux-ui-designer-agent](../../agents/ux-ui-designer-agent.md); không tự áp skill phong cách lên UI có sẵn.
- Tra tài liệu chính thức theo phiên bản thật khi cần: [HTML và accessibility — MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility/HTML), [responsive images — MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images), [JavaScript SEO — Google](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

## Chuyển HTML/CSS tĩnh thành component

Convert HTML/CSS tĩnh có sẵn sang component framework đích (React, Vue, Angular, Svelte...), tách theo khối lặp và theo convention project: [references/html-to-component.md](./references/html-to-component.md).
