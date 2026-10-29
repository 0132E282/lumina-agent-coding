---
name: "source-command-cleanup"
description: "Làm gọn context agent, giữ mục tiêu/quyết định/tiến độ để tiếp tục đúng phạm vi"
---

# source-command-cleanup

Use this skill when the user asks to run the migrated source command `cleanup`.

## Command Template

Làm gọn thông tin đang dùng của agent để tránh lan man và tiếp tục đúng task. Không quét/xóa file workspace, Git history, cấu hình, memory lâu dài hoặc deliverable. Dọn file tạm vẫn là chức năng riêng của skill `cleanup-temp-files`, không được kích hoạt bởi command này.

1. Tóm tắt một lần context còn hiệu lực: mục tiêu/phạm vi, quyết định và quyền người dùng đã chốt, file/handoff chuẩn, việc đã làm + bằng chứng kiểm chứng, thay đổi đang dở, blocker/câu hỏi cần trả lời và bước tiếp theo. Giữ yêu cầu chưa hoàn tất; không làm mất task hoặc phê duyệt sau khi làm gọn.
2. Bỏ khỏi phần context làm việc các phương án đã bỏ, thông tin lỗi thời, log/dump lặp và suy đoán không liên quan. Dùng path nguồn thay vì chép nguyên file; không đưa secret vào bản tóm tắt, không tự tạo file handoff nếu chưa được yêu cầu lưu.
3. Nếu runtime có cơ chế compact context thực tế và cho phép sử dụng, dùng cơ chế đó với bản tóm tắt; nếu không, trả bản tóm tắt trong chat và dùng nó cho bước tiếp theo. Không tuyên bố đã xóa lịch sử/token/memory hay reset phiên khi chưa có tool thực hiện. Khi người dùng muốn phiên trắng hoàn toàn, cung cấp tóm tắt bàn giao rồi dùng khả năng mở phiên mới của runtime theo yêu cầu; không giả lập thao tác UI.
4. Báo trạng thái thật: đã rút gọn context hay chỉ tạo tóm tắt, mục tiêu/bước tiếp theo giữ lại. Không tự mở rộng task, chạy lại các bước đã kiểm chứng hoặc hỏi lại quyết định còn hiệu lực.
