---
trigger: model_decision
description: "Áp dụng khi triển khai hoặc sửa code theo yêu cầu người dùng; quy trình chung không cần command implement."
---

# Triển khai theo yêu cầu

Với toàn plan/nhóm task được giao, tiếp tục đến khi xong toàn bộ scope; không kết thúc lượt hoặc xuất báo cáo cuối sau mỗi task/sửa plan. Giữ bàn giao nội bộ, chỉ cập nhật tiến độ ngắn; tổng hợp một lần theo [mandatory-report](./mandatory-report.md). Có blocker cần người dùng thì báo đúng blocker, không nhận hoàn thành hoặc tự hạ tiêu chí nghiệm thu.

Khi người dùng giao triển khai/sửa code, giao vai trò `coding-agent` theo task và phạm vi đã được cho phép; không cần command riêng. Đọc vai trò [`coding-agent`](../agents/coding-agent.md).

- Nếu người dùng yêu cầu triển khai theo plan mà không chỉ định task cụ thể, đọc `docs/plans/index.json`, tìm theo title/description/tags, mở plan JSON liên quan qua `path`, rồi đọc task `TODO`/`IN_PROGRESS`, `filesToChange` và dependency — triển khai đúng task được giao theo thứ tự dependency.
- Đọc toàn bộ rule hiện có trong [`rules/`](../rules), áp dụng phần liên quan; không tự ý mở rộng phạm vi, refactor ngoài task hoặc thêm tính năng.
- Chỉ sửa component/page/module và hành vi cần thiết cho yêu cầu hoặc task đã duyệt; bảo toàn các hành vi đang hoạt động ngoài phạm vi. Nếu muốn/ cần thay đổi ngoài phạm vi, dừng phần đó và xin người dùng chấp thuận trước, nêu rõ file và tác động. Tiếp tục phần độc lập đã được giao.
- Trước khi bàn giao, đối chiếu từng file/hunk của diff với yêu cầu; bỏ thay đổi do mình tạo không thuộc phạm vi. Không coi dọn dẹp, đồng bộ UI hoặc test pass là sự cho phép mở rộng.
- Trên luồng bị ảnh hưởng, kiểm tra N+1 xuyên stack: API call lặp theo item ở frontend và query/lazy-load lặp theo record ở backend/ORM (Laravel/Eloquent, EF/SQL hoặc công nghệ tương ứng); đếm query/request bằng công cụ sẵn có hoặc ghi rõ chỉ kiểm tra tĩnh. Kiểm tra thêm render/state/effect loop trên framework đang dùng. Chỉ sửa lỗi do thay đổi hiện tại gây ra hoặc nằm trong yêu cầu; lỗi cũ ngoài phạm vi phải báo vị trí/tác động và xin chấp thuận trước.
- Chỉ sau khi coding xong toàn bộ task của plan, tạo testcase cấp repo đúng vị trí/định dạng/index đã quy định ở [`rules/docs-sync`](./docs-sync.md) (không lặp lại chi tiết ở đây).
- Sau khi code xong: chạy test/lint liên quan, kiểm tra README/CLAUDE.md/docs có đoạn nào nhắc tới phần vừa đổi mà giờ sai không — có thì cập nhật luôn (dùng skill `docs` nếu phạm vi lớn/không chắc hết chỗ — [`rules/docs-sync`](./docs-sync.md)), rồi xuất báo cáo thay đổi (skill `report`), không tự chạy review/commit nếu chưa được giao; không hỏi lại quyền đã có trong phiên.
