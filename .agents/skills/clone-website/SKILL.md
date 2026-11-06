---
name: clone-website
description: Clone an existing website or supplied website reference with structural and visual fidelity. Use when the user provides an image, live website URL, sitemap URL, recording, HTML, or design reference and asks to reproduce the site; do not use for redesigning, restyling, or inventing a new UI.
license: MIT
metadata:
  version: "1.3"
---

# Clone Website

## Checkpoint bắt buộc trước khi code

Sau khi đã nhận diện source và phạm vi route/page, phải hỏi người dùng một lần:

> Bạn có muốn cập nhật thiết kế để bản clone giống source 100% không? Nếu có, mình sẽ giữ nguyên section, thứ tự, kích thước, width/max-width, spacing, typography, asset, responsive và interaction theo source. Nếu không, hãy chỉ rõ phần nào được phép khác.

Không tự mặc định câu trả lời, không code khi checkpoint chưa có câu trả lời rõ ràng. Chọn 100% → mọi sai khác quan sát được trong phạm vi đã chọn là lỗi cần sửa; chỉ ghi đạt pixel-perfect sau khi đối chiếu thực tế cùng viewport/trạng thái.

Nguồn tham chiếu (ảnh, website, sitemap, recording, HTML, design file) là source of truth tuyệt đối cho cấu trúc, nội dung, typography, màu, spacing, asset, responsive và tương tác quan sát được. Tải asset chỉ hỗ trợ; nghiệm thu là clone khớp source.

## Ràng buộc fidelity

- Giữ nguyên hierarchy: route, thứ tự section, vùng header/navigation/main/footer, nhóm component, vị trí và quan hệ giữa các phần.
- Không tự ý thêm, xóa, đổi thứ tự, bố cục, copy, component/interaction, redesign, "cải thiện", tối giản, hiện đại hóa, thêm section/CTA, đổi theme/design system/component library hoặc phong cách ngoài phạm vi người dùng đã chọn — dù nhìn "hợp lý" hơn. Source khác code hiện tại ở phần ngoài phạm vi → báo chênh lệch, xin xác nhận, không tự mở rộng/thay thế.
- Giữ nguyên giá trị UI quan sát được: kích thước tương đối, màu, border, radius, shadow, spacing, icon, ảnh, trạng thái, chuyển động.
- Không dùng placeholder, ảnh giả, text giả hoặc component generic che phần chưa hiểu; thiếu asset/hành vi thì ghi rõ giới hạn, giữ cấu trúc tối thiểu.
- Bảo toàn URL, route, link, query, form action và contract dữ liệu thuộc phạm vi clone; không đổi backend/API chỉ để thuận tiện frontend.
- Responsive suy từ viewport/breakpoint có bằng chứng; không tự thêm breakpoint làm đổi UI ngoài nguồn.
- Không tự áp dụng skill thiết kế khác (như `ui-styles`) — chúng có thể làm lệch nguồn clone.
- Mọi asset tải về có mapping `originUrl` → `localPath`, trạng thái, loại và lỗi nếu có; không thay URL chưa tải bằng placeholder hoặc URL không xác minh.
- Giữ CSS gốc ở file riêng khi có thể, thay URL bằng mapping đã xác minh, giữ thứ tự stylesheet và selector. Không dùng regex phức tạp sửa CSS nếu có thể làm hỏng chuỗi, data URI hoặc `@import`.
- Video, iframe, stream manifest và asset lớn có trạng thái riêng. Không tự tải/ghép stream `.m3u8`, không bỏ qua `poster`, `source`, `track` hoặc `srcset`; ghi rõ phần cần xử lý thủ công.
- Inject CSS/media phải idempotent (chạy lại không nhân đôi `<link>`, `<style>` hoặc nguồn media), không ghi đè layout nguồn; dùng file output riêng.
- Pixel spec chỉ chứa giá trị đo/quan sát được; giá trị chưa đo ghi `TBD`/`Unverified`, không bịa.
- Tuân thủ giới hạn cùng-origin, kích thước file, timeout và quyền truy cập; host ngoài, authentication, CAPTCHA, paywall hoặc stream cần quyền riêng → dừng và báo blocker.

## Quy trình

**Chuyển nguồn thành tài liệu design trước khi code**: mọi nguồn (URL, ảnh, sitemap, recording, HTML, link hoạt ảnh) phải được phân tích và ghi vào `design/` rồi mới giao `coder`: `DESIGN.md` ở gốc repo (đúng spec `npm run design:spec`: token màu/typography/layout/component, lint bằng `npm run design:lint`), `index.md` (mọi trang), một file cho mỗi trang, `animations.md` (trigger, thuộc tính đổi, thời lượng, easing, reduced-motion) và ảnh chứng trong `images/`; cập nhật `docs/index.json`. Phần không đọc được ghi rõ chưa xác minh, không đoán. `coder` bám tài liệu này, không tự thiết kế.

Trước khi code từ URL, kiểm tra khả năng truy cập, status/redirect, HTML/DOM, computed style, font, asset, viewport/responsive và interaction; ghi rõ phần hoạt động, bị chặn hoặc chưa kiểm chứng.

1. **Xác định nguồn chuẩn**: phân loại ảnh/screenshot, URL website, sitemap, recording, HTML, Figma hoặc nhiều nguồn; ghi rõ nguồn nào ưu tiên khi mâu thuẫn. Sitemap chỉ dùng để inventory và phải chốt URL route hoặc nhóm route cần clone trước khi code, không tự clone toàn bộ. Không đọc được nguồn → dừng phần suy đoán và báo blocker cụ thể.
2. **Lập inventory trước khi sửa**: route/URL, cây section/component, header/footer, nội dung, asset, font, màu/token, kích thước/spacing, breakpoint, trạng thái, tương tác. Tách phần đã quan sát khỏi giả định.
3. **Khảo sát codebase**: đọc hướng dẫn project, stack, route, component, asset và contract liên quan; tái sử dụng cơ chế render, token, component hiện có khi khớp nguồn. Chỉ đổi file/page trong phạm vi clone.
4. **Đối chiếu code/design hiện tại**: clone hiện tại khác source website hoặc design file → dừng và hỏi người dùng chọn source of truth, không tự quyết.
5. **Chốt và đồng bộ tài liệu**: theo source đã chọn (website → khớp 100% website; design file → theo design đã chốt), cập nhật design/plan/docs đúng format hiện có của repo, gồm plan/index khi bị ảnh hưởng; không ghi kế hoạch mâu thuẫn với source đã chọn.
6. **Giao coder triển khai**: sau khi source of truth, inventory, phạm vi và plan/docs đã chốt, bàn giao cho `coder` viết code — không tự viết code ở bước điều phối. Ở Claude Code, agent điều phối (phiên đã chạy bước 1–5) gọi `coder` qua Agent tool; agent clone không có `Edit` và không gọi được agent khác.
7. **Đối chiếu fidelity**: coder kiểm tra cùng viewport và trạng thái với source; so macro-layout trước rồi typography, spacing, asset, màu, interaction. Kiểm tra cả bounding box và computed style của container, section, slider track/thumb và phần tử liên quan, tối thiểu `width`, `max-width`, `min-width`, `height`, `padding`, `margin`, `gap`, `overflow`, `flex-basis`/grid track. Không kết luận đúng chỉ vì CSS source khai báo tương tự: source dùng `max-width` mà clone hiển thị full width (hoặc ngược lại) phải sửa hoặc báo sai khác cụ thể. Sai khác không xác minh được thì ghi lại và dừng phần suy đoán.
8. **Chụp ảnh chứng**: chỉ chụp ở **trạng thái kết quả cuối** (không WIP), một cặp ảnh cùng viewport/trạng thái: `source` (website/ảnh/design gốc) và `result` (trang clone thật trên trình duyệt). Lưu vào `.agents/storage/evidence/<task-slug>/<viewport>-<trạng-thái>-{source|result}.png` (không commit). Không tuyên bố đã đối chiếu fidelity nếu thiếu một trong hai ảnh thật; môi trường không chụp được thì ghi rõ lý do.
9. **Bàn giao**: rà diff để xác nhận không có UI thêm/bớt hoặc đổi ngoài source of truth đã chọn; nêu nguồn, plan/docs đã đồng bộ, phần khớp, phần chưa xác minh và check đã chạy. Report theo [template Change](../report/assets/change-report-template.md) phải có dòng `URL:` (route đã kiểm tra) và `Ảnh chứng:` (đường dẫn ở bước 8).

## Pipeline tài nguyên, CSS và media

Clone từ URL cần tài nguyên local: mở [references/pipeline.md](./references/pipeline.md) (Bước 0 inventory, 1 extract/download asset, 2 process CSS, 3 inject layout/media, 4 verify, cấu trúc storage mặc định). Script ở `scripts/`, pixel spec mẫu ở `assets/pixel-perfect-spec.md`; nghiệm thu cuối vẫn là đối chiếu UI thực tế.

## Nguồn là screenshot hoặc ảnh

Không có HTML/CSS để crawl: đọc [references/screenshot-source.md](./references/screenshot-source.md) trước khi dựng UI.

## Tiêu chí nghiệm thu

- Cây trang, thứ tự section, route và hành vi trong phạm vi khớp nguồn; UI không bị tự ý đổi màu, font, spacing, component, copy, asset, breakpoint hoặc interaction.
- Không có placeholder/giả định chưa đánh dấu trong phần đã cam kết clone.
- Viewport, responsive state và interaction có bằng chứng; ghi rõ trạng thái chưa kiểm tra.
- Diff không chứa thay đổi ngoài page/component/asset/config cần cho clone.

## Skill liên quan

- `coding-frontend`: triển khai frontend theo stack và rule thật của project.
- `workflow-test` hoặc `testcase`: khi người dùng yêu cầu thiết kế/chạy test; không biến việc clone thành redesign.