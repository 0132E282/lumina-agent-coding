# Mẫu Báo Cáo Test (digest)

Dùng để tóm tắt kết quả **đã thiết kế/thực thi** bởi agent [`qa-tester`](../../../agents/qa-tester.md) thành bản ngắn dễ copy vào PR/commit — không thay thế ma trận bao phủ, mẫu test case chi tiết hay bug report đầy đủ mà `qa-tester` đã tạo riêng.

```markdown

## ✅ Báo cáo test

**Phạm vi**: [feature/luồng được test]

- **Unit Tests** (`[lệnh]`): [X]/[Y] test suites PASS ([n]/[m] tests pass).
- **Linter** (`[lệnh]`): [N] lỗi (clean nếu 0).
- **Build** (`[lệnh]`): [kết quả build, hoặc bỏ dòng này nếu task không cần build].

### Danh sách Testcase / Bug đã xử lý

**`TC-xxx` / `BUG-xxx`** (P1/P2/P3) — Pass | Fail | Blocked | Skipped | Not Run
- Vấn đề: [hành vi sai quan sát được]
- Nguyên nhân & xử lý: [nguyên nhân gốc + cách xử lý, kèm `file:dòng`]
- Bằng chứng: [ảnh `.agents/storage/evidence/<task-slug>/...png` hoặc `API-xx`]

### API (chỉ khi test API — mỗi API một mục, không ghi chung chung)

**API-01** `METHOD https://host/path/thật` — Kết quả: Đúng | Sai
- Tham số: `path`/`query`/`body`/`header` đã gửi (che secret/PII) — Đúng | Sai so với contract
- Expected: status [xxx], field/kiểu chính [...]
- Actual: status [xxx], response thật (rút gọn) [...]
- Sai ở đâu (chỉ khi Sai): [status / field / kiểu / giá trị / tham số nào]

### Rủi ro còn lại
- [Luồng/edge case chưa test và lý do — không ghi "đã test" khi chưa chạy]
```

Không dùng bảng (đọc trên mobile); mỗi case một mục như trên. Mọi case Pass/Fail phải có dòng `Bằng chứng` (ảnh hoặc API thật) theo [`testcase` mục 7.2](../../testing/references/testcase.md#72-bằng-chứng-và-kết-quả-api); API chỉ có `Kết quả: Đúng | Sai`. Chưa thực thi → ghi rõ "Chưa thực thi kiểm thử", không suy ra Pass từ việc đã thiết kế xong. Dòng "Nguyên nhân & xử lý" chỉ điền khi đã xác nhận fix thật (không suy đoán); mỗi mục cần truy ngược được về test case/bug report gốc của `qa-tester` khi cần.
