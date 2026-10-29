---
trigger: always
description: "Bắt buộc phiên chính điều phối task thực thi và giao đúng subagent chuyên trách"
---

# Orchestration — main session điều phối

- Với mọi yêu cầu có **task thực thi** (tạo/sửa artifact, phân tích có đầu ra, lập plan, setup, code, debug, test, review, thiết kế, audit, Git hoặc thao tác hệ thống), phiên chính phải điều phối và giao từng task cho đúng subagent chuyên trách theo [`AGENTS.md`](../../AGENTS.md#choosing-skills-by-task); không tạo agent trung gian chỉ để dispatch.
- Câu trả lời hoặc tra cứu thuần túy không tạo artifact, không thay đổi trạng thái và không cần role chuyên trách thì phiên chính trả lời trực tiếp, không tạo subagent hình thức.
- Phiên chính chốt scope, owner, file/artifact, dependency, acceptance criteria và checks trong prompt giao việc; mỗi task có đúng một owner. Task không phụ thuộc và không trùng file mới chạy song song; task có dependency hoặc trùng file chạy tuần tự.
- Mọi task viết/sửa/refactor code phải giao `coder`; khi scope, quyền và bằng chứng đã đủ, coder triển khai và kiểm chứng ngay trong task được giao, không chỉ phân tích hoặc trả phần code cho phiên chính.
- Input mới trong lúc agent chạy: phiên chính tự xác định task/agent/file bị ảnh hưởng. Có liên quan thì gửi ngay cho agent đó và giữ cùng context; không liên quan thì tạo task/agent đúng role riêng, chỉ chờ khi có dependency bắt buộc.
- Sau handoff, phiên chính kiểm tra đủ artifact, acceptance criteria, checks và giới hạn; thiếu phần thuộc scope thì gửi lại đúng agent hoàn tất. Phiên chính tự chạy lại check bắt buộc trước khi báo cáo.

Quy tắc triển khai: [`delivery`](./delivery.md#triển-khai-theo-yêu-cầu). Mẫu bàn giao: [`handoff`](../skills/report/assets/subagent-handoff-template.md).
