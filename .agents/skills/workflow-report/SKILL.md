---
name: workflow-report
description: "Dùng khi gọi $workflow-report hoặc /report để xuất lại kết quả đã có."
---

# workflow-report

Đọc skill [`report`](../report/SKILL.md) và rule [`mandatory-report`](../../rules/delivery.md#báo-cáo-bắt-buộc), format kết quả/thay đổi đã có theo loại báo cáo đúng. Báo cáo là bước bắt buộc khi task có kết quả, không chờ command report; skill này chỉ là cách gọi riêng khi cần xuất lại kết quả đã có, không thực hiện review mới. Claude dùng `/report`, Codex dùng `$workflow-report`. Code có xử lý runtime thì dùng complexity-performance trước report; config/docs/template thuần túy ghi Big O không áp dụng. Không bịa kiểm chứng.
