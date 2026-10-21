---
description: "Xuất lại kết quả task đã có."
argument-hint: "[task/phạm vi]"
---

Xuất báo cáo cho phạm vi: $ARGUMENTS. Không có argument thì dùng task vừa hoàn thành trong repo hiện tại; có argument chỉ dùng kết quả đã có thuộc phạm vi đó. Thiếu dữ liệu thì nêu rõ, không tự chạy task/review/test mới.

Đọc và dùng skill [`report`](../skills/report/SKILL.md), theo rule [`mandatory-report`](../rules/mandatory-report.md). Giữ báo cáo ngắn, kiểm chứng thật. Mặc định trả chat, không tự lưu file/đăng ngoài hoặc commit. Codex dùng `$workflow-report` tương đương.
