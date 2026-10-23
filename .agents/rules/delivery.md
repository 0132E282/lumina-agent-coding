---
trigger: model_decision
description: "Áp dụng khi triển khai, kiểm thử/kiểm chứng và báo cáo hoàn thành task"
---

# Quy tắc triển khai và bàn giao

## Triển khai theo yêu cầu

- Triển khai/sửa code phải theo vai trò [`coder`](../agents/coder.md), đúng task/plan, dependency và file/hành vi đã được duyệt.
- Trước bàn giao, loại hunk ngoài scope, kiểm chứng luồng bị ảnh hưởng, sync docs/testcase repo và dùng [`report`](../skills/report/SKILL.md); không tự review/commit.

Trình tự đọc plan, triển khai, kiểm chứng và bàn giao: [`workflow-implement`](../skills/workflow-implement/SKILL.md).

## Chất lượng và bằng chứng

- Kiểm tra tương xứng rủi ro/phạm vi; static analysis bắt buộc trước khi báo hoàn thành trừ khi người dùng từ chối rõ.
- Không ghi Pass/Fail hoặc tuyên bố tool/check đã chạy nếu không có thực thi và bằng chứng; testcase đã chạy phải có ảnh hoặc request/response API thật, API ghi rõ từng endpoint/tham số `Đúng | Sai` theo [`testcase` mục 7.2](../skills/testing/references/testcase.md#72-bằng-chứng-và-kết-quả-api).
- Trước bàn giao, kiểm tra final newline trên file text đổi, `git diff --check`, diff/out-of-scope, regression, render/state/effect loop và N+1 trên luồng bị ảnh hưởng; không đo được phải ghi rõ rà tĩnh.
- Lỗi do diff hoặc thuộc scope phải sửa và kiểm lại; lỗi có sẵn ngoài scope chỉ báo vị trí/tác động và xin phép.
- Bug fix theo [`rules/bug-fix`](./bug-fix.md); tôn trọng yêu cầu không chạy test/check.

Lệnh, checklist và artifact: [`testing`](../skills/testing/references/unit-testing.md), [`workflow-test`](../skills/workflow-test/SKILL.md), [`workflow-review`](../skills/workflow-review/SKILL.md). Kiểm thử hộp đen theo module: [`testcase`](../skills/testing/references/testcase.md#71-hộp-đen-và-lập-lịch-khi-thực-thi).

## Báo cáo bắt buộc

- Mọi agent phải dùng [`report`](../skills/report/SKILL.md) khi hoàn thành task có thay đổi/kết quả cụ thể; tra cứu thuần túy không áp dụng.
- Toàn plan/nhóm task chỉ có một báo cáo tổng hợp cuối sau khi mọi task/AC/check bắt buộc có bằng chứng; subagent chỉ bàn giao nội bộ theo [mẫu handoff](../skills/report/assets/subagent-handoff-template.md), không gọi `report`.
- Toàn plan/nhóm task phải làm đến hết scope; còn TODO/IN_PROGRESS, AC chưa đạt (không tự hạ AC) hoặc check bắt buộc Fail/Blocked/Not Run thì không tuyên bố hoàn thành, chỉ báo blocker cụ thể. Testcase repo được yêu cầu thiết kế `Not Run` không phải check thực thi.
- Report chỉ trình bày kết quả cuối đã có (thay đổi, kết quả check, giới hạn), không kể quá trình hay diễn biến subagent, không thay thế review/phân tích/test và không biến lỗi môi trường thành Pass.

Timing, chọn loại, format và dòng `Token:`/`Issue lãng phí:`: [`report`](../skills/report/SKILL.md); entry point: [`workflow-report`](../skills/workflow-report/SKILL.md).
