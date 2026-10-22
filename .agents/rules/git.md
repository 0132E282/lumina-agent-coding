---
trigger: model_decision
description: "Áp dụng khi nhiệm vụ liên quan: 📦 Git — Commit, Push, Pull Request và Conflict"
---

# Git — authorization và conflict safety

- Tuyệt đối không commit/push/deploy khi chưa có lệnh rõ trong lượt hiện tại; hoàn tất code không cấp quyền Git mutation.
- Commit có ý nghĩa; workflow `commit` mặc định commit all (toàn bộ thay đổi hợp lệ trong repo, trừ file cấm), chỉ commit riêng thay đổi của task (`commit change`) khi người dùng chọn rõ; commit không tự cấp quyền push.
- Không commit/push secret, file tạm/rác/debug hoặc test thử nghiệm; phải rà staged diff và toàn bộ lịch sử sắp push, không dựa vào `.gitignore`.
- Push theo tính năng mặc định hoặc push hết khi người dùng nói rõ; cả hai đều loại file cấm.
- Commit message phải theo Conventional Commits, title tối đa 75 ký tự và body ưu tiên lý do.
- Trước xử lý conflict hoặc tạo/cập nhật PR: `git fetch` đúng remote/nhánh, chốt SHA và merge-base, kiểm tra conflict với đích thực tế và đọc cả hai phía; không `git pull` mù làm merge/rebase ngoài thao tác được giao; fetch không có nghĩa là đã tích hợp code; fetch thất bại thì báo chưa cập nhật, không dùng ref cũ như mới.
- Resolve theo từng hunk, xác định phía người dùng/incoming bằng SHA/diff và scope task (không theo nhãn ours/theirs, tên nhánh, timestamp, tác giả): phần người dùng không sửa nhận incoming, phần đã sửa và xung đột giữ bản người dùng, giữ incoming không xung đột, không chọn nguyên file; chỉ gộp phần bắt buộc, không kéo logic ngoài scope. Có thay đổi chưa commit thì không stash/reset/ghi đè mà hỏi; thiếu căn cứ hoặc có nguy cơ mất logic thì hỏi trước.

Quy trình commit/push/PR/conflict và checklist: [`git-workflow`](../skills/git-workflow/SKILL.md); runtime entry point: [`workflow-git`](../skills/workflow-git/SKILL.md).
