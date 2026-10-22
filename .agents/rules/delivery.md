---
trigger: model_decision
description: "Áp dụng khi triển khai, kiểm thử/kiểm chứng và báo cáo hoàn thành task"
---

# Quy tắc triển khai và bàn giao

## Triển khai theo yêu cầu

- Triển khai/sửa code phải theo vai trò [`coder`](../agents/coder.md), đúng task/plan, dependency và file/hành vi đã được duyệt.
- Chỉ yêu cầu người dùng, task/plan đã duyệt và danh sách file/hành vi nêu rõ mới cấp quyền thay đổi; context, diff, suggestion hay lỗi phát hiện thêm không cấp quyền.
- Scope mơ hồ, revert/conflict hoặc thay đổi ngoài phạm vi phải dừng đúng phần, nêu tác động và xin xác nhận; tiếp tục phần độc lập.
- Toàn plan/nhóm task phải tiếp tục đến khi hết scope; không hạ AC hoặc tuyên bố xong khi còn blocker/check bắt buộc chưa đạt.
- Trước bàn giao, loại hunk ngoài scope, kiểm chứng luồng bị ảnh hưởng, sync docs/testcase repo và dùng [`report`](../skills/report/SKILL.md); không tự review/commit.

Trình tự đọc plan, triển khai, kiểm chứng và bàn giao: [`workflow-implement`](../skills/workflow-implement/SKILL.md).

## Chất lượng và bằng chứng

- Kiểm tra tương xứng rủi ro/phạm vi; static analysis bắt buộc trước khi báo hoàn thành trừ khi người dùng từ chối rõ.
- Không ghi Pass/Fail hoặc tuyên bố tool/check đã chạy nếu không có thực thi và bằng chứng.
- Trước bàn giao, kiểm tra final newline trên file text đổi, `git diff --check`, diff/out-of-scope, regression, render/state/effect loop và N+1 trên luồng bị ảnh hưởng; không đo được phải ghi rõ rà tĩnh.
- Lỗi do diff hoặc thuộc scope phải sửa và kiểm lại; lỗi có sẵn ngoài scope chỉ báo vị trí/tác động và xin phép.
- Bug fix phải theo [`rules/bug-fix`](./bug-fix.md): có bằng chứng, nguyên nhân gốc và regression test tái hiện trước khi sửa; tôn trọng yêu cầu không chạy test/check.

Lệnh, checklist và artifact: [`testing`](../skills/testing/references/unit-testing.md), [`workflow-test`](../skills/workflow-test/SKILL.md), [`workflow-review`](../skills/workflow-review/SKILL.md). Kiểm thử module: [`black-box-feature-testing`](#kiểm-thử-hộp-đen-theo-moduletính-năng).

## Kiểm thử hộp đen theo module/tính năng

- Đánh giá từ requirement/contract, input, output quan sát được và side effect được phép; không dùng implementation nội bộ để quyết định Pass/Fail.
- Mọi case phải truy vết requirement và expected input/output; toàn bộ module/case trong scope phải được lập lịch và đối soát đủ, không bỏ hoặc chạy trùng.
- Chỉ ghi Pass/Fail sau thực thi có bằng chứng; tổng Pass/Fail/Blocked/Skipped/Not Run phải giải thích đủ đầu vào.

Kỹ thuật thiết kế, scheduler, dependency group, concurrency và artifact: [`testcase`](../skills/testing/references/testcase.md), [`testing`](../skills/testing/references/unit-testing.md), [`workflow-test`](../skills/workflow-test/SKILL.md).

## Báo cáo bắt buộc

- Mọi agent phải dùng [`report`](../skills/report/SKILL.md) khi hoàn thành task có thay đổi/kết quả cụ thể; tra cứu thuần túy không áp dụng.
- Toàn plan/nhóm task chỉ có một báo cáo tổng hợp cuối sau khi mọi task/AC/check bắt buộc có bằng chứng; subagent chỉ bàn giao nội bộ.
- Còn TODO/IN_PROGRESS, AC chưa đạt hoặc check bắt buộc Fail/Blocked/Not Run thì không tuyên bố hoàn thành; chỉ báo blocker cụ thể. Testcase repo được yêu cầu thiết kế `Not Run` không phải check thực thi.
- Report chỉ trình bày kết quả đã có, không thay thế review/phân tích/test và không biến lỗi môi trường thành Pass.
- Báo cáo chỉ nêu kết quả cuối (thay đổi, kết quả check, giới hạn); không kể quá trình, các bước thử hay diễn biến từng subagent.
- Báo cáo thay đổi có `Token:` khi hook `report-usage` cung cấp số liệu thật lúc gọi skill `report`; `Issue lãng phí:` chỉ khi hook liệt kê vi phạm (đọc lại file, lặp lệnh, kết quả tool quá lớn, nhiều subagent) kèm bằng chứng. Không có số liệu thì bỏ dòng, không ước lượng.

Timing, chọn loại và format nguồn chuẩn: [`report`](../skills/report/SKILL.md); entry point: [`workflow-report`](../skills/workflow-report/SKILL.md).
