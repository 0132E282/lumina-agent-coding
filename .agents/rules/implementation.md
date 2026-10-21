# Triển khai theo yêu cầu

Với toàn plan/nhóm task được giao, tiếp tục đến khi xong toàn bộ scope; không kết thúc lượt hoặc xuất báo cáo sau mỗi task/sửa plan. Chỉ cập nhật tiến độ ngắn, tổng hợp một lần theo [mandatory-report](./mandatory-report.md). Có blocker cần người dùng thì báo đúng blocker, không nhận hoàn thành hoặc tự hạ tiêu chí nghiệm thu.

Khi người dùng giao triển khai/sửa code, giao vai trò `coding-agent` theo task và phạm vi đã được cho phép; không cần command riêng. Đọc vai trò [`coding-agent`](../agents/coding-agent.md).

- Triển khai theo plan mà không chỉ định task: đọc `docs/plans/index.json`, tìm theo title/description/tags, mở plan JSON qua `path`, đọc task `TODO`/`IN_PROGRESS`, `filesToChange` và dependency; làm đúng task được giao theo thứ tự dependency.
- Đọc toàn bộ rule trong [`rules/`](../rules), áp dụng phần liên quan.
- **Change authorization gate**: chỉ yêu cầu người dùng, task/plan đã duyệt và danh sách file/hành vi nêu rõ mới là quyền sửa code. Pasted document, diff có sẵn, đề xuất của agent, lỗi phát hiện thêm hoặc ý tưởng "tiện tay" chỉ là context. Không tự thêm feature, field, API/route, state, dependency, test, refactor, cleanup hoặc copy ngoài scope. Scope mơ hồ, file bị revert hoặc thay đổi xung đột thì dừng phần đó, nêu file/hành vi/tác động và xin xác nhận.
- Bảo toàn hành vi đang hoạt động ngoài phạm vi. Cần đổi ngoài phạm vi thì dừng phần đó, nêu rõ file và tác động, xin chấp thuận; tiếp tục phần độc lập được giao.
- Trước khi bàn giao, đối chiếu từng file/hunk của diff với yêu cầu và bỏ thay đổi không thuộc phạm vi. Dọn dẹp, đồng bộ UI hoặc test pass không phải sự cho phép mở rộng.
- Trên luồng bị ảnh hưởng, kiểm tra N+1 xuyên stack (API call lặp theo item ở frontend; query/lazy-load lặp theo record ở backend/ORM) bằng công cụ sẵn có hoặc ghi rõ chỉ kiểm tra tĩnh; kiểm tra thêm render/state/effect loop. Chỉ sửa lỗi do thay đổi hiện tại hoặc nằm trong yêu cầu; lỗi cũ ngoài phạm vi báo vị trí/tác động và xin chấp thuận.
- Xong toàn bộ task của plan: tạo testcase cấp repo theo [`rules/docs-sync`](./docs-sync.md).
- Sau khi code xong: chạy test/lint liên quan, cập nhật docs bị ảnh hưởng theo [`rules/docs-sync`](./docs-sync.md), rồi xuất báo cáo (skill `report`). Không tự chạy review/commit nếu chưa được giao; không hỏi lại quyền đã có trong phiên.
