---
name: docs
description: "Viết hoặc đồng bộ tài liệu dự án (README.md, CLAUDE.md, docs/): đồng bộ khi đã có tài liệu (đối chiếu codebase, sửa phần lỗi thời) hoặc viết mới khi chưa có. Mặc định AI-readable. Dùng khi cần tạo hoặc cập nhật tài liệu; sơ đồ dùng system-understanding; không tự thiết kế HLD/LLD."
license: MIT
metadata:
  version: '1.4'
---

# 🔄 Docs

Viết mới hoặc đồng bộ README, hướng dẫn project và `docs/`; đối chiếu mọi nội dung với nguồn thật ([`search-priority`](../../rules/search-priority.md)). Tuân thủ schema và luồng catalog trong [`docs-sync`](../../rules/docs.md#đồng-bộ-tài-liệu) và [`documentation-reading-and-toc`](../../rules/docs.md#registry-tài-liệu). Không thiết kế HLD/LLD; bàn giao cho [`system-design-agent`](../../agents/system-design-agent.md). Khi cần sơ đồ hiện trạng, dùng [`system-understanding`](../system-understanding/references/diagrams.md).

## Mục lục

- [Đọc tài liệu theo đối tượng](#đọc-tài-liệu-theo-đối-tượng)
- [Chế độ 1 — Đồng bộ](#chế-độ-1--đồng-bộ-đã-có-tài-liệu)
- [Chế độ 2 — Viết mới](#chế-độ-2--viết-mới-chưa-có-gì-để-đối-chiếu)
- [Template theo loại tài liệu](#template-theo-loại-tài-liệu)

## Đọc tài liệu theo đối tượng

Mặc định viết **AI-readable** (ngắn, heading ổn định, facts/path/contract/kết quả kiểm chứng; không lặp lại sơ đồ bằng prose); chỉ chuyển **human-readable** khi người dùng yêu cầu. Quy tắc chi tiết và cách dùng sơ đồ Mermaid để giảm tải đọc hiểu: [references/writing-style.md](./references/writing-style.md).

## Chế độ 1 — Đồng bộ (đã có tài liệu)

Phạm vi mặc định: `README.md`, `CLAUDE.md` (nếu có), `docs/**/*.md` (nếu có). Người dùng có thể giới hạn vào một file cụ thể.

1. Trích "claim" kiểm chứng được: đường dẫn, tên agent/skill/command/hook, số lượng/liệt kê, mô tả hành vi cụ thể.
2. Đối chiếu từng claim với thực tế: đường dẫn → `Glob`; tên agent/skill/command → danh sách thật trong `.claude/agents|skills|commands/` (đọc frontmatter, không suy diễn); mô tả hành vi → đọc đúng file nguồn để so khớp.
3. Phân loại: **sai rõ ràng** (file không còn tồn tại, tên đổi, số liệu sai) → sửa ngay theo thực tế vừa đọc; **không chắc** (mơ hồ, không kiểm chứng trực tiếp được) → không tự xóa, đưa vào "cần hỏi thêm" (giống cách [`workspace-auditor-agent`](../../agents/workspace-auditor-agent.md) xử lý phần không chắc).
4. Sửa trực tiếp phần đã xác nhận sai, giữ văn phong/cấu trúc tài liệu — không viết lại toàn bộ file, không tự thêm tính năng/mục mới ngoài việc sửa đúng-sai ([`rules/coding`](../../rules/coding.md#kiss-yagni-và-phạm-vi)).
5. Báo cáo theo `change-report-template.md` của skill [`report`](../report/SKILL.md): mỗi chỗ sửa ghi _trước → sau_ + bằng chứng, cộng danh sách "cần hỏi thêm" nếu có.

Khi task đổi API và repository có Postman collection/tài liệu Postman liên quan, cập nhật request và ví dụ hiện hữu ở đó cùng lượt. Tìm và chỉnh collection/request phù hợp trước; không tạo collection, request hoặc file mới trùng nội dung khi đang làm lại tài liệu. Chỉ thêm mục mới nếu chưa có mục tương ứng và task yêu cầu.

## Chế độ 2 — Viết mới (chưa có gì để đối chiếu)

Dùng khi project/module/feature chưa có CLAUDE.md/README, cần viết lần đầu — tương tự lệnh `/init` có sẵn nhưng **gọn và tối ưu hơn**: chỉ ghi điều thực sự cần để làm việc hiệu quả trong repo, không liệt kê toàn bộ cấu trúc file hay lặp lại thông tin Glob/Grep tự tra được.

1. Xác định stack/ngôn ngữ chính từ file manifest thật (`package.json`, `composer.json`, `pyproject.toml`, `go.mod`...) — không đoán theo tên thư mục.
2. Đọc lệnh dev/build/test/lint **thật đang dùng** (scripts trong manifest, `Makefile`, CI config) — chỉ ghi lệnh đã xác minh tồn tại, không bịa lệnh "thường gặp" của stack đó.
3. Đọc vài file mẫu đại diện (không phải toàn bộ codebase) để rút convention thật đang áp dụng — quy ước đặt tên, cấu trúc module lặp lại, test pattern — không áp khung convention chung của stack khi code thật làm khác.
4. Viết theo cấu trúc gọn, mỗi mục một đoạn ngắn, bỏ mục không áp dụng kèm lý do thay vì để trống:
   - **Mục đích dự án** (1–2 câu).
   - **Cấu trúc thư mục chính** — chỉ cấp cao mang ý nghĩa điều hướng, không liệt kê từng file.
   - **Lệnh thường dùng** (dev/build/test/lint) — chỉ lệnh đã xác minh chạy được.
   - **Convention quan trọng cần biết trước khi sửa code** — quy ước/rule bắt buộc nếu có, pattern lặp lại thật đang dùng.
5. Không tự thiết kế kiến trúc hệ thống (HLD/LLD) — phần đó thuộc agent [`system-design-agent`](../../agents/system-design-agent.md). Nếu chỉ cần minh họa cấu trúc/flow đã có trong codebase, dùng [`system-understanding`](../system-understanding/references/diagrams.md).

## Template theo loại tài liệu

Đọc registry và file hiện hữu theo rule ở đầu skill trước khi chọn template; template chỉ là khung điền từ nguồn đã xác minh. Cách dùng chi tiết từng loại, schema, quy tắc cập nhật menu và kiểm tra trước bàn giao: [references/templates.md](./references/templates.md).

- [Tài liệu Markdown](assets/document-template.md) · [Testcase cấp repo](assets/repo-testcase-template.md) · [Testcase theo feature](assets/feature-testcase-template.json) · [Implementation plan](assets/implementation-plan-template.json) · [Menu JSON](assets/menu-template.json)
