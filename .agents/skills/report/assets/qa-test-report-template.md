# Mẫu Báo Cáo Test (digest)

Dùng để tóm tắt kết quả **đã thiết kế/thực thi** bởi agent [`qa-tester-agent`](../../../agents/qa-tester-agent.md) thành bản ngắn dễ copy vào PR/commit — không thay thế ma trận bao phủ, mẫu test case chi tiết hay bug report đầy đủ mà `qa-tester-agent` đã tạo riêng.

```markdown

## ✅ Báo cáo test

**Phạm vi**: [feature/luồng được test]

- **Unit Tests** (`[lệnh]`): [X]/[Y] test suites PASS ([n]/[m] tests pass).
- **Linter** (`[lệnh]`): [N] lỗi (clean nếu 0).
- **Build** (`[lệnh]`): [kết quả build, hoặc bỏ dòng này nếu task không cần build].

### Danh sách Testcase / Bug đã xử lý

| Mã QA / Bug ID | Mô tả vấn đề | Nguyên nhân & Cách xử lý | Trạng thái |
|---|---|---|---|
| `TC-xxx` / `BUG-xxx` (P1/P2/P3) | [hành vi sai quan sát được] | [nguyên nhân gốc + cách xử lý, kèm `file:dòng`] | Pass / Fail / Blocked / Skipped / Not Run |

**API** (chỉ khi test API): `METHOD URL`, input thật, response thật và đối chiếu với kỳ vọng.

### Rủi ro còn lại
- [Luồng/edge case chưa test và lý do — không ghi "đã test" khi chưa chạy]
```

Chưa thực thi → ghi rõ "Chưa thực thi kiểm thử", không suy ra Pass từ việc đã thiết kế xong. Cột "Nguyên nhân & Cách xử lý" chỉ điền khi đã xác nhận fix thật (không suy đoán); mỗi dòng bảng cần truy ngược được về test case/bug report gốc của `qa-tester-agent` khi cần.
