# Pipeline tự động hóa tài nguyên, CSS và media

Khi người dùng yêu cầu clone từ URL và cần tài nguyên local, dùng pipeline dưới đây. Đây là cơ chế hỗ trợ tạo clone; nghiệm thu cuối vẫn là đối chiếu UI thực tế. Áp dụng mục [Ràng buộc fidelity](../SKILL.md#ràng-buộc-fidelity) trong SKILL.md.

### Bước 0 — Inventory nguồn (trước khi code)

Trước khi tải asset hoặc viết code, tạo inventory read-only bằng [`scripts/inspect-source.py`](../scripts/inspect-source.py) — không tải asset, chỉ liệt kê route, stylesheet, script, ảnh, font và link quan sát được:

```bash
python3 .agents/skills/clone-website/scripts/inspect-source.py \
  https://example.com/page \
  --output clone-source.json
```

Khi nguồn là URL và người dùng yêu cầu clone, subagent phải tự chạy bước inventory này trước khi sang Bước 1; không chờ người dùng nhắc lại.

### Bước 1 — Extract và download asset

Chạy [`scripts/extract-assets.py`](../scripts/extract-assets.py) với output riêng của clone:

```bash
python3 .agents/skills/clone-website/scripts/extract-assets.py \
  https://example.com/page \
  --output .agents/storage/assets
```

Script tạo `.agents/storage/assets/temp/{images,videos,fonts,other}` và `mapping.json` (giữ `originUrl`, `localPath`, `kind`, `status`, kích thước, content type, lý do skip/fail). Quét HTML, inline `url()` và `url()` trong CSS đã tải; mặc định cùng-origin, timeout 30s, 50 MiB/file. `--allow-external` chỉ khi host ngoài đã được cho phép; `.m3u8` luôn ghi `skipped`, không tự tải.

URL đã được giao để clone → tải tài nguyên cùng origin nằm trong phạm vi công việc, không cần hỏi lại; chỉ dừng/báo blocker khi vượt authentication/CAPTCHA/paywall hoặc cần host ngoài/stream chưa được phép (xem [Ràng buộc fidelity](../SKILL.md#ràng-buộc-fidelity)).

### Bước 2 — Process CSS

Với từng stylesheet đã được inventory, chạy [`scripts/process-css.py`](../scripts/process-css.py):

```bash
python3 .agents/skills/clone-website/scripts/process-css.py \
  --input .agents/storage/assets/temp/other/site.css \
  --mapping .agents/storage/assets/mapping.json \
  --output src/layout/site.processed.css
```

Script chỉ thay URL đã có trạng thái `downloaded`, giữ nguyên selector/thứ tự CSS và thêm newline cuối file. Không dùng mapping để giả lập asset failed/skipped. Giữ file CSS processed trong layout/asset structure của clone, không ghi đè CSS nguồn.

### Bước 3 — Inject layout và media

Sau khi CSS đã được xử lý, chạy [`scripts/inject-layout.py`](../scripts/inject-layout.py) với layout output riêng:

```bash
python3 .agents/skills/clone-website/scripts/inject-layout.py \
  --input public/clone-layout.source.html \
  --css src/layout/site.processed.css \
  --mapping .agents/storage/assets/mapping.json \
  --output public/clone-layout.html
```

Script inject một stylesheet duy nhất vào `<head>` (idempotent), rewrite `src`/`poster` của `img`, `video`, `audio`, `source`, `track` khi mapping đã xác minh và không thay đổi layout nguồn. `iframe`, stream, media cross-origin hoặc thuộc tính DOM không được script nhận diện phải được kiểm tra thủ công và ghi trong bàn giao.

### Bước 4 — Verify cấu trúc sau khi code

Sau khi có HTML clone, kiểm tra inventory cấu trúc bằng [`scripts/compare-html.py`](../scripts/compare-html.py). Kết quả này chỉ là kiểm tra cấu trúc (so khớp thẻ/section/độ dài text); pixel fidelity vẫn phải đối chiếu cùng viewport bằng screenshot/tool phù hợp:

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

`temp/` và `mapping.json` là tài nguyên tạm (đã trong `.gitignore` của `.agents/storage/`), không commit. Asset dùng thật trong clone đặt ở `public/`/thư mục asset của project, không ở `.agents/storage/`. Cần tài liệu thiết kế: copy [`assets/pixel-perfect-spec.md`](../assets/pixel-perfect-spec.md) vào `docs/design/`, thay `TBD` bằng giá trị đo được, cập nhật registry docs theo rule repo.
