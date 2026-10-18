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

Không tự mặc định câu trả lời là “có” hoặc “không”, không bắt đầu triển khai khi checkpoint này chưa có câu trả lời rõ ràng. Nếu người dùng chọn 100%, mọi sai khác quan sát được trong phạm vi đã chọn là lỗi cần sửa; chỉ ghi nhận đạt pixel-perfect sau khi đã đối chiếu thực tế cùng viewport và trạng thái.

Tái tạo website theo đúng nguồn tham chiếu được người dùng cung cấp. Nguồn tham chiếu là source of truth cho cấu trúc, bố cục, nội dung hiển thị, typography, màu sắc, spacing, asset, responsive behavior và tương tác quan sát được.

Clone website là tái tạo UI và hành vi quan sát được 100%, không phải chỉ tải tài nguyên về máy. Asset download chỉ là bước hỗ trợ; kết quả nghiệm thu là website clone phải khớp source.

## Ràng buộc bất biến

- Giữ nguyên hierarchy của trang: route, thứ tự section, vùng header/navigation/main/footer, nhóm component, vị trí và quan hệ giữa các phần.
- Không tự ý thêm, xóa, đổi thứ tự hoặc đổi nội dung section khác với phần người dùng đã chọn. Nếu phát hiện source có section khác với code hiện tại, phải báo chênh lệch và xin xác nhận phạm vi; không tự mở rộng hoặc thay thế section khác.
- Giữ nguyên UI đã quan sát được: layout, kích thước tương đối, typography, màu, border, radius, shadow, spacing, icon, ảnh, trạng thái và chuyển động. Không tự ý đổi theme, design system, component library hoặc phong cách.
- Không redesign, “cải thiện”, tối giản, hiện đại hóa, thêm section, thêm CTA, đổi copy, đổi asset hoặc đổi hành vi nếu nguồn tham chiếu và yêu cầu không nói rõ.
- Không dùng placeholder, ảnh giả, text giả hoặc component generic để che phần chưa hiểu. Nếu thiếu asset hoặc không quan sát được hành vi, ghi rõ giới hạn và giữ cấu trúc tối thiểu cần thiết.
- Bảo toàn URL, tên route, link, query, form action và contract dữ liệu hiện có khi chúng thuộc phạm vi clone. Không đổi backend/API chỉ để thuận tiện cho frontend.
- Responsive phải suy ra từ các viewport hoặc breakpoint có bằng chứng. Không tự thêm breakpoint làm thay đổi UI ngoài nguồn.
- Không tự áp dụng các skill thiết kế như `design-taste-frontend`, `minimalist-ui`, `gpt-taste` hoặc `redesign-existing-projects`; chúng có thể làm lệch nguồn clone.
- Không tự thêm, bớt, đổi bố cục, đổi copy, đổi component, đổi interaction hoặc “cải thiện” UI để hợp gu agent. Mọi khác biệt phải được người dùng xác nhận trước.

## Quy trình

Trước khi code từ URL, phải kiểm tra khả năng truy cập, status/redirect, HTML/DOM, computed style, font, asset, viewport/responsive và interaction; ghi rõ phần hoạt động, bị chặn hoặc chưa kiểm chứng.

1. **Xác định nguồn chuẩn**: phân loại ảnh/screenshot, URL website, URL sitemap, recording, HTML, Figma hoặc nhiều nguồn; ghi rõ nguồn nào ưu tiên khi có mâu thuẫn. Với sitemap, chỉ dùng nó để inventory và phải chốt URL route hoặc nhóm route cần clone trước khi code, không tự clone toàn bộ sitemap. Nếu không truy cập/đọc được nguồn, dừng phần suy đoán và báo blocker cụ thể.
2. **Lập inventory trước khi sửa**: route và URL, cây section/component, header/footer, nội dung, asset, font, màu/token, kích thước/spacing, breakpoint, trạng thái và tương tác. Tách phần đã quan sát khỏi phần chỉ là giả định.
3. **Khảo sát codebase**: đọc hướng dẫn project, stack, route, component, asset và contract liên quan; tái sử dụng cơ chế render, token và component hiện có khi chúng khớp nguồn. Chỉ thay đổi file/page nằm trong phạm vi clone.
4. **Đối chiếu với code/design hiện tại**: nếu clone hiện tại khác source website hoặc khác design file, phải dừng và hỏi người dùng chọn source of truth. Không tự quyết định dùng website hay design file.
5. **Chốt và đồng bộ tài liệu**: nếu người dùng chọn website, xác nhận cập nhật design/plan/docs để khớp 100% website; nếu chọn design file, dùng design file làm source of truth và cập nhật plan/docs theo design đã chốt. Cập nhật đúng format tài liệu hiện có của repo, gồm plan/index khi bị ảnh hưởng; không ghi kế hoạch mâu thuẫn với source đã chọn.
6. **Giao coding-agent triển khai**: sau khi source of truth, inventory, phạm vi và plan/docs đã được người dùng chốt, bàn giao task cụ thể cho `coding-agent` để viết code. Agent clone không tự viết product code trong bước điều phối này.
7. **Đối chiếu fidelity**: coding-agent phải kiểm tra cùng viewport và trạng thái với source; so sánh macro-layout trước rồi tới typography, spacing, asset, màu và interaction. Phải kiểm tra cả bounding box và computed style thực tế của container, section, slider track/thumb và phần tử liên quan, tối thiểu gồm `width`, `max-width`, `min-width`, `height`, `padding`, `margin`, `gap`, `overflow`, `flex-basis`/grid track. Không kết luận đúng chỉ vì CSS source có khai báo tương tự: nếu source dùng `max-width` nhưng clone hiển thị full width, hoặc ngược lại, phải sửa hoặc báo sai khác cụ thể. Nếu có sai khác không thể xác minh, ghi lại và dừng phần suy đoán.
8. **Bàn giao**: rà diff để xác nhận không có UI thêm/bớt hoặc thay đổi ngoài source of truth đã chọn; nêu nguồn, plan/docs đã đồng bộ, phần khớp, phần chưa xác minh và check đã chạy. Không tuyên bố pixel-perfect khi chưa có đối chiếu tương ứng.

## Pipeline tự động hóa tài nguyên, CSS và media

Khi người dùng yêu cầu clone từ URL và cần tài nguyên local, dùng pipeline dưới đây. Đây là cơ chế hỗ trợ tạo clone; nghiệm thu cuối vẫn là đối chiếu UI thực tế. Áp dụng rule [`clone-fidelity`](../../rules/clone-fidelity.md).

### Bước 0 — Inventory nguồn (trước khi code)

Trước khi tải asset hoặc viết code, tạo inventory read-only bằng [`scripts/inspect-source.py`](scripts/inspect-source.py) — không tải asset, chỉ liệt kê route, stylesheet, script, ảnh, font và link quan sát được:

```bash
python3 .agents/skills/clone-website/scripts/inspect-source.py \
  https://example.com/page \
  --output clone-source.json
```

Khi nguồn là URL và người dùng yêu cầu clone, subagent phải tự chạy bước inventory này trước khi sang Giai đoạn 1; không chờ người dùng nhắc lại.

### Giai đoạn 1 — Extract và download asset

Chạy [`scripts/extract-assets.py`](scripts/extract-assets.py) với output riêng của clone:

```bash
python3 .agents/skills/clone-website/scripts/extract-assets.py \
  https://example.com/page \
  --output .agents/storage/assets
```

Script tạo `.agents/storage/assets/temp/images`, `videos`, `fonts`, `other` và `.agents/storage/assets/mapping.json`. Mapping giữ `originUrl`, `localPath`, `kind`, `status`, kích thước, content type và lý do skip/fail. Script quét HTML, inline `url()`, linked stylesheet và `url()` trong CSS đã tải; giới hạn cùng-origin mặc định, timeout 30 giây và 50 MiB/file. Dùng `--allow-external` chỉ khi host ngoài đã được người dùng cho phép. Stream `.m3u8` được ghi trạng thái `skipped`, không tự tải.

Với URL nguồn đã được người dùng giao để clone, quyền tải tài nguyên cùng origin được hiểu là đã nằm trong phạm vi công việc. Chỉ dừng và báo blocker khi nguồn yêu cầu vượt authentication/CAPTCHA/paywall, bị chặn, hoặc cần tải host ngoài/stream mà chưa được cho phép. Không tải asset chỉ vì nhìn thấy URL trong code nếu người dùng chưa cho phép; tôn trọng quyền truy cập, license, robots/ToS và giới hạn của nguồn.

### Giai đoạn 2 — Process CSS

Với từng stylesheet đã được inventory, chạy [`scripts/process-css.py`](scripts/process-css.py):

```bash
python3 .agents/skills/clone-website/scripts/process-css.py \
  --input .agents/storage/assets/temp/other/site.css \
  --mapping .agents/storage/assets/mapping.json \
  --output src/layout/site.processed.css
```

Script chỉ thay URL đã có trạng thái `downloaded`, giữ nguyên selector/thứ tự CSS và thêm newline cuối file. Không dùng mapping để giả lập asset failed/skipped. Giữ file CSS processed trong layout/asset structure của clone, không ghi đè CSS nguồn.

### Giai đoạn 3 — Inject layout và media

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

`.agents/storage/assets/temp` và `mapping.json` là tài nguyên tạm của tiến trình clone (đã nằm trong `.gitignore` chung của `.agents/storage/`), không commit. Asset thật sự dùng trong code clone (deliverable cuối) đặt ở `public/`/thư mục asset của project, không ở `.agents/storage/`. Khi cần tài liệu thiết kế, copy template [`assets/pixel-perfect-spec.md`](assets/pixel-perfect-spec.md) thành `docs/design/pixel-perfect-spec.md`, thay `TBD` bằng giá trị đo được và cập nhật registry docs theo rule của repo.

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
- Dùng `image-to-code` chỉ khi người dùng yêu cầu quy trình image-first; khi đó ảnh tham chiếu vẫn là source of truth và không được tự art-direct lại.
- Dùng `workflow-test` hoặc `testcase` khi người dùng yêu cầu thiết kế/chạy test; không tự biến việc clone thành redesign.
