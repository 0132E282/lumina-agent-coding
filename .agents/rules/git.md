---
trigger: model_decision
description: "Áp dụng khi nhiệm vụ liên quan: 📦 Git — Commit, Push, Pull Request và Conflict"
---

# 📦 Git — Commit, Push, Pull Request và Conflict

# Git — authorization và conflict safety

- Tuyệt đối không commit/push khi chưa có lệnh rõ trong lượt hiện tại; hoàn tất code không cấp quyền Git mutation.
- Commit theo đúng scope được giao, có ý nghĩa; workflow `commit` mặc định commit all nhưng không tự cấp quyền push.
- Không commit/push secret, file tạm/rác/debug hoặc test thử nghiệm; phải rà staged diff và toàn bộ lịch sử sắp push, không dựa vào `.gitignore`.
- Push theo tính năng mặc định hoặc push hết khi người dùng nói rõ; cả hai đều loại file cấm.
- Commit message phải theo Conventional Commits, title tối đa 75 ký tự và body ưu tiên lý do.

- Trước xử lý conflict với remote, lấy ref mới nhất bằng `git fetch` đúng remote/nhánh, chốt SHA trước/sau và merge-base. Không chạy `git pull` mù quáng làm merge/rebase ngoài thao tác được giao; fetch không đồng nghĩa đã tích hợp code. Lấy dữ liệu thất bại thì báo chưa cập nhật, không dùng ref cũ như mới.
- Ưu tiên theo thay đổi của người dùng so với merge-base, ở từng file/hunk: phần người dùng **không thay đổi** nhận bản incoming/remote; phần người dùng **đã thay đổi** và xung đột giữ bản người dùng. Giữ các thay đổi incoming không xung đột. Dùng diff/SHA làm căn cứ, không suy từ tên nhánh, timestamp hoặc tác giả commit; không chọn nguyên file ours/theirs nếu làm mất hunk độc lập.
- Trước tích hợp, xác định rõ phía chứa thay đổi của người dùng và phía incoming bằng SHA và scope task. Nếu có thay đổi chưa commit thì bảo vệ working tree/index và hỏi cách xử lý; không tự stash/reset/ghi đè. Trong rebase/cherry-pick, ours/theirs có thể khác ý nghĩa so với merge; không dùng nhãn đó thay cho xác định nội dung. Không đủ căn cứ về phía/thay đổi thì hỏi trước resolve.
- Trước tạo/cập nhật PR phải kiểm tra conflict; đọc cả hai phía, chỉ gộp phần bắt buộc để hết conflict và không kéo thêm logic ngoài scope. Có nguy cơ mất logic hoặc thiếu căn cứ phải hỏi.

Quy trình commit/push/PR/conflict và checklist: [`git-workflow`](../skills/git-workflow/SKILL.md); runtime entry point: [`workflow-git`](../skills/workflow-git/SKILL.md).
