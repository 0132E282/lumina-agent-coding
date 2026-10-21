# SEO Website

Kết hợp **nội dung, kỹ thuật, trải nghiệm người dùng và uy tín**. Dựa trên stack, dữ liệu và mục tiêu thật của website; không hứa thứ hạng hoặc thời gian được index.

## Nguyên tắc

- Đọc `CLAUDE.md`/`AGENTS.md`, đặc tả, route, template và cấu hình thật trước khi đề xuất. Phân biệt trang công khai cần index với admin, tài khoản, tìm kiếm nội bộ và nội dung riêng tư.
- Nếu chỉ yêu cầu audit, chỉ báo cáo/đề xuất; nếu yêu cầu triển khai, sửa đúng phạm vi được giao. Không tự publish, deploy, gửi sitemap hoặc sửa tài khoản Search Console/analytics khi chưa được giao.
- UI có sẵn phải theo mẫu và design system hiện tại nếu không có yêu cầu redesign. SEO không tự cho phép đổi theme, layout hoặc UI library.
- Không bịa search volume, backlink, traffic, lỗi index hoặc kết quả đo. Ghi nguồn, thời điểm và giới hạn dữ liệu; thiếu quyền truy cập thì nêu rõ.

## Quy trình

1. **Khảo sát**: xác định mục tiêu kinh doanh, đối tượng, ngôn ngữ/thị trường, URL và loại trang ưu tiên; xác định stack/CMS, cách render, dữ liệu SEO hiện có. Chọn trang đại diện theo template và trạng thái (hợp lệ, redirect, không tồn tại, riêng tư).
2. **Audit**: đối chiếu từng nhóm bên dưới bằng code, HTTP response, HTML ban đầu và DOM sau render khi có công cụ. Với site chỉ có source/local preview, ghi rõ chưa xác minh production hoặc trạng thái index trên Google.
3. **Ưu tiên**: ghi vấn đề, URL/file, bằng chứng, tác động, cách sửa và cách kiểm chứng. Ưu tiên chặn crawl/index, trả nội dung/status sai và mất URL quan trọng trước cải tiến nhỏ.
4. **Triển khai nếu được giao**: tái sử dụng metadata/component/schema của project. Thay đổi URL phải có mapping redirect và cập nhật link nội bộ/canonical/sitemap. Thay đổi dữ liệu/schema theo quyền hạn và quy trình của project.
5. **Kiểm chứng và bàn giao**: kiểm tra trường hợp đại diện, test/lint/type check phù hợp và tài liệu bị ảnh hưởng. Ghi báo cáo tại đường dẫn được chỉ định, mặc định `docs/seo-audit.md`; phân biệt đã sửa, đề xuất và chưa kiểm chứng.

## Các nhóm cần kiểm tra

| Nhóm | Hướng xử lý |
|---|---|
| Từ khóa | Mapping nhu cầu tìm kiếm → intent → trang đích; dùng dữ liệu Search Console/công cụ được cấp hoặc nghiên cứu có nguồn. Nếu chỉ suy luận từ brief, ghi là giả thuyết, không gán search volume. |
| Nội dung | Đáp ứng tác vụ người đọc, thông tin chính xác và có giá trị riêng; tiêu đề rõ, tác giả/nguồn/ngày cập nhật khi phù hợp. Không nhồi từ khóa, tạo hàng loạt trang rỗng hoặc đổi ngày mà không cập nhật nội dung. |
| On-page | Title và description phù hợp từng trang; heading có thứ bậc, URL dễ hiểu, alt theo chức năng ảnh (ảnh trang trí dùng alt rỗng), liên kết nội bộ crawl được bằng `<a href>`. Không dùng meta keywords hoặc mật độ từ khóa làm tiêu chí SEO. |
| Crawl/index | Kiểm tra robots.txt, meta robots/X-Robots-Tag, canonical, status và quyền truy cập. `robots.txt` kiểm soát crawl, không bảo đảm loại khỏi index; `noindex` cần crawler truy cập được để đọc. Nội dung riêng tư cần xác thực/phân quyền, không dùng robots làm bảo mật. |
| URL/HTTP | URL ổn định, canonical tuyệt đối tới trang ưu tiên tương đương; không canonical mọi trang về homepage. Redirect vĩnh viễn dùng 301/308, tạm thời 302/307; tránh loop/chain. Trang không tồn tại trả 404/410 phù hợp, không trả 200 cho màn hình lỗi hoặc chuyển mọi URL lỗi về homepage. |
| Sitemap | Sinh từ URL công khai, canonical, indexable; không đưa trang redirect, lỗi, riêng tư hoặc noindex. URL tuyệt đối, `lastmod` chỉ phản ánh cập nhật có ý nghĩa; chia sitemap/index khi vượt giới hạn chuẩn. Sitemap hỗ trợ discovery, không bảo đảm index. |
| Render | Xác minh nội dung chính, metadata và link có thể được crawler truy cập/render. Ưu tiên SSR/SSG phù hợp stack cho trang công khai; không bắt buộc rewrite toàn bộ CSR. Kiểm tra hydration, tài nguyên JS/CSS bị chặn và dữ liệu chỉ xuất hiện sau thao tác. Không trả nội dung khác nhằm đánh lừa crawler. |
| Structured data | Chọn loại theo nội dung thực tế và tính năng Google hiện hỗ trợ; JSON-LD khớp nội dung người dùng thấy. Không bịa rating/review/giá/tình trạng hàng; validate bằng Rich Results Test khi có công cụ. Hợp lệ không bảo đảm rich result. |
| AI search | Crawler AI trong robots.txt (tách training với search), kiểm soát trích dẫn trên AI Overviews/AI Mode, `llms.txt` tuỳ chọn: theo [ai-search.md](./ai-search.md). Quyết định chặn/mở bot AI là của chủ site. |
| Hiệu năng/UX | Kiểm tra mobile, đọc/thao tác, kích thước ảnh, layout shift và JavaScript. Đo LCP/INP/CLS khi có dữ liệu; tách số liệu field với lab/Lighthouse. Không tuyên bố website đạt Core Web Vitals chỉ từ một lần test lab. |
| Uy tín | Thông tin doanh nghiệp, liên hệ và tác giả rõ ràng; nguồn tham khảo phù hợp. Đề xuất nội dung có thể nhận liên kết tự nhiên; không mua/spam backlink hoặc tự liên hệ bên ngoài. |
| Đo lường | Search Console cho query/page, click, impression, CTR, index và sitemap; analytics cho hành vi/chuyển đổi theo mục tiêu. Ghi baseline, kỳ so sánh và thay đổi triển khai; không suy ra hiệu quả SEO từ điểm audit đơn lẻ. |

## Chú trọng backend

- Dùng nguồn dữ liệu nhất quán cho slug/URL, title, description, canonical, indexability và dữ liệu structured data; fallback hợp lý theo template, không tạo schema/database mới khi cấu trúc hiện có đã đủ.
- Sitemap chỉ lấy nội dung được publish; phân trang/batch theo quy mô, cache và invalidation phù hợp. Nội dung gỡ/xóa/unpublish phải được phản ánh trong sitemap, HTTP response và cache.
- Escape metadata đúng ngữ cảnh HTML; serialize JSON-LD an toàn để dữ liệu nhập không chèn script. Không đưa thông tin nội bộ hoặc secret vào HTML/schema.
- Kiểm tra hostname/protocol canonical theo cấu hình deployment tin cậy, không lấy tùy ý từ request header chưa được kiểm soát. Với đa ngôn ngữ, dùng URL và hreflang tương ứng, không tự thêm nếu website không có phiên bản ngôn ngữ thật.

## Mẫu báo cáo

| Ưu tiên | URL/file | Vấn đề và bằng chứng | Cách sửa | Cách kiểm chứng | Trạng thái |
|---|---|---|---|---|---|

Kèm mục tiêu/phạm vi, mapping từ khóa-trang nếu liên quan, dữ liệu đo trước/sau nếu có và phần cần tiếp tục theo dõi. Không coi kiểm tra local là bằng chứng Google đã index.

## Nguồn chính thức

Tra phiên bản hiện hành khi cần xác nhận giới hạn, tính năng hoặc hành vi cụ thể; ưu tiên tài liệu chính thức của stack và:

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [SEO cho developer](https://developers.google.com/search/docs/fundamentals/get-started-developers)
- [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)
