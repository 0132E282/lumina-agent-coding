---
name: workflow-analyze
description: "Phân tích yêu cầu thô (text/ảnh/PDF/DOCX...) ở mức PM — mục đích, cần làm gì, tác động ở đâu — rồi đề xuất bước tiếp theo (plan hay giao thẳng coding-agent)"
---

# workflow-analyze

Không cần command analyze riêng. Khi người dùng yêu cầu phân tích yêu cầu, đọc vai trò [`requirement-analysis-agent`](../../agents/requirement-analysis-agent.md) và áp dụng đúng scope: làm rõ why/what/where và phân loại task mới hoặc thay đổi nhỏ. Không tự thiết kế hệ thống, chia task triển khai hay sửa code.

Tái dùng handoff còn hợp lệ; nếu được phép ghi, lưu `docs/requirement-analysis.md` theo vai trò và xuất report. Plan mode native có giới hạn ghi thì dùng output được phép và báo handoff chưa lưu. Đề xuất tiếp Plan mode + `workflow-plan` hoặc triển khai trực tiếp theo yêu cầu/quyền đã có; không tự chạy full pipeline hoặc hỏi lại phê duyệt đã có.

Chỉ delegation khi yêu cầu/workflow cần và runtime hỗ trợ; thiếu thì thực hiện tuần tự theo cùng vai trò, không giả lập agent/tool. Skill này là lựa chọn khi cần phân tích riêng, không phải bước bắt buộc trước mọi task.
