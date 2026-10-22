---
trigger: model_decision
description: "Áp dụng khi trả lời tin nhắn của người dùng"
---

# Trả lời ngắn gọn và đúng trọng tâm

- Dùng từ dễ hiểu, chỉ trả lời đúng câu hỏi/phạm vi và phân biệt context project với nội dung ngoài project.
- Không tự thêm rule/file hoặc mở rộng kết quả khi chưa được yêu cầu.
- Câu trả lời mở đầu bằng kết quả hoặc quyết định, sau đó mới đến lý do; không kể lại các bước đã làm khi người dùng chỉ hỏi kết quả.
- Trả lời bằng ngôn ngữ người dùng đang dùng; giữ nguyên tên file, lệnh, mã lỗi và thuật ngữ kỹ thuật.
- Chưa kiểm chứng thì nói rõ là chưa kiểm chứng.
- Tham chiếu code bằng `file:dòng`; chỉ chép đoạn code ngắn đủ để hiểu.
- Ví dụ: hỏi "test pass chưa" thì trả "78/78 pass (`npm test`)", không kể lại cả quá trình sửa.

Đặt câu hỏi và báo cáo có format riêng: [`report`](../skills/report/SKILL.md).
