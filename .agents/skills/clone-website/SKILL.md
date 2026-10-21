---
name: clone-website
description: Clone an existing website or supplied website reference with structural and visual fidelity. Use when the user provides an image, live website URL, sitemap URL, recording, HTML, or design reference and asks to reproduce the site; do not use for redesigning, restyling, or inventing a new UI.
license: MIT
metadata:
  version: "1.2"
---

# Clone Website

## Checkpoint bắt buộc trước khi code

Sau khi đã nhận diện source và phạm vi route/page, phải hỏi người dùng một lần:

> Bạn có muốn cập nhật thiết kế để bản clone giống source 100% không? Nếu có, mình sẽ giữ nguyên section, thứ tự, kích thước, width/max-width, spacing, typography, asset, responsive và interaction theo source. Nếu không, hãy chỉ rõ phần nào được phép khác.

Không tự mặc định câu trả lời, không code khi checkpoint chưa có câu trả lời rõ ràng. Chọn 100% → mọi sai khác quan sát được trong phạm vi đã chọn là lỗi cần sửa; chỉ ghi đạt pixel-perfect sau khi đối chiếu thực tế cùng viewport/trạng thái.

Nguồn tham chiếu (ảnh, website, sitemap, recording, HTML, design file) là source of truth tuyệt đối cho cấu trúc, nội dung, typography, màu, spacing, asset, responsive và tương tác quan sát được. Clone là tái tạo UI/hành vi 100%, không phải chỉ tải asset về máy — asset download chỉ hỗ trợ; nghiệm thu là clone khớp source.

## Ràng buộc bất biến

- Giữ nguyên hierarchy: route, thứ tự section, vùng header/navigation/main/footer, nhóm component, vị trí và quan hệ giữa các phần.
- Không tự ý thêm, xóa, đổi thứ tự, đổi bố cục, đổi copy, đổi component/interaction, redesign, "cải thiện", tối giản, hiện đại hóa, thêm section/CTA, đổi theme/design system/component library hoặc phong cách ngoài phạm vi người dùng đã chọn — dù nhìn "hợp lý" hay "tốt hơn" theo gu agent. Source khác code hiện tại ở phần khác phạm vi → báo chênh lệch, xin xác nhận, không tự mở rộng/thay thế.
- Giữ nguyên giá trị UI đã quan sát được: kích thước tương đối, màu, border, radius, shadow, spacing, icon, ảnh, trạng thái, chuyển động.
- Không dùng placeholder, ảnh giả, text giả hoặc component generic để che phần chưa hiểu; thiếu asset/hành vi thì ghi rõ giới hạn, giữ cấu trúc tối thiểu.
- Bảo toàn URL, route, link, query, form action và contract dữ liệu thuộc phạm vi clone. Không đổi backend/API chỉ để thuận tiện frontend.
- Responsive suy từ viewport/breakpoint có bằng chứng; không tự thêm breakpoint làm đổi UI ngoài nguồn.
- Không tự áp dụng skill thiết kế khác (`minimalist-ui`, `redesign-existing-projects`...) — chúng có thể làm lệch nguồn clone.

## Quy trình

Trước khi code từ URL, phải kiểm tra khả năng truy cập, status/redirect, HTML/DOM, computed style, font, asset, viewport/responsive và interaction; ghi rõ phần hoạt động, bị chặn hoặc chưa kiểm chứng.

1. **Xác định nguồn chuẩn**: phân loại ảnh/screenshot, URL website, URL sitemap, recording, HTML, Figma hoặc nhiều nguồn; ghi rõ nguồn nào ưu tiên khi có mâu thuẫn. Với sitemap, chỉ dùng nó để inventory và phải chốt URL route hoặc nhóm route cần clone trước khi code, không tự clone toàn bộ sitemap. Nếu không truy cập/đọc được nguồn, dừng phần suy đoán và báo blocker cụ thể.
2. **Lập inventory trước khi sửa**: route và URL, cây section/component, header/footer, nội dung, asset, font, màu/token, kích thước/spacing, breakpoint, trạng thái và tương tác. Tách phần đã quan sát khỏi phần chỉ là giả định.
3. **Khảo sát codebase**: đọc hướng dẫn project, stack, route, component, asset và contract liên quan; tái sử dụng cơ chế render, token và component hiện có khi chúng khớp nguồn. Chỉ thay đổi file/page nằm trong phạm vi clone.
4. **Đối chiếu với code/design hiện tại**: nếu clone hiện tại khác source website hoặc khác design file, phải dừng và hỏi người dùng chọn source of truth. Không tự quyết định dùng website hay design file.
5. **Chốt và đồng bộ tài liệu**: nếu người dùng chọn website, xác nhận cập nhật design/plan/docs để khớp 100% website; nếu chọn design file, dùng design file làm source of truth và cập nhật plan/docs theo design đã chốt. Cập nhật đúng format tài liệu hiện có của repo, gồm plan/index khi bị ảnh hưởng; không ghi kế hoạch mâu thuẫn với source đã chọn.
6. **Giao coding-agent triển khai**: sau khi source of truth, inventory, phạm vi và plan/docs đã chốt, bàn giao cho `coding-agent` viết code — không tự viết code ở bước điều phối này. Ở Claude Code, đây là lượt gọi riêng do agent điều phối (phiên đã chạy bước 1–5) thực hiện qua Agent tool; agent clone không có `Edit` và không có tool gọi agent khác nên không tự làm được.
7. **Đối chiếu fidelity**: coding-agent phải kiểm tra cùng viewport và trạng thái với source; so sánh macro-layout trước rồi tới typography, spacing, asset, màu và interaction. Phải kiểm tra cả bounding box và computed style thực tế của container, section, slider track/thumb và phần tử liên quan, tối thiểu gồm `width`, `max-width`, `min-width`, `height`, `padding`, `margin`, `gap`, `overflow`, `flex-basis`/grid track. Không kết luận đúng chỉ vì CSS source có khai báo tương tự: nếu source dùng `max-width` nhưng clone hiển thị full width, hoặc ngược lại, phải sửa hoặc báo sai khác cụ thể. Nếu có sai khác không thể xác minh, ghi lại và dừng phần suy đoán.
8. **Chụp ảnh chứng (trước và kết quả)**: sau khi mọi sửa đổi trong scope đã xong — chụp ở **trạng thái kết quả cuối cùng**, không chụp giữa chừng/WIP rồi báo xong. Chụp cặp ảnh cùng viewport/trạng thái: ảnh `trước` là source (website/ảnh/design gốc đang clone) và ảnh `kết quả` là trang clone thật mở trên trình duyệt, để đối chứng song song. Lưu vào `.agents/storage/evidence/<task-slug>/<viewport>-<trạng-thái>-{source|result}.png` (không commit, chỉ dùng làm bằng chứng cho báo cáo). Không tuyên bố đã đối chiếu fidelity nếu chưa có cả hai ảnh thật; môi trường không chụp được thì ghi rõ lý do thay vì bỏ qua.
9. **Bàn giao**: rà diff để xác nhận không có UI thêm/bớt hoặc thay đổi ngoài source of truth đã chọn; nêu nguồn, plan/docs đã đồng bộ, phần khớp, phần chưa xác minh và check đã chạy. Report theo [template Change](../report/assets/change-report-template.md) phải có dòng `URL:` (route đã kiểm tra) và `Ảnh chứng:` (đường dẫn screenshot ở bước 8). Không tuyên bố pixel-perfect khi chưa có đối chiếu và ảnh chứng tương ứng.

## Pipeline tự động hóa tài nguyên, CSS và media

Khi người dùng yêu cầu clone từ URL và cần tài nguyên local, dùng pipeline dưới đây. Đây là cơ chế hỗ trợ tạo clone; nghiệm thu cuối vẫn là đối chiếu UI thực tế. Áp dụng mục [Ràng buộc fidelity](#ràng-buộc-fidelity) bên dưới.

### Bước 0 — Inventory nguồn (trước khi code)

Trước khi tải asset hoặc viết code, tạo inventory read-only bằng [`scripts/inspect-source.py`](scripts/inspect-source.py) — không tải asset, chỉ liệt kê route, stylesheet, script, ảnh, font và link quan sát được:

```bash
python3 .agents/skills/clone-website/scripts/inspect-source.py \
  https://example.com/page \
  --output clone-source.json
```

Khi nguồn là URL và người dùng yêu cầu clone, subagent phải tự chạy bước inventory này trước khi sang Bước 1; không chờ người dùng nhắc lại.

### Bước 1 — Extract và download asset

Chạy [`scripts/extract-assets.py`](scripts/extract-assets.py) với output riêng của clone:

```bash
python3 .agents/skills/clone-website/scripts/extract-assets.py \
  https://example.com/page \
  --output .agents/storage/assets
```

Script tạo `.agents/storage/assets/temp/{images,videos,fonts,other}` và `mapping.json` (giữ `originUrl`, `localPath`, `kind`, `status`, kích thước, content type, lý do skip/fail). Quét HTML, inline `url()` và `url()` trong CSS đã tải; mặc định cùng-origin, timeout 30s, 50 MiB/file. `--allow-external` chỉ khi host ngoài đã được cho phép; `.m3u8` luôn ghi `skipped`, không tự tải.

URL đã được giao để clone → tải tài nguyên cùng origin nằm trong phạm vi công việc, không cần hỏi lại; chỉ dừng/báo blocker khi vượt authentication/CAPTCHA/paywall hoặc cần host ngoài/stream chưa được phép (xem [Ràng buộc fidelity](#ràng-buộc-fidelity)).

### Bước 2 — Process CSS

Với từng stylesheet đã được inventory, chạy [`scripts/process-css.py`](scripts/process-css.py):

```bash
python3 .agents/skills/clone-website/scripts/process-css.py \
  --input .agents/storage/assets/temp/other/site.css \
  --mapping .agents/storage/assets/mapping.json \
  --output src/layout/site.processed.css
```

Script chỉ thay URL đã có trạng thái `downloaded`, giữ nguyên selector/thứ tự CSS và thêm newline cuối file. Không dùng mapping để giả lập asset failed/skipped. Giữ file CSS processed trong layout/asset structure của clone, không ghi đè CSS nguồn.

### Bước 3 — Inject layout và media

Sau khi CSS đã được xử lý, chạy [`scripts/inject-layout.py`](scripts/inject-layout.py) với layout output riêng:

```bash
python3 .agents/skills/clone-website/scripts/inject-layout.py \
  --input public/clone-layout.source.html \
  --css src/layout/site.processed.css \
  --mapping .agents/storage/assets/mapping.json \
  --output public/clone-layout.html
```

Script inject một stylesheet duy nhất vào `<head>` (idempotent), rewrite `src`/`poster` của `img`, `video`, `audio`, `source`, `track` khi mapping đã xác minh và không thay đổi layout nguồn. `iframe`, stream, media cross-origin hoặc thuộc tính DOM không được script nhận diện phải được kiểm tra thủ công và ghi trong bàn giao.

### Bước 4 — Verify cấu trúc sau khi code

Sau khi có HTML clone, kiểm tra inventory cấu trúc bằng [`scripts/compare-html.py`](scripts/compare-html.py). Kết quả này chỉ là kiểm tra cấu trúc (so khớp thẻ/section/độ dài text); pixel fidelity vẫn phải đối chiếu cùng viewport bằng screenshot/tool phù hợp:

```bash
python3 .agents/skills/clone-website/scripts/compare-html.py \
  source.html \
  cloned.html
```

### Cấu trúc storage mặc định

```text
.agents/storage/assets/
├── temp/{images,videos,fonts,other}/
├── mapping.json
└── processed/
```

`temp/` và `mapping.json` là tài nguyên tạm (đã trong `.gitignore` của `.agents/storage/`), không commit. Asset dùng thật trong clone đặt ở `public/`/thư mục asset của project, không ở `.agents/storage/`. Cần tài liệu thiết kế: copy [`assets/pixel-perfect-spec.md`](assets/pixel-perfect-spec.md) vào `docs/design/`, thay `TBD` bằng giá trị đo được, cập nhật registry docs theo rule repo.

## Quy tắc khi nguồn là screenshot hoặc ảnh

- Đọc ảnh như đặc tả thị giác: xác định bounding region, alignment, khoảng cách, tỷ lệ, thứ bậc chữ và trạng thái đang hiển thị trước khi code.
- Chỉ tái tạo những gì có bằng chứng. Không suy ra menu, animation, hover state, API data hoặc mobile layout nếu ảnh không thể hiện và người dùng chưa yêu cầu.
- Nếu chữ hoặc asset không đọc được, hỏi hoặc dùng nội dung đã có trong project; không bịa copy có ý nghĩa nghiệp vụ.
- Dùng asset local hoặc asset được người dùng cung cấp nếu có. Không tải hoặc nhúng asset bên ngoài khi chưa được cho phép.

## Tiêu chí nghiệm thu

- Cây trang, thứ tự section, route và hành vi trong phạm vi khớp nguồn tham chiếu.
- UI không bị tự ý đổi màu, font, spacing, component, copy, asset, breakpoint hoặc interaction.
- Không có placeholder/giả định chưa được đánh dấu trong phần đã cam kết clone.
- Kiểm tra đúng viewport, responsive state và interaction đã có bằng chứng; ghi rõ các trạng thái chưa kiểm tra.
- Diff không chứa thay đổi ngoài page/component/asset/config cần cho clone.

## Skill liên quan

- Dùng `coding-frontend` để triển khai frontend theo stack và rule thật của project.
- Dùng `workflow-test` hoặc `testcase` khi người dùng yêu cầu thiết kế/chạy test; không tự biến việc clone thành redesign.

## Ràng buộc fidelity

- Chốt source of truth, route, viewport và trạng thái trước khi triển khai. Tách dữ kiện đã quan sát khỏi giả định; không ghi nhận pixel-perfect nếu chưa đối chiếu cùng viewport/trạng thái.
- Mọi asset tải về có mapping `originUrl` → `localPath`, trạng thái, loại tài nguyên và lỗi nếu có; không thay URL chưa tải bằng placeholder hoặc URL không xác minh.
- Giữ CSS gốc ở file riêng khi có thể, thay URL bằng mapping đã xác minh, giữ thứ tự stylesheet và selector. Không dùng regex sửa CSS phức tạp nếu có thể làm hỏng chuỗi, data URI hoặc `@import`.
- Video, iframe, stream manifest và asset lớn có trạng thái riêng. Không tự tải/ghép stream `.m3u8`, không bỏ qua `poster`, `source`, `track` hoặc `srcset`; ghi rõ phần cần xử lý thủ công.
- Inject CSS/media phải idempotent (chạy lại không nhân đôi `<link>`, `<style>` hoặc nguồn media) và không ghi đè layout nguồn; dùng file output riêng.
- Pixel spec chỉ chứa giá trị đo/quan sát được (màu, font, kích thước, line-height, spacing, container, breakpoint, shadow, transition, trạng thái); giá trị chưa đo ghi `TBD`/`Unverified`, không bịa.
- Tuân thủ giới hạn cùng-origin, kích thước file, timeout và quyền truy cập. Host ngoài, authentication, CAPTCHA, paywall hoặc stream cần quyền riêng thì dừng và báo blocker.
