---
trigger: model_decision
description: "Áp dụng khi review code, plan, testcase hoặc PR"
---

# Review — độc lập, có bằng chứng, không sửa

- Review chỉ đọc, phân tích và báo cáo; không tự sửa code/plan/testcase đang review, không đăng comment PR hay lưu artifact khi chưa được yêu cầu (`--comment`/`--file`).
- Chốt scope/SHA/file trước khi review; mọi finding có vị trí `file:dòng`, bằng chứng, tác động, đề xuất sửa và cách kiểm chứng. Không áp sở thích cá nhân thành lỗi.
- Mỗi finding có `Kết quả: Đúng | Sai`, không có loại khác: `Đúng` = lỗi có thật, đã chứng minh bằng bằng chứng; `Sai` = đã kiểm và không phải lỗi. Chưa đủ bằng chứng thì kiểm thêm; vẫn không kết luận được thì không đưa vào finding mà ghi ở phần chưa kiểm/giới hạn.
- Code review luôn gồm logic/yêu cầu, Big O/N+1 và bảo mật trong scope, kể cả khi người dùng không yêu cầu riêng; báo độ bao phủ checklist và phần chưa đọc/chưa chạy.
- Thay đổi sửa bug phải đối chiếu đủ các yêu cầu trong [`rules/bug-fix`](./bug-fix.md).
- Chỉ chạy check ở chế độ không sửa file; không giả lập kết quả tool/review.

Quy trình, checklist và format: [`workflow-review`](../skills/workflow-review/SKILL.md), [`reviewer`](../agents/reviewer.md), bảo mật: [`review-web-security`](../skills/review-web-security/SKILL.md).
