---
name: workflow-implement
description: "Triển khai code bằng agent coder theo task cụ thể hoặc plan JSON trong docs/plans/"
---

# workflow-implement

Khi người dùng giao triển khai code, áp dụng rule chung [implementation](../../rules/delivery.md#triển-khai-theo-yêu-cầu) và vai trò [coder](../../agents/coder.md); không cần command implement. Skill này là cách gọi trực tiếp cùng rule, không duy trì quy trình riêng. Mỗi phiên coding dùng một agent `coder` riêng tên `coding - <việc đang làm>` (nhiều repo thì `coding - <repo> - <việc đang làm>`); input mới (ảnh, yêu cầu, lỗi) thì tự xét có liên quan/ảnh hưởng agent nào đang chạy không, không hỏi người dùng: có thì gửi vào agent tương ứng (`SendMessage`), không liên quan thì tạo ngay agent riêng, không chờ agent khác xong. Triển khai plan JSON thì mỗi nhóm trong `content.codingGroups` một agent `coder` riêng (`coding - <tên nhóm>`), chạy theo `dependsOnGroups`; chỉ nhóm không phụ thuộc và không trùng file mới chạy song song. Tái dùng plan/handoff còn hợp lệ, giữ scope/checks/report theo nguồn và quyền thực tế của runtime.
