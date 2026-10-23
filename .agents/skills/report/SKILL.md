---
name: report
description: "Báo cáo kết quả đã có khi hoàn thành task hoặc gọi /report, $workflow-report. Không tự review hay phân tích code."
license: MIT
metadata:
  version: "1.7"
---

# Report

Khi scope là toàn plan/nhóm task coding, gom bàn giao nội bộ, thay đổi plan và kiểm chứng để gửi **một báo cáo cuối sau khi tất cả task được giao hoàn thành**. Trước đó chỉ cập nhật tiến độ ngắn; không xuất report giữa các task. Báo cáo cuối gộp thay đổi theo file, trạng thái task/AC, checks thật, giới hạn (Big O nằm trong mục từng file); không lặp report của từng agent. Chưa hoàn tất vì blocker cần người dùng thì báo blocker và phần còn lại, không dùng kết luận DONE. Yêu cầu `/report` khi chưa xong chỉ xuất trạng thái chưa hoàn thành, không giả báo cáo hoàn tất.

Chỉ trình bày kết quả/diff đã có; không tự tìm lỗi, review, kiểm thử hay đánh giá code. Mặc định ngắn gọn, đúng template; không bỏ field bắt buộc. Áp dụng theo [mandatory-report](../../rules/delivery.md#báo-cáo-bắt-buộc) và [quality-assurance](../../rules/delivery.md#chất-lượng-và-bằng-chứng).

## Chọn template

| Loại | Input và thời điểm | Template |
|---|---|---|
| Thay đổi/commit | Diff sau Edit/Write hoặc trước khi soạn commit | [Change](./assets/change-report-template.md) |
| Plan | Plan JSON vừa hoàn thành, trước khi chờ duyệt | [Plan](./assets/plan-summary-report-template.md) |
| Review | Finding đã có từ review code, plan hoặc testcase | [Review](./assets/review-report-template.md) |
| Security | Kết quả review-web-security | [Security](./assets/security-review-report-template.md) |
| Dependency | Kết quả dependency-audit | [Dependency](./assets/dependency-audit-report-template.md) |
| Test | Kết quả QA đã thiết kế/thực thi | [QA digest](./assets/qa-test-report-template.md) |
| Debug | Chẩn đoán/sửa lỗi theo skill debugs | [Debug](./assets/debug-report-template.md) |
| Bug/Feedback | Phát hiện trong lúc làm việc | [Feedback](./assets/bug-feedback-report-template.md) |
| Bàn giao nội bộ | Subagent trả kết quả cho agent điều phối (không gửi người dùng) | [Handoff](./assets/subagent-handoff-template.md) |

## Yêu cầu theo loại

- **Change**: template là nguồn chuẩn định dạng; chỉ nêu thay đổi thực tế và vấn đề được giải quyết, không diễn giải lại file. Code phụ thuộc dữ liệu dùng [complexity-performance](../complexity-performance/SKILL.md); có query/database kết hợp [database](../database/SKILL.md). Giữ kiểm chứng, giới hạn, đánh giá; `Big O:` trong mục file chỉ khi có code phụ thuộc dữ liệu, rule/skill/docs/config thì bỏ dòng. Thay đổi UI/frontend thêm `URL`/`Ảnh chứng` theo [`rules/frontend`](../../rules/frontend.md); thay đổi API thêm `API:` (request + response thật, khớp kỳ vọng). Chỉ thêm code cũ/mới khi được yêu cầu. Chỉ nêu kết quả cuối; không kể quá trình (test-first, các lần thử, subagent nào làm gì). Cuối báo cáo thêm `Token:` nếu hook `report-usage` đã cung cấp số liệu thật từ transcript khi gọi skill này, và `Issue lãng phí:` chỉ khi hook liệt kê vi phạm; không có thì bỏ, không ghi N/A, `Không phát hiện` hay ước lượng.
- **Plan**: tóm tắt số REQ/task/câu hỏi mở/rủi ro, rủi ro chính và bước tiếp theo; không chép toàn bộ plan. Mỗi task một mục `Task/Status/File` + bullet, không `Description`; câu hỏi mở theo mục [Câu hỏi mở](#câu-hỏi-mở).
- **Review**: dùng text, không pipe-table; giữ các field và thống kê trong template. Severity: CRITICAL (logic nặng/bảo mật/crash), WARNING (code smell/hiệu năng/edge case), SUGGESTION (gợi ý), GOOD (điểm tốt). Code phụ thuộc dữ liệu ghi time/space Before/After, input, query/API/I/O và preprocessing; ngoài runtime ghi N/A.
- **Security**: giữ đủ chín field theo [review-web-security](../review-web-security/SKILL.md), gồm `Kết quả: Đúng | Sai`, điều kiện khai thác và CWE/OWASP; không gộp vào review thường.
- **Dependency**: giữ package, severity, phiên bản hiện tại → fix, loại thay đổi và lệnh đề xuất; không tự thực thi lệnh sửa.
- **Test**: chỉ tóm tắt kết quả QA; không thay thế ma trận bao phủ hoặc bug report chi tiết, không suy đoán Pass/Fail.
- **Debug**: theo template; giữ mức độ, nguồn gốc, nguyên nhân gốc, regression test và kiểm chứng; ảnh UI, số đo hiệu năng, bảo mật, postmortem chỉ khi áp dụng. File thay đổi liệt kê theo template Change.
- **Feedback**: `Title: [Type] tiêu đề`, `URL: vị trí hoặc chưa xác định`, rồi bullet hiện tượng/cách phát hiện/đã xử lý tới đâu. Type tự do; không thay thế bug report QA hay tool SendFeedback.

Dấu phân cách và bố cục theo template tương ứng. Báo cáo sau khi công việc nguồn hoàn tất; feedback ghi ngay khi phát hiện.

## Hiển thị mobile và desktop

Báo cáo phải đọc được trên màn hẹp (~40 ký tự) lẫn desktop, không cuộn ngang:
- Không dùng bảng (pipe-table) trong báo cáo; dùng nhãn + bullet.
- Dòng phân cách 24 dấu `-`; code fence chỉ chứa dòng ngắn (≤ 60 ký tự), không để lệnh/JSON dài trong fence.
- Link hiển thị nhãn ngắn (số dòng, tên file), không in đường dẫn tuyệt đối dài làm text.
- Mỗi bullet một ý; đoạn văn tối đa 2–3 câu; con số quan trọng (Pass/Fail, số lỗi) đặt đầu dòng.

## Câu hỏi mở

- Từ 2 câu hỏi mở trở lên cần người dùng chốt: dạng text, không bảng. Mỗi câu một mục `Câu hỏi:` / `Đề xuất:` (thêm `Ảnh hưởng nếu chọn sai:` khi rủi ro cao — tiền, mất dữ liệu, phân quyền), ngăn cách bằng dòng 24 dấu `-` đặt trong inline code (không dùng `---` trần vì Markdown render thành đường kẻ ngắn), như ví dụ:

`------------------------`

Câu hỏi 1: nội dung
Đề xuất: mặc định

`------------------------`

- Chỉ 1 câu thì hỏi thẳng. Không áp dụng cho `AskUserQuestion` hay tool hỏi có UI riêng của runtime.
