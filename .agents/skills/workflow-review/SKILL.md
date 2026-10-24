---
name: workflow-review
description: "Review code theo checklist backend/frontend: cú pháp, rule/codebase, format, code thừa, logic, Big O/N+1 và bảo mật; review diff, snapshot hoặc PR, trả chat mặc định, --comment đăng PR, --file xuất JSON."
---

# workflow-review

Trước bàn giao thay đổi, chạy static analysis phù hợp rồi test tương xứng phạm vi. Kiểm tra final newline trên từng file text đổi bằng `node .agents/hooks/scripts/ensure-final-newline.mjs --check <files...>` nếu script tồn tại (nếu không, kiểm tra byte cuối), sau đó chạy `git diff --check`; lệnh diff một mình không chứng minh final newline. Rà diff, regression, render/state/effect loop và N+1 xuyên stack; đếm query/request khi có công cụ, nếu không ghi rõ chỉ rà tĩnh. Không tự sửa lỗi có sẵn ngoài scope.

Claude không có command `/review` riêng — gõ `/review` dùng thẳng built-in code-review/security-review của Claude Code. Codex dùng `$workflow-review`, Antigravity dùng `/workflow-review`; cả hai đọc skill này làm nguồn, không có file command nào để đọc thêm.

- Không argument: review staged/unstaged diff và code untracked hợp lệ của working tree nhánh hiện tại.
- `repo [.|nhánh]`: review toàn bộ snapshot code tracked tại HEAD hoặc ref chỉ định, không checkout/trộn diff chưa commit.
- `pr [URL|#số]`: review PR tại base/head SHA đã chốt; thiếu target thì tìm PR nhánh hiện tại, nhiều/không có thì hỏi. `#1` nghĩa là PR số 1, không phải quy ước review nhánh.
- `flow <tên/mô tả>` hoặc yêu cầu review một tính năng/luồng/khu vực mà không có diff: không dựa vào diff. Dùng [`system-understanding`](../system-understanding/SKILL.md) đọc toàn bộ phần của dự án liên quan (route → logic → dữ liệu → UI/test/docs), rồi báo cáo hai nhóm: **cần fix** (lỗi, thiếu sót đã có bằng chứng) và **cần làm** (chức năng chưa có hoặc chưa đủ so với yêu cầu/đặc tả). Mỗi mục gọn, đúng chỗ, gồm: `URL` (route/website đang chạy, chỉ khi có UI và đã mở được), `Ảnh chứng` (đường dẫn ảnh thật, chỉ khi chụp được), `Vị trí` (`file:dòng`), `Cần làm` (một câu việc cụ thể tại vị trí đó). Vẫn áp checklist bắt buộc bên dưới (logic, Big O/N+1, bảo mật) và mỗi finding có `Kết quả: Đúng | Sai` theo [`rules/review`](../../rules/review.md). Không im lặng khi diff rỗng, không tự sửa, không tự lên plan; chờ người dùng xem báo cáo rồi mới chuyển sang plan.
- Mặc định trả chat. `pr --comment` cho phép đăng comment vào PR cụ thể; `--file` cho phép lưu JSON theo [template](./assets/review-json-template.json) và cập nhật index. Có thể kết hợp `pr --comment --file` cùng scope/SHA/findings. Không tự đăng/lưu.
- Đối tượng cần review là **plan** hoặc **test case** (không phải code) → dùng agent `reviewer` với tiêu chí riêng cho plan/test case, không áp checklist code bên dưới.
- Yêu cầu **security review chuyên sâu** (lỗ hổng, xác thực/phân quyền, upload, thanh toán...) → chạy đủ quy trình [`review-web-security`](../review-web-security/SKILL.md); review thường vẫn áp checklist bảo mật của skill đó cho phần áp dụng như mục bên dưới.

Dùng agent `reviewer` khi runtime hỗ trợ delegation; thiếu thì làm tuần tự cùng scope và báo giới hạn. Ngoài built-in `/review` của Claude Code, không dùng plugin/tool review ngoài (OCR hay tương đương) — dùng `reviewer` hoặc tự thực hiện cùng checklist dưới đây. Giữ vai trò chỉ review, không sửa artifact. JSON finding có `id`, `severity` (`CRITICAL|WARNING|SUGGESTION|GOOD`), `location`, `evidence`, `impact`, `recommendation`, `verification`, `bigO` khi áp dụng. Verification ghi lệnh/bằng chứng/kết quả thật; chưa chạy ghi `Not Run`. Không để placeholder template trong report đã xuất; null chỉ dùng cho field không áp dụng/chưa xác định và ghi giới hạn.

Không giả lập review/comment/tool; trả kết quả bằng skill `report`. Security review giữ field chuyên biệt của template security khi cần bổ sung.

## Checklist bắt buộc cho code review

- Đọc và thực hiện [checklist backend/frontend](./references/code-review-checklists.md). Áp dụng phần chung và từng tầng có trong scope; thay đổi full stack phải kiểm tra cả hai và luồng nối frontend → API → database. Plan/testcase dùng tiêu chí riêng của reviewer.
- Đối chiếu cú pháp/type, convention codebase, từng rule liên quan, cấu hình formatter/linter và code thừa với bằng chứng thật; dùng công cụ có sẵn ở chế độ check, không tự sửa/cài package.
- Dùng [complexity-performance](../complexity-performance/SKILL.md) cho mọi luồng phụ thuộc dữ liệu và [database](../database/SKILL.md) khi có query; đánh giá time/space, số query/API/I/O, N+1 và giới hạn tài nguyên. Không cần có lỗi hiệu năng mới báo Big O.
- Luôn dùng [review-web-security](../review-web-security/SKILL.md) và checklist bảo mật của skill đó cho phần áp dụng; không chờ người dùng yêu cầu security review riêng. Báo toàn bộ phát hiện có bằng chứng trong scope, không dừng ở vài lỗi đầu hoặc giấu lỗi mức thấp.
- Báo độ bao phủ từng ID checklist, bằng chứng và lý do cho `Đã kiểm tra` / `Lỗi xác nhận` / `Không áp dụng` / `Chưa kiểm tra`. Ghi phần chưa truy cập/chưa chạy; không tuyên bố đã tìm hết lỗ hổng. Trả findings kỹ thuật theo template review và findings bảo mật theo template security, không mất field chuyên biệt; gộp cùng nguyên nhân nhưng giữ mọi vị trí/đường đi bị ảnh hưởng.
- Với `--file`, lưu độ bao phủ tại `content.checklistCoverage`, đánh giá Big O tại `content.complexityAssessments`; findings bảo mật giữ đủ chín field của template security và severity bảo mật riêng với severity review chung.
  - Coverage: `id`, `status`, `locations`, `evidence`, `reason`; dùng ID/trạng thái trong checklist, không để mục áp dụng bị thiếu mà không giải thích.
  - Complexity: `location`, `flow`, `inputs`, `time`, `space`, `queryCount`, `apiCount`, `io`, `preprocessing`, `evidence`, `proposed`, `limitations`; `proposed` là null nếu không đề xuất tối ưu, không bịa số đo.
  - Security finding: giữ field review chung, thêm `category: security`, `securitySeverity`, `verdict` (`Đúng`/`Sai`), `rootCause`, `preconditions`, `reproduction`, `affectedScope`, `regressionTests`, `cweOwasp`; mapping chưa xác minh dùng null và ghi lý do. Severity review và severity bảo mật đánh giá độc lập theo template tương ứng.
