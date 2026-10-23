# Mẫu Báo Cáo Review

Dùng để trình bày lại finding review/audit đã có sẵn từ code/diff, plan hoặc test case. Báo cáo dạng text; không dùng pipe-table cho review finding.

-------------

## Finding

```text

-------------

File: path/to/file.ext:line
Type: Issue | Suggestion | Good
Severity: CRITICAL | WARNING | SUGGESTION | GOOD
Kết quả: Đúng | Sai
Big O:
  Time Before: O(...)
  Time After: O(...)
  Space Before: O(...)
  Space After: O(...)
  Input: n = [...], m = [...]
  Query/API/I/O: [... hoặc N/A]
Chi tiết: [mô tả hiện trạng, điều kiện gây ra và bằng chứng]
Đề xuất: [cách xử lý cụ thể và trade-off]
Kiểm chứng: [benchmark, test, query log, profiler hoặc Chưa đo]
```

-------------

## Quy ước

- `Type: Issue` dùng cho vấn đề cần xử lý; `Suggestion` dùng cho gợi ý không bắt buộc; `Good` dùng cho điểm đáng giữ hoặc nhân rộng.
- `Kết quả` chỉ `Đúng` hoặc `Sai` theo [`rules/review`](../../../rules/review.md), không có loại khác.
- `Severity` dùng đúng `CRITICAL`, `WARNING`, `SUGGESTION` hoặc `GOOD`.
- Với review code có xử lý phụ thuộc dữ liệu, Big O phải ghi Before/After, `n`/`m`, space và preprocessing nếu có. Không có căn cứ hoặc không liên quan runtime thì ghi `N/A — không áp dụng`.
- Không khẳng định cải thiện hiệu năng nếu chưa benchmark/profile/query log.
- Với plan dùng `REQ-xxx`/`TASK-xxx` tại `File`; với test case dùng `TC-xxx`.

-------------

## Thống kê cuối

```text

-------------

Issue cần sửa: [X]
Suggestion: [Y]
Good: [Z]
Kết quả Đúng: [D]
Kết quả Sai: [S]
```
