# 📚 Đồng bộ tài liệu — Docs-as-Code Sync

**Nhóm quy tắc kết hợp**: Documentation as Code + Definition of Done (bao gồm docs)

Đọc hoặc sửa file trong `docs/` thì đọc `index.json` phù hợp trước theo [`documentation-reading-and-toc`](./documentation-reading-and-toc.md), rồi cập nhật index/record tương ứng cùng lượt; không nhúng nội dung tài liệu vào menu. `docs/testcases/index.json` là dữ liệu testcase và kết quả chạy theo schema riêng, không phải menu.

Sau khi hoàn tất coding cho tất cả task của một implementation plan, tạo testcase cấp repository bằng Markdown tại `docs/repo/<title-slug>-<yyyyMMdd>.md`, dựa trên code và luồng thực tế sau triển khai. Chỉ thiết kế testcase, không tự chạy; ghi trạng thái `Not Run`. Cập nhật `docs/repo/index.json` và `docs/index.json` cùng lượt (entry chỉ có `title`, `description`, `tags`, `path`). Tài liệu này không thay thế dữ liệu theo feature trong `docs/testcases/index.json`.

## Cách áp dụng

- Sau khi `coding-agent` triển khai xong theo plan của [`planner-agent`](../agents/planner-agent.md) (tạo/sửa/xóa file, đổi API, đổi cấu trúc, đổi tên agent/skill/command), kiểm tra `README.md`/`CLAUDE.md`/`docs/` có đoạn nào nhắc phần vừa đổi — có thì cập nhật ngay trong cùng lượt, không để "làm sau".
- **DONE** của một task không chỉ là code đúng + test pass ([`rules/quality-assurance`](./quality-assurance.md)) mà còn gồm docs liên quan đã phản ánh đúng thay đổi. Trước khi báo hoàn thành, tự hỏi: _"README/CLAUDE.md/docs có đoạn nào giờ sai không?"_
- Đổi API và repo đã có Postman collection phù hợp: sửa request, ví dụ, metadata ngay trong Postman; đã tồn tại thì sửa, không tạo collection/request/file trùng.
- Phạm vi docs lớn hoặc không chắc hết chỗ nhắc tới phần vừa đổi (đổi tên agent/skill/command, thêm/xóa module): dùng skill [`docs`](../skills/docs/SKILL.md), không tự nhớ thủ công.
- Chỉ cập nhật đúng phần bị ảnh hưởng ([`rules/simplicity`](./simplicity.md)). Không áp dụng cho thay đổi nội bộ không ảnh hưởng nội dung docs (đổi tên biến cục bộ, refactor không đổi hành vi/giao diện công khai).
