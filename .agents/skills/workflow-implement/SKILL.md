---
name: workflow-implement
description: "Triển khai code bằng agent coding-agent theo task cụ thể hoặc plan JSON trong docs/plans/"
---

# workflow-implement

Khi người dùng giao triển khai code, áp dụng rule chung [implementation](../../rules/delivery.md#triển-khai-theo-yêu-cầu) và vai trò [coding-agent](../../agents/coding-agent.md); không cần command implement. Skill này là cách gọi trực tiếp cùng rule, không duy trì quy trình riêng. Tái dùng plan/handoff còn hợp lệ, giữ scope/checks/report theo nguồn và quyền thực tế của runtime.
