---
description: Mặc định commit all; merge/conflict và tạo PR về nhánh gốc hoặc nhánh đích chỉ định
argument-hint: "[commit [all|change] | merge nguồn [into đích] | pr [into đích] [from nguồn] | main [tên repo] [into current|main] [from nguồn] | help]"
---

Thực hiện thao tác Git được chỉ định: $ARGUMENTS. Đọc skill [`git-workflow`](../skills/git-workflow/SKILL.md) và rule liên quan trước khi thay đổi Git.

## Chọn thao tác

- `/git`, `/git commit` hoặc `/git commit all [ghi chú]`: commit toàn bộ thay đổi hợp lệ trong repository đang làm việc; `all` là scope mặc định. Đây là yêu cầu commit rõ ràng khi người dùng thực sự gọi command, không phải khi chỉ yêu cầu sửa tài liệu command này.
- `/git commit change [ghi chú]`: chỉ commit thay đổi thuộc task hiện tại khi chỉ định rõ `change`.
- `/git merge <nhánh-nguồn> [into <nhánh-đích>]`: merge nhánh nguồn vào nhánh đích, mặc định nhánh đang checkout lúc gọi command; xử lý conflict theo quy tắc và kiểm chứng trước khi hoàn tất. Đây là merge Git local, không phải lệnh tạo PR.
- `/git pr [into <nhánh-đích>] [from <nhánh-nguồn>]`: lệnh viết tắt tạo/cập nhật pull request trong repo hiện có. Source mặc định nhánh đang checkout; base theo thứ tự ưu tiên ở mục Chọn base cho PR. `into` chỉ rõ tên nhánh thì dùng tên đó; `into main` nghĩa là nhánh chính thực tế, `into current` nghĩa là nhánh đang đứng và cần source khác.
- `/git main [tên repo] [into current|main] [from nhánh-nguồn]`: chuẩn bị repository nếu chưa có, sau đó tạo/cập nhật PR. Tên repo chỉ dùng để chọn/tạo repository, không phải tên nhánh. Repo đã có thì tái sử dụng; tên được truyền không khớp remote thì hỏi trước khi đổi đích. Tạo repo không tự cho phép commit/push hoặc merge.
- `into main` (mặc định): base là nhánh chính thực tế của remote, lấy từ metadata GitHub hoặc `origin/HEAD`; không xác định được thì hỏi, không đoán tên `main`/`master`. Source mặc định là nhánh đang checkout, hoặc nhánh được chỉ định bằng `from`.
- `into current`: base là nhánh đang checkout tại thời điểm gọi command. Source lấy từ `from`; thiếu thì hỏi nhánh nguồn trước khi tạo/cập nhật PR. Không tự chuyển nhánh để suy ra source/base; detached HEAD thì hỏi nhánh đích cụ thể.
- `/git help`: hiện cú pháp và trạng thái repo, không tự commit, tạo repo hoặc merge.

Mỗi lần chỉ chọn một chế độ (`commit`, `merge`, `pr`, `main` hoặc `help`); không có argument thì chọn `commit all`. `from` dùng với `pr`/`main`; `into` dùng với `pr`/`main`/`merge`. Với `main`, `into` nhận `current`/`main`; các chế độ khác nhận nhánh đích cụ thể. Cú pháp lạ hoặc kết hợp nhiều chế độ thì báo hướng dẫn và dừng. Không dùng tiền tố `--` cho cú pháp command này; option của Git/gh thật vẫn giữ cú pháp công cụ. Không nội suy `$ARGUMENTS` thành shell code; truyền tên repo/nhánh/path dưới dạng argument riêng.

## Commit

1. Kiểm tra repo/nhánh, `git status`, staged diff và unstaged diff. `all` vẫn loại secret, file rác và scratch theo rule; `change` không gộp sửa đổi ngoài task. Nếu index chứa thay đổi ngoài scope, giữ nguyên index đó và chỉ commit đúng scope bằng cách an toàn; không âm thầm commit hoặc unstage phần của người khác. Scope chưa xác định được thì hỏi trước khi stage.
   Tuyệt đối không commit/push file tmp/scratch/debug/test thử nghiệm, log/output tạm, cache, `.DS_Store`, `.dssc`, file backup `.bak`/`.orig` hoặc secret. Xác định bằng nội dung/mục đích và rule project; không cấm toàn bộ `tests/` hoặc `*.test.*` vì test chính thức là deliverable. Stage bằng danh sách path đã rà, không `git add .`/`git add -A` mù quáng. Kiểm tra lại staged diff trước commit, kể cả file đã tracked; `.gitignore` không bảo vệ file tracked. File không rõ có phải rác thì giữ ngoài commit và hỏi, không tự xóa.
2. Một commit cho toàn bộ thay đổi liên quan, không tách vụn. Không có thay đổi hợp lệ thì báo và dừng.
3. Trước khi commit, chạy Prettier trên các file đang staged (`git diff --cached --name-only --diff-filter=ACMR`) rồi `git add` lại đúng các file đó; project chưa cài Prettier thì bỏ qua, không tự cài.
4. Message Conventional Commits, tiêu đề `<type>: <mô tả>` ≤ 75 ký tự, body nêu vấn đề và thay đổi chính. Chạy script [`validate-commit-message.sh`](../skills/git-workflow/scripts/validate-commit-message.sh), chỉ commit khi validator đạt.
5. Việc gọi `commit` cho phép tạo commit đúng scope, không tự push/tạo PR/merge. Báo hash, nhánh và file đã commit.

## Merge local và xử lý conflict

1. Chốt source và target; target mặc định là nhánh checkout lúc gọi command, không mặc định nhánh chính. Detached HEAD hoặc thiếu source thì hỏi. Xác nhận ref tồn tại, source khác target, working tree/index sạch và không có merge/rebase khác đang chạy. Không tự stash, reset hoặc ghi đè thay đổi hiện có. Nếu đích được chỉ định khác nhánh đang đứng, chỉ switch sau khi các kiểm tra này đạt.
2. Nếu có remote liên quan, fetch đúng ref mới trước merge, chốt SHA source/target và merge-base rồi rà incoming diff, phạm vi file, file tạm/rác/secret theo mục Commit. Không nhận ref remote cũ là mới nhất hoặc pull mù quáng. Fetch không tự thay thế nhánh local được chỉ định bằng remote branch hay tích hợp ngoài source/target được giao. Thực hiện merge source vào target bằng Git; việc người dùng gọi `merge` cho phép merge và merge commit cần thiết, không cho phép push hoặc tạo commit ngoài merge. Yêu cầu chỉnh workflow này không phải lời gọi thực hiện merge.
3. Có conflict thì đọc cả source/target và diff từ merge-base theo từng hunk: phần người dùng không sửa nhận incoming, phần người dùng đã sửa ưu tiên bản người dùng; giữ incoming không xung đột. Xác định phía người dùng bằng scope/SHA, không mặc định là source/target hoặc ours/theirs. Thiếu căn cứ hoặc có thể mất logic quan trọng ngoài phạm vi thì giữ conflict, báo file/tác động và hỏi; không tự abort/reset.
4. Sau resolve, rà marker còn sót, từng hunk, chạy check phù hợp với các file/hành vi bị ảnh hưởng rồi stage riêng file đã resolve và hoàn tất merge. Với merge không conflict cũng chạy check liên quan trước khi báo hoàn tất. Check thất bại thì báo trạng thái thật; không push, tự rollback hoặc kết luận merge đạt. Không dùng commit all để gộp phần không thuộc merge. Báo source/target, SHA, file conflict đã xử lý, checks và merge commit hoặc fast-forward thực tế.

## Chuẩn bị repository cho `main`

1. Kiểm tra project đã nằm trong repo nào, remotes và repository đích đã tồn tại chưa. Có repo/remote phù hợp thì tái sử dụng và chuyển sang bước PR. Không tạo nested repo, ghi đè remote hay tái tạo repo đã có. Thiếu repo/remote thì hỏi thông tin còn thiếu về tên, owner, nơi tạo local/GitHub và visibility trước bước phụ thuộc; nếu chỉ chọn local và chưa có remote hỗ trợ PR thì báo phần PR chưa thể thực hiện.
2. Với local repo, dùng `git init` theo nhánh chính được chỉ định hoặc cấu hình Git hiện có. Với GitHub, kiểm tra `gh auth status`, owner/tên/visibility và quyền truy cập trước khi tạo bằng `gh repo create`; không dùng `--push` khi chưa có yêu cầu push.
3. Tạo đúng repo đã xác định, kết nối remote chỉ khi thuộc phạm vi yêu cầu; báo URL/path và nhánh. Không bịa repo đã tạo khi tool thất bại; không yêu cầu token trong chat.
4. Repo mới cần commit nền, nhánh nguồn và diff để tạo PR. Nếu chưa đủ thì báo bước còn thiếu, hỏi quyền commit/push hoặc tạo nhánh cần thiết; không tự tạo commit rỗng hay PR giả. Tiếp tục bước PR khi đủ điều kiện và quyền.

## Chọn base cho PR

Áp dụng cho `pr`; `main` vẫn chọn nhánh chính hoặc `current` được chỉ định theo cú pháp đã có. Chốt và báo source → base cùng căn cứ trước khi tạo PR:

1. Nhánh đích người dùng chỉ định qua `into` hoặc yêu cầu rõ có ưu tiên cao nhất.
2. Nếu source đã có PR phù hợp thì giữ base của PR đó; nhiều PR/base thì hỏi chọn, không tự retarget.
3. Nếu có bằng chứng đáng tin về nhánh gốc nơi source được tạo (metadata project/branch đã ghi rõ hoặc reflog còn đủ căn cứ), tạo PR về nhánh gốc đó. Nhánh tách từ `developer`/`develop` thì vào chính nhánh đó; tách từ nhánh khác thì vào nhánh khác đó. Git không luôn lưu tên nhánh cha; upstream tracking hoặc việc hai nhánh có chung ancestor không tự chứng minh nhánh gốc. Không đoán nguồn chỉ từ tên nhánh.
4. Không có nhánh gốc xác định: ưu tiên nhánh phát triển thực tế `developer` hoặc `develop` nếu tồn tại. Nếu cả hai có và project chưa quy định nhánh tích hợp thì hỏi chọn. Không có nhánh phát triển thì dùng nhánh chính thực tế của remote; không tự hardcode `main`/`master`.
5. Base đã bị xóa, ref thiếu, metadata mâu thuẫn hoặc source bằng base thì hỏi nhánh đích/nguồn khác; không tạo PR vào chính nó hoặc tự tạo branch để che thiếu thông tin.

## Pull request và merge

1. Xác định source/base theo `from` và `into` trước khi tạo/cập nhật PR; kiểm tra remote, commit chưa push và PR hiện có khớp cặp source/base này. Source bằng base thì báo không thể tạo PR từ một nhánh vào chính nó; không tự chuyển nhánh hoặc reset lịch sử. Không tự đổi base của một PR hiện có không khớp yêu cầu; hỏi trước khi retarget.
2. Fetch đúng remote/base/source trước kiểm tra conflict, chốt SHA/merge-base; chưa lấy được dữ liệu mới thì báo chưa kiểm chứng, không coi ref cũ là cập nhật. Resolve theo `git-workflow`: đọc cả hai phía và diff so với merge-base; phần người dùng không sửa nhận incoming/remote, phần đã sửa conflict giữ bản người dùng, giữ incoming không xung đột trong thao tác được giao. Nghi ngờ mất fix ngoài phạm vi hoặc chưa rõ phía người dùng thì hỏi. Sau resolve chạy check liên quan.
3. Nếu phải push để tạo PR, nêu source/remote và xin quyền push nếu phiên chưa cho phép. Trước push rà toàn bộ commit sẽ gửi so với remote đích, không chỉ working tree hoặc commit cuối: tuyệt đối không gửi file tạm/rác/secret đã liệt kê ở mục Commit, kể cả file thêm rồi xóa trong một commit sau. Phát hiện file cấm trong lịch sử chuẩn bị push thì dừng và báo; không tự rewrite lịch sử. Thực hiện bước format của `git-workflow` bằng formatter đã có, không tự tải package. Không force push.
4. Tạo/cập nhật PR với title/body phản ánh diff cuối, truyền rõ head/source và base đã chốt theo chế độ gọi. Dùng body-file hoặc argument có cấu trúc để giữ newline; báo URL PR, source/base và kết quả checks/conflict thực tế.
5. **Sau khi PR cụ thể đã tạo/cập nhật và kiểm chứng**, hỏi người dùng có merge PR đó vào base hay không, kèm URL, source/base và kết quả checks. Chỉ merge khi có xác nhận rõ, checks bắt buộc đạt và không conflict; kiểm tra lại trạng thái trước khi merge. Thời gian chờ hoặc không trả lời không phải đồng ý. Không bypass checks hay xóa branch nếu chưa được yêu cầu.

Với `main`, chạy tuần tự chuẩn bị repo → PR → hỏi merge; repo đã sẵn sàng thì bỏ qua bước tạo. Hoàn thành thì báo bằng skill `report`; không tự chuyển từ `commit` sang `main`.
