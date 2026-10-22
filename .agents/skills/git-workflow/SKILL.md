---
name: git-workflow
description: "Thực thi quy tắc git (rules/git.md): commit, push, PR, resolve conflict; commit chỉ khi có lệnh rõ ràng, message Conventional Commits tối đa 75 ký tự, format Prettier, check conflict. Dùng ngay trước git commit, git push, tạo hoặc cập nhật PR, resolve conflict; có validate-commit-message.sh."
license: MIT
metadata:
  version: "1.4"
---

# 🔧 Git Workflow

Skill gatekeeper bắt buộc cho **commit** và **pull request** — hành động git có thể thay đổi lịch sử/chia sẻ trạng thái với người khác. Áp dụng dù đang ở phiên chính hay subagent, độc lập với [`coding-agent`](../../agents/coding-agent.md).

## 1. Trước khi `git commit` ([rules/git](../../rules/git.md))

Riêng `/git` và `$workflow-git` mặc định scope `all`; `change` khi người dùng chọn rõ. Giữ loại trừ file tạm/rác/secret theo rule `git`; mặc định này không cho phép tự push.

1. **Có lệnh rõ ràng từ người dùng chưa?** Chưa có → dừng, không commit, bất kể code đã xong hay chưa.
2. **Gộp đúng phạm vi** — một commit cho toàn bộ thay đổi thuộc scope, không tách vụn. Scope commit: `all` (mặc định của `/git`/`$workflow-git`, mọi thay đổi hợp lệ hiện có) hoặc `change` (chỉ phần liên quan task — khi người dùng chọn rõ, và là mặc định khi commit ngoài hai workflow đó). Push mặc định theo tính năng, push hết khi người dùng nói rõ — **mọi scope đều tuyệt đối không được kèm file tmp/scratch/debug/test thử nghiệm hoặc file rác**. Chạy `git status` rà lại trước `git add`; thấy file rác do mình tạo trong session thì dọn bằng skill [`cleanup-temp-files`](../cleanup-temp-files/SKILL.md) trước, không add vào commit.
3. **Format lại bằng Prettier trước khi commit**: chạy Prettier trên các file đang staged (`git diff --cached --name-only --diff-filter=ACMR`), rồi `git add` lại đúng các file đó để phần format nằm trong cùng commit. Project chưa cài Prettier (không có trong `PATH` và `npx` không resolve được) → bỏ qua, không tự cài khi chưa được yêu cầu.
4. **Conventional Commits**: tiêu đề `<type>: <mô tả ngắn gọn>` (`feat`/`fix`/`refactor`/`docs`/`test`/`chore`/`style`/`perf`/`build`/`ci`), tối đa **75 ký tự**; body liệt kê thay đổi chính, nêu rõ vấn đề được giải quyết.
5. **Chạy script kiểm tra** trước khi commit thật:
   ```bash
   echo "feat: thêm hook tự động format code bằng Prettier sau khi edit" \
     | bash .claude/skills/git-workflow/scripts/validate-commit-message.sh -
   ```
   `exit 0` + `✅` nếu hợp lệ; `exit 1` + lỗi cụ thể nếu sai format hoặc vượt 75 ký tự. Script chỉ kiểm tra format máy kiểm được — phần "why" trong body do người soạn tự đảm bảo theo rule.

## 2. Trước khi `git push`

Trước mọi push, rà toàn bộ lịch sử sắp gửi so với remote đích, không chỉ diff cuối: tmp/scratch/debug/test thử nghiệm, log/output tạm, cache, `.DS_Store`, `.dssc`, backup `.bak`/`.orig` và secret tuyệt đối không được push. Kiểm tra cả file tracked và file thêm rồi xóa trong commit sau; `.gitignore` không đủ. Test chính thức vẫn hợp lệ. Phát hiện vi phạm thì dừng và báo, không tự rewrite lịch sử.

1. **Format lại một lần** các file đã đổi so với remote tracking branch (`git diff --name-only @{upstream}...HEAD`) bằng Prettier, nếu project có cài — tránh đẩy lên code lệch format so với lúc Edit/Write (hook `format-on-edit.sh` format theo từng file sửa, bước này là lượt quét cuối trên toàn bộ diff trước khi push).
2. Prettier format sinh ra thay đổi → đó là thay đổi **chưa commit**; gộp vào đúng commit đang chuẩn bị push (xem mục 1) trước khi push, không để lại format fix trôi sang lần sau.
3. Project chưa cài Prettier (không có trong `PATH` và `npx` không resolve được) → bỏ qua bước này, không tự cài khi chưa được yêu cầu.

Hook [`format-before-push.sh`](../../hooks/scripts/format-before-push.sh) tự chạy bước 1 mỗi lần phát hiện lệnh `git push` và cảnh báo (không chặn) nếu format sinh ra thay đổi chưa commit — xem [`hooks/README.md`](../../hooks/README.md#format-before-push--format-lại-trước-khi-push).

## 3. Trước khi tạo Pull Request / khi gặp conflict ([rules/git](../../rules/git.md))

1. Trước khi tạo PR hoặc xử lý conflict, cập nhật ref remote bằng fetch đúng remote/nhánh, chốt SHA/merge-base rồi kiểm tra conflict với đích thực tế. Không pull mù quáng làm tích hợp ngoài quyền được giao; network thất bại thì báo chưa cập nhật.
2. Có conflict: **đọc cả hai phía** (`<<<<<<<`/`=======`/`>>>>>>>`) trước khi quyết định — không xóa trắng một bên mà không xem nội dung.
3. Xác định phía chứa thay đổi của người dùng, incoming và merge-base bằng SHA/diff; không suy từ nhãn ours/theirs (đặc biệt rebase/cherry-pick). Phần người dùng không sửa nhận incoming/remote; phần đã sửa và conflict ưu tiên bản người dùng, kể cả conflict format. Giữ thay đổi incoming không xung đột, không chọn toàn bộ file mù quáng.
4. Thiếu căn cứ xác định thay đổi người dùng hoặc có thể mất logic quan trọng ngoài scope thì hỏi trước phần đó. Dirty working tree/index phải được bảo vệ, không tự stash/reset/ghi đè.
5. **Không tự ý kéo thêm logic từ nhánh đích vào nhánh nguồn** ngoài phần bắt buộc phải gộp để resolve conflict — kể cả khi thấy nhánh đích có tính năng/fix "có vẻ nên có". Người dùng chỉ giao task trên nhánh nguồn; thấy thiếu gì từ nhánh khác thì báo và hỏi, không tự quyết gộp vào.
6. Resolve xong, chạy lại test/lint liên quan trước khi coi là hoàn tất.

## Checklist

**Commit**: có lệnh rõ ràng từ người dùng · đã chạy Prettier trên file staged (nếu project có cài) · đã gộp đúng scope (`all` hoặc `change` — không trộn lẫn) · không có file tmp/test/rác lẫn vào · tiêu đề đúng format `<type>: <mô tả>` ≤ 75 ký tự · body nêu rõ vấn đề được giải quyết · đã chạy `validate-commit-message.sh` và nhận `✅`.

**Push**: đã format lại diff so với remote bằng Prettier (nếu project có cài) · không còn thay đổi format nào trôi ra ngoài commit đang push.

**Pull Request**: ref remote đã cập nhật và SHA/merge-base đã chốt · đã đọc cả hai phía · hunk người dùng không sửa nhận incoming, hunk đã sửa ưu tiên bản người dùng · giữ incoming không xung đột và scope được giao · đã chạy lại test/lint sau resolve.
