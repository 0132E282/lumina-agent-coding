---
name: workflow-test
description: "QA theo tính năng/plan, repo hoặc PR; lưu testcase/kết quả và độ phức tạp thuật toán vào testcase.json."
---

# workflow-test

Đọc nguồn `.claude/commands/test.md` và vai trò `.claude/agents/qa-tester.md`; Claude dùng `/test`, Codex dùng `$workflow-test` cùng argument. Mặc định tính năng/task trong plan được giao; `repo [nhánh]` kiểm thử repo, `pr [URL|#số]` kiểm thử PR và regression liên quan. Không tự lập lại plan hoặc sửa ứng dụng.

Output mặc định là `testcase.json` ở gốc repo theo [template](./assets/testcase-template.json), không phải menu docs. Giữ ID/history, tái dùng case từ index cũ nếu có mà không tạo hai nguồn kết quả. Đường dẫn này ưu tiên hơn mặc định lưu docs của vai trò/skill QA khi chạy workflow này. Case chưa chạy là `Not Run`; mỗi execution có thời gian, status và evidence thật.

Ghi `algorithmComplexity` bằng complexity-performance (database khi có query): Before/After time/space/allocation/preprocessing, input, I/O, basis, evidence và giới hạn. Không benchmark thì báo tĩnh; chưa biết thì null có lý do, không có runtime liên quan thì N/A.

Giao qa-tester khi runtime hỗ trợ theo workflow; thiếu thì làm tuần tự cùng vai trò và báo giới hạn, không giả lập agent/checks. Dùng skill `report` khi hoàn tất.
