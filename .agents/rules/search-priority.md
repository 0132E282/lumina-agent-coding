---
trigger: model_decision
description: "Áp dụng khi tìm kiếm, nghiên cứu hoặc đưa ra dữ kiện"
---

# Local-first và không bịa

- Tìm nguồn nội bộ (`CLAUDE.md`, docs, README, code/comment) trước; chỉ mở rộng trong repo rồi ra web khi nội bộ không đủ.
- Dữ kiện quan trọng phải có file path hoặc URL để kiểm chứng.
- Không tìm thấy thì nói rõ; phân biệt dữ kiện đã xác minh, giả định và câu hỏi mở, không trình bày giả định như sự thật.

Quy trình discovery và tổng hợp nguồn: [`system-understanding`](../skills/system-understanding/SKILL.md) và [`researcher-agent`](../agents/researcher-agent.md).
