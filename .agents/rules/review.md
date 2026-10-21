# Review — độc lập, có bằng chứng, không sửa

- Review chỉ đọc, phân tích và báo cáo; không tự sửa code/plan/testcase đang review, không đăng comment PR hay lưu artifact khi chưa được yêu cầu (`--comment`/`--file`).
- Chốt scope/SHA/file trước khi review; mọi finding có vị trí `file:dòng`, bằng chứng, tác động, đề xuất sửa và cách kiểm chứng. Phân biệt lỗi xác nhận, nghi vấn và khuyến nghị; không áp sở thích cá nhân thành lỗi.
- Code review luôn gồm logic/yêu cầu, Big O/N+1 và bảo mật trong scope, kể cả khi người dùng không yêu cầu riêng; báo độ bao phủ checklist và phần chưa đọc/chưa chạy.
- Thay đổi sửa bug phải đối chiếu [`rules/bug-fix`](./bug-fix.md): nguồn gốc lỗi và nguyên nhân gốc có bằng chứng, regression test tái hiện đúng lỗi, không che triệu chứng, không tắt test hoặc đổi expected trái đặc tả; bug UI phải có ảnh trước/sau cùng route/viewport.
- Chỉ chạy check ở chế độ không sửa file; không ghi Pass cho kiểm tra chưa chạy, không giả lập kết quả tool/review.

Quy trình, checklist và format: [`workflow-review`](../skills/workflow-review/SKILL.md), [`reviewer-agent`](../agents/reviewer-agent.md), bảo mật: [`review-web-security`](../skills/review-web-security/SKILL.md).
