# Đọc tài liệu và duy trì mục lục

## Tra cứu registry trước

- Đọc `index.json` phù hợp trước khi đọc hoặc viết tài liệu; tìm bằng `title`, `description`, `tags`, mở file chi tiết qua `path`.
- Mọi `index.json` dạng menu/catalog: entry chỉ gồm `title`, `description`, `tags`, `path` (`path` tương đối từ gốc repository; không thêm `id`, `url`, `content`, ngày tạo). `tags` là mảng từ khóa ngắn, chữ thường, ưu tiên kebab-case. `description` giúp AI quyết định có nên mở file không; với plan/review nêu loại tài liệu và khi nào nên tham khảo.
- File Markdown chi tiết có `title`, `description`, `tags` (frontmatter) và `content` (thân Markdown). Plan/review JSON giữ metadata và nội dung đầy đủ theo schema riêng, đặt tên `<title-slug>-<yyyyMMdd>.json`, có `title` và `createdAt` (`YYYY-MM-DD`); không suy ra ngày tạo cho artifact cũ nếu không có nguồn xác minh.
- Các index:
  - `docs/index.json`: catalog tài liệu Markdown; không đưa plan/testcase/review JSON vào.
  - `docs/plans/index.json`: menu plan. `docs/reviews/index.json`: menu review (findings nằm trong file JSON chi tiết).
  - `docs/repo/index.json`: mục lục con cho testcase cấp repo trong `docs/repo/`; chưa có thì tạo JSON array rỗng trước khi thêm entry.
  - `docs/testcases/index.json`: dữ liệu testcase và kết quả thực thi, không phải menu. Đọc trước khi thêm/sửa; giữ ID ổn định, ghi `createdAt` cho suite/case mới, chỉ cập nhật trạng thái/kết quả/evidence sau lần chạy thật.
- Catalog chỉ quản lý nội dung trong `docs/`; không thêm README, AGENTS, CLAUDE, rule hoặc skill.
- Ưu tiên cập nhật file chi tiết hiện có nếu đã có entry phù hợp; tránh tài liệu trùng.
- Cập nhật cùng lượt: Markdown → `docs/index.json`; plan → `docs/plans/index.json`; testcase cấp repo → `docs/repo/index.json` và `docs/index.json`; testcase/kết quả theo feature → `docs/testcases/index.json`; review → `docs/reviews/index.json`.

## Đọc trước khi sửa

- Trước khi cập nhật tài liệu, đọc toàn bộ file đích trong phạm vi có thể ảnh hưởng; không chỉ đọc đoạn định sửa rồi kết luận về cấu trúc hoặc nội dung. Đọc thêm file nguồn, tài liệu liên kết và convention liên quan khi chúng quyết định nội dung.
- File quá lớn, generated hoặc không đọc hết: ghi rõ phạm vi đã đọc và phần chưa kiểm tra; không giả định phần còn lại.

## Mục lục Markdown

- File Markdown có từ **3 heading cấp 2 trở lên**: thêm hoặc cập nhật `## Mục lục`/`## Table of Contents` ngay sau phần giới thiệu ngắn, chỉ liệt kê heading điều hướng chính, anchor hợp lệ, đúng thứ tự, không lồng quá sâu.
- Thêm, đổi tên, xóa hoặc di chuyển heading thì cập nhật mục lục trong cùng lượt; không để link hỏng.
- File ngắn (1–2 heading cấp 2), template fragment hoặc tài liệu có convention mục lục riêng có thể không cần; ghi `Không áp dụng` nếu cần giải thích.

## Kiểm chứng

- Kiểm tra heading và anchor sau khi sửa; rà link nội bộ nếu có công cụ.
- Báo cáo file đã đọc, mục lục đã tạo/cập nhật hoặc lý do không áp dụng, cùng phần chưa kiểm tra.
