---
name: workflow-git
description: "Workflow Git chung cho Codex: commit all mặc định, merge và xử lý conflict, hoặc chuẩn bị repo và PR vào nhánh hiện tại/chính."
---

# workflow-git

Đọc workflow nguồn `.claude/commands/git.md`; truyền argument của người dùng vào chế độ tương ứng, giải quyết link từ `.claude/commands/`. Codex dùng `$workflow-git`, Claude dùng `/git`; không giả lập đăng ký slash command Claude trên Codex.

- Không argument hoặc `commit`: `commit all`. `commit change` chỉ khi người dùng chọn rõ.
- `merge <nhánh-nguồn> [into <nhánh-đích>]`: merge local, mặc định vào nhánh đang checkout; xử lý conflict có đủ căn cứ, giữ thay đổi ngoài phạm vi và kiểm chứng trước hoàn tất. Không tự push.
- `pr [into <nhánh-đích>] [from <nhánh-nguồn>]`: tạo/cập nhật PR; ưu tiên đích chỉ định, PR hiện có, nhánh gốc có căn cứ, nhánh phát triển `developer`/`develop`, rồi nhánh chính. Không đoán nhánh cha từ upstream/tên nhánh; source bằng base hoặc có nhiều lựa chọn thì hỏi.
- `main [tên repo] [into current|main] [from nhánh-nguồn]`: chuẩn bị repo và PR, mặc định nhánh chính; hỏi trước merge.
- `help`: chỉ hướng dẫn/trạng thái repo.

Mọi quy tắc còn lại (loại trừ file tạm/rác/secret, validator commit, kiểm tra lịch sử trước push, điểm duyệt merge PR, xử lý conflict theo merge-base) lấy từ workflow nguồn `.claude/commands/git.md` và [`git-workflow`](../git-workflow/SKILL.md); không lặp lại ở đây. Lời yêu cầu sửa workflow này không phải lệnh thực hiện commit/push/merge.
