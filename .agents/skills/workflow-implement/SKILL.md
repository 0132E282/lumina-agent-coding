---
name: workflow-implement
description: "Triển khai code bằng agent coder theo task cụ thể hoặc plan JSON trong docs/plans/"
---

# workflow-implement

Khi người dùng giao triển khai code, áp dụng rule bắt buộc [orchestration](../../rules/orchestration.md) và rule chung [implementation](../../rules/delivery.md#triển-khai-theo-yêu-cầu): phiên chính giao [coder](../../agents/coder.md) triển khai; không cần command implement hoặc agent trung gian. Skill này là cách gọi trực tiếp cùng rule, không duy trì quy trình riêng. Mỗi phiên coding dùng một agent `coder` riêng tên `coding - <việc đang làm>` (nhiều repo thì `coding - <repo> - <việc đang làm>`); phiên chính không tự viết code. Khi scope và quyền đã đủ, `coder` triển khai và kiểm chứng code ngay trong lần giao việc đó, không chỉ trả phân tích, đề xuất hoặc yêu cầu phiên chính code tiếp. Input mới (ảnh, yêu cầu, lỗi) thì phiên chính tự xét có liên quan/ảnh hưởng agent nào đang chạy không, không hỏi người dùng: có thì gửi vào agent tương ứng (`SendMessage`), không liên quan thì tạo ngay agent đúng role, không chờ agent khác xong. Triển khai plan JSON thì mỗi nhóm trong `content.codingGroups` một agent `coder` riêng (`coding - <tên nhóm>`), chạy theo `dependsOnGroups`; chỉ nhóm không phụ thuộc và không trùng file mới chạy song song. Tái dùng plan/handoff còn hợp lệ, giữ scope/checks/report theo nguồn và quyền thực tế của runtime.
