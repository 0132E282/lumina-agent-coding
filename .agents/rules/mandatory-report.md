---
trigger: model_decision
description: "Hoàn thành task có kết quả cụ thể: dùng skill report, mặc định ngắn gọn"
---

# Báo cáo bắt buộc

- Mọi agent, kể cả phiên chính tự sửa cấu hình/docs, phải dùng [report](../skills/report/SKILL.md) khi hoàn thành task có thay đổi/kết quả cụ thể.
- Được giao toàn bộ plan/nhóm task coding → chỉ gửi **một báo cáo tổng hợp cuối** khi tất cả task trong scope đạt DONE và kiểm chứng bắt buộc có bằng chứng. Không gửi change report riêng sau từng task, sửa approach/plan hoặc nhận bàn giao. Trong lúc làm chỉ cập nhật tiến độ ngắn, tự tiếp tục task kế tiếp đã được phép, không dừng chờ “làm tiếp”.
- Subagent vẫn bàn giao kết quả/kiểm chứng nội bộ cho agent điều phối; không chuyển nguyên văn từng bàn giao thành báo cáo cuối cho người dùng. Chỉ được giao một task cụ thể thì báo cáo khi task đó xong, không tự mở rộng sang toàn plan.
- Còn TODO/IN_PROGRESS, AC chưa đạt hoặc check bắt buộc Fail/Blocked/Not Run thì không tuyên bố hoàn thành. Lỗi môi trường có sẵn không biến test thành Pass; tiếp tục phần độc lập được phép. Cần dữ liệu/quyền/quyết định để đi tiếp thì chỉ báo blocker cụ thể và việc cần giải quyết, không dùng báo cáo hoàn tất; không tự seed DB, bỏ check hoặc đổi scope/AC để đánh dấu DONE. Testcase repo chỉ được yêu cầu thiết kế `Not Run` không phải check bắt buộc phải thực thi.
- Chọn đúng loại từ kết quả đã có; report không thay thế review, phân tích hay kiểm thử.
- Báo cáo thay đổi theo [template nguồn chuẩn](../skills/report/assets/change-report-template.md): mỗi file có `Path`, chỉ nhóm hành động thực tế, không dùng bảng, `Title` hoặc `Description`.
- Mặc định ngắn gọn: thay đổi chính, kiểm chứng, giới hạn và đánh giá; Big O ghi trong mục từng file (tiếng Anh, chỉ khi có code phụ thuộc dữ liệu; không có thì bỏ dòng) và giữ field chuyên biệt khi áp dụng. Chỉ thêm giải thích sâu/code cũ-mới khi được yêu cầu.
- Không áp dụng cho trả lời câu hỏi/tra cứu đơn thuần không có kết quả cần báo cáo.
