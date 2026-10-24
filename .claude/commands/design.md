---
description: Tự tạo DESIGN.md và tài liệu design vào docs/design/ từ link (website, sitemap, ảnh, hoạt ảnh); không có link thì lint DESIGN.md
argument-hint: "[URL | sitemap | ảnh | đường dẫn DESIGN.md] [ghi chú]"
---

Chọn một chế độ theo `$ARGUMENTS`: **tạo** nếu có URL/sitemap/ảnh/recording, **lint** nếu là đường dẫn `DESIGN.md` hoặc không có argument.

## Chế độ tạo (có link hoặc ảnh)

Đọc `AGENTS.md`, `CONTRACT.md`, [`rules/frontend`](../rules/frontend.md), skill [`clone-website`](../skills/clone-website/SKILL.md) và [`animations`](../skills/animations/SKILL.md) trước. Giao `ui-cloner` (khảo sát) rồi `designer` (viết tài liệu); runtime không hỗ trợ delegation thì làm tuần tự cùng vai trò và nêu giới hạn. Không viết code sản phẩm, không clone UI, không commit/push.

1. **Thu thập toàn bộ nguồn**: kiểm tra truy cập, status/redirect; liệt kê mọi trang cùng origin qua sitemap/điều hướng (nhiều trang thì chốt danh sách với người dùng); với mỗi trang đọc HTML/DOM, CSS, computed style, font, asset, breakpoint, trạng thái và tương tác. Dùng công cụ trình duyệt nếu runtime có để chụp ảnh và đo computed style; thiếu thì dùng pipeline của `clone-website` và ghi rõ phần không quan sát được.
2. **Phân tích hoạt ảnh** từ link: `@keyframes`, `transition`, `animation-timeline`, thư viện (GSAP, Motion, Lottie...), trigger (hover, scroll, load, click), thuộc tính đổi, thời lượng, easing, nhánh reduced-motion. Giá trị không đo được ghi "chưa xác minh", không đoán.
3. **Ghi vào `docs/design/`** (thư mục khác nếu người dùng chỉ định):
   - `DESIGN.md` đúng spec (`npm run design:spec`): front matter token (`colors`, `typography`, `rounded`, `spacing`, `components`) và các section Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts, rồi `## Images`, `## Motion`, `## Pages`. Component dùng chung nằm ở đây; màu có hex thật và contrast tính bằng công thức, không ước lượng.
   - `index.md` liệt kê mọi trang và trạng thái; mỗi trang một file (section từ trên xuống, nội dung, trạng thái, responsive, hoạt ảnh); `animations.md` cho hoạt ảnh.
   - `images/`: ảnh chứng thật của từng trang (cùng viewport) và ảnh màu; không chụp được thì ghi lý do, không dùng ảnh giả.
   - Cập nhật `docs/index.json` cho mọi file `.md` mới. Chỉ ghi giá trị quan sát được; chỗ thiếu ghi "chưa xác minh".
4. **Chứng minh**: chạy `npm run design:lint -- docs/design/DESIGN.md` và `python3 scripts/check_docs.py`; giữ exit code và findings thật, không sửa nội dung chỉ để lint đạt. Đối chiếu mọi hex trong ảnh/trang với token trong `DESIGN.md`.
5. Báo bằng skill `report`: link đã đọc, số trang đã/chưa phân tích, ảnh chứng, kết quả lint, phần chưa xác minh. Việc code sau đó giao `coder`, bám đúng `docs/design/`.

## Chế độ lint (đường dẫn hoặc không có argument)

Mặc định `docs/design/DESIGN.md`. Giao vai trò `setup`:

- Dependency `@google/design.md` đã khai báo thì cài theo lockfile (`npm ci`), không tải qua `npx`; chưa khai báo thì thêm devDependency `@google/design.md@^0.4.0` và hai script `"design:lint": "designmd lint"`, `"design:spec": "designmd spec"` (giữ script khác, báo xung đột nếu key đã có nội dung khác). Không cài global vào `~/`, không `--force`; chưa có `package.json` thì tạo manifest tối thiểu `private: true`, monorepo chưa rõ package đích thì hỏi trước.
- Chạy `npm run design:spec` làm căn cứ, rồi `npm run design:lint -- "<đường dẫn>"` (truyền path như argument, không nội suy shell). Không tự ghi đè hay sửa `DESIGN.md` để lint đạt; thiếu file thì báo lint chưa chạy.
- Báo dependency/phiên bản, script, kết quả spec/lint và lỗi còn lại bằng skill `report`; kiểm diff manifest/lockfile đúng phạm vi.
