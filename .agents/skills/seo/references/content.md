# SEO Content Website

Mỗi trang phải trả lời: **Viết cho ai? Giải quyết vấn đề gì? Người đọc nên làm gì tiếp theo?** Viết đủ để đáp ứng nhu cầu, không kéo dài hoặc lặp từ khóa chỉ vì SEO. Áp dụng cho Claude Code, Codex và các agent khác.

## Nguyên tắc

- Đọc hướng dẫn project, brief, nội dung hiện có và dữ liệu sản phẩm/doanh nghiệp trước. Giữ giọng thương hiệu, ngôn ngữ, URL và cấu trúc UI có sẵn; yêu cầu viết content không cho phép redesign.
- Không bịa giá, năng lực, khách hàng, chứng nhận, số liệu, đánh giá hoặc trải nghiệm. Dữ kiện thiếu phải ghi vào phần cần xác nhận, không đưa như sự thật vào bản viết. Ví dụ giả định phải được gắn nhãn rõ.
- Không suy đoán search volume hoặc cam kết thứ hạng. Nếu chưa có dữ liệu từ khóa, đưa đề xuất intent/chủ đề có nhãn giả thuyết. Tra nguồn đáng tin khi nội dung cần xác minh thông tin hiện hành.
- Chỉ làm phạm vi được giao: kế hoạch, dàn ý hoặc bản viết. Không tự đăng CMS, publish, sửa code/URL hoặc tạo chính sách cam kết thay doanh nghiệp.

## Quy trình

1. **Xác định người đọc**: lĩnh vực, sản phẩm/dịch vụ, thị trường, nhóm khách hàng, vấn đề, câu hỏi trước khi mua và hành động mong muốn. Tận dụng brief/repo để suy ra; chỉ hỏi thông tin thiếu ảnh hưởng nội dung, tiếp tục phần độc lập.
2. **Liệt kê chủ đề**: lấy từ sản phẩm, dịch vụ, FAQ, phản hồi khách hàng và dữ liệu tìm kiếm nếu có. Phân loại nhu cầu tìm hiểu, so sánh, lựa chọn hoặc mua/liên hệ.
3. **Gán chủ đề cho trang**: kiểm tra trang hiện có trước khi đề xuất trang mới. Mỗi nhu cầu có trang đích chính; tránh nhiều bài trả lời cùng intent mà không có khác biệt hữu ích. Khi trùng, đề xuất cập nhật/gộp, không tự xóa hoặc đổi URL.
4. **Lập dàn ý**: nêu người đọc, mục tiêu, thông điệp chính, câu hỏi cần trả lời, heading, bằng chứng cần có và CTA phù hợp. Không ép mọi loại trang theo cùng bố cục marketing.
5. **Viết và tối ưu**: trả lời nhu cầu chính sớm; dùng câu rõ, đoạn dễ đọc, ví dụ thực tế và thuật ngữ nhất quán. Tạo SEO title, meta description, H1 và heading hợp lý; dùng từ khóa tự nhiên, không đặt mật độ hay số từ cứng. Đề xuất link nội bộ đúng ngữ cảnh tới trang đã xác minh hoặc đánh dấu trang chưa có.
6. **Review và bàn giao**: kiểm tra tính chính xác, trùng lặp, giọng thương hiệu, CTA và nguồn. Ghi file vào nơi người dùng chỉ định; mặc định kế hoạch ở `docs/content-plan.md`, bản viết ở `docs/content/<page-slug>.md`. Ghi đề xuất xuất bản/cập nhật và thông tin cần xác nhận; phân biệt bản nháp với nội dung đã publish.

## Nhóm trang

| Trang | Nội dung cần có | Mục tiêu |
|---|---|---|
| Trang chủ | Cung cấp gì, dành cho ai, lợi ích chính, lý do lựa chọn có căn cứ và CTA | Hiểu nhanh và hành động |
| Giới thiệu | Câu chuyện, năng lực, đội ngũ và thông tin thực tế | Xây dựng niềm tin |
| Sản phẩm/dịch vụ | Đặc điểm, lợi ích, đối tượng phù hợp, giá/cách báo giá, quy trình và FAQ | Hỗ trợ quyết định |
| Blog/kiến thức | Hướng dẫn, giải đáp, so sánh và giải quyết vấn đề cụ thể | Đáp ứng nhu cầu tìm hiểu |
| Dự án/case study | Bối cảnh, vấn đề, phạm vi, giải pháp, kết quả có bằng chứng | Chứng minh năng lực |
| Liên hệ/chính sách | Kênh liên hệ và chính sách thực tế áp dụng theo loại website | Cung cấp thông tin cần thiết |

Chỉ chọn nhóm phù hợp; không tự tạo đủ mọi trang. Chính sách phải dựa trên quy định doanh nghiệp và phạm vi áp dụng được cung cấp; thiếu thì bàn giao dàn ý cùng câu hỏi cần xác nhận.

## Đầu ra

**Kế hoạch nội dung**:

| Trang/URL | Người đọc và intent | Chủ đề/từ khóa đề xuất | Thông điệp và CTA | Bằng chứng cần có | Link nội bộ | Ưu tiên |
|---|---|---|---|---|---|---|

**Bản viết từng trang**: mục tiêu/người đọc → URL hiện có hoặc slug đề xuất → SEO title → meta description → H1 → nội dung theo heading → CTA/link nội bộ → nguồn và thông tin cần xác nhận. Phần ghi chú biên tập tách khỏi nội dung hiển thị cho khách hàng.

Ví dụ website dịch vụ phần mềm: trang dịch vụ “Phát triển website Laravel cho doanh nghiệp”; bài hướng dẫn “Cần chuẩn bị gì trước khi thuê làm website?”; bài so sánh “Website theo mẫu và thiết kế riêng khác nhau thế nào?”. Case study chỉ dùng dự án và kết quả thực tế được cung cấp.

Khi cần xử lý crawl/index, sitemap, canonical, HTTP status hoặc render, dùng [seo](../../seo/references/website.md). Sau xuất bản, đề xuất theo dõi query/trang và chuyển đổi khi có dữ liệu; cập nhật khi thông tin thay đổi, không chỉ đổi ngày bài viết.
