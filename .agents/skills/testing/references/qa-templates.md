# QA templates và ví dụ

Mẫu dùng cho `qa-tester`: checklist chọn phạm vi, ma trận bao phủ, mẫu test case, bản ghi thực thi, mẫu bug report và ví dụ minh họa. Mở khi cần soạn artifact tương ứng.

## Checklist lựa chọn phạm vi

Chỉ áp dụng mục liên quan; ghi N/A và lý do khi cần.

| Nhóm | Điểm cần kiểm tra |
|---|---|
| Chức năng | Luồng chính, thay thế, ngoại lệ, kết quả và quy tắc tính toán |
| Validation | Bắt buộc, kiểu dữ liệu, định dạng, độ dài, giá trị biên, null và rỗng |
| Quyền | Chưa đăng nhập, sai vai trò, quyền theo bản ghi, tenant, truy cập qua API trực tiếp |
| API | Method, path, header, schema, status theo contract, lỗi, phân trang, lọc và sắp xếp |
| Dữ liệu | Toàn vẹn quan hệ, unique, rollback, đồng bộ trạng thái, soft delete |
| Đồng thời | Nhấn/gửi lặp, race condition, idempotency nếu contract yêu cầu |
| Tích hợp | Timeout, lỗi dịch vụ, retry, webhook trùng hoặc sai thứ tự nếu liên quan |
| Thời gian | Múi giờ, đầu/cuối kỳ, ngày hết hạn và quy tắc làm tròn |
| Giao diện | Responsive, bàn phím, focus, thông báo, trạng thái loading và empty |
| Bảo mật | Truy cập trái phép, lộ dữ liệu, xử lý input và session trong phạm vi được giao |
| Hiệu năng | Workload, môi trường, chỉ số và ngưỡng đã thống nhất; thiếu ngưỡng thì chưa kết luận đạt |

Với Laravel/backend, cân nhắc Form Request validation, middleware/policy, Sanctum nếu được dùng, Eloquent relations, transaction, queue, cache và soft delete — liên hệ [`rules/backend.md`](../../../rules/backend.md#an-toàn-dữ-liệu) (transaction, phân quyền ở backend). Chỉ đưa vào phạm vi khi dự án thực sự sử dụng chúng.

## Ma trận bao phủ

| Requirement ID | Nội dung / nguồn | Scenario | Test case IDs | Rủi ro | Tình trạng thiết kế |
|---|---|---|---|---|---|
| REQ-001 | [Yêu cầu và nguồn] | [Kịch bản] | TC-MODULE-001 | P1 | Ready / Draft / Missing |

Không xem tỷ lệ bao phủ yêu cầu là bằng chứng kiểm thử toàn diện. Phân biệt độ bao phủ thiết kế với kết quả đã thực thi.

## Mẫu test case chi tiết

```
### TC-MODULE-001 — [Hành vi cần kiểm chứng]
- Requirement ID / nguồn: [...]
- Module: [...]
- Mục tiêu: [...]
- Loại test / kỹ thuật: [...]
- Priority: P1 — [lý do]
- Tiền điều kiện: [...]
- Dữ liệu test / fixture: [...]
- Tình trạng thiết kế: Ready | Draft
- Trạng thái thực thi: Not Run

| Bước | Thao tác | Kết quả mong đợi |
| --- | --- | --- |
| 1 | [Thao tác cụ thể] | [Kết quả quan sát được] |
| 2 | [Thao tác cụ thể] | [Kết quả quan sát được] |

- Hậu điều kiện: [...]
- Cleanup: [...]
- Phụ thuộc / giả định: [Không có hoặc ghi cụ thể]
```

Nếu dùng bảng tổng hợp, vẫn phải giữ đủ bước và expected result; không gộp thành tiêu đề mơ hồ. Nếu cần tự động hóa, chuyển case thành test code theo framework có sẵn của dự án; không tự thêm dependency khi chưa cần.

## Bản ghi thực thi

| Execution ID | Test case ID / revision | Build / môi trường | Thời điểm | Status | Actual result | Evidence | Bug ID |
|---|---|---|---|---|---|---|---|
| RUN-001 | TC-MODULE-001 / v1 | [...] | [...] | Not Run | Chưa thực thi | — | — |

Quy ước status:

- **Not Run**: chưa chạy.
- **Pass**: đã chạy, mọi checkpoint bắt buộc đạt.
- **Fail**: đã chạy, có checkpoint không đạt expected result đã xác nhận.
- **Blocked**: không thể hoàn thành do thiếu điều kiện hoặc lỗi chặn; nêu lý do.
- **Skipped**: chủ động không chạy trong lần này; nêu lý do.

## Mẫu bug report

```
### BUG-MODULE-001 — [Điều kiện gây lỗi + hành vi sai]
- Test case / Requirement ID: [...]
- Build / môi trường / trình duyệt: [...]
- Severity: Critical | Major | Minor | Trivial — [ảnh hưởng]
- Priority: [theo quy ước dự án, là đề xuất nếu chưa được chốt]
- Tiền điều kiện và dữ liệu: [...]
- Các bước tái hiện:
  1. [...]
  2. [...]
- Expected result: [..., dẫn nguồn]
- Actual result: [...]
- Tần suất: [số lần tái hiện / số lần thử, hoặc chưa xác định]
- Bằng chứng: [ảnh, response, log đã che dữ liệu nhạy cảm]
- Ảnh hưởng: [...]
- Giả thuyết nguyên nhân: [tùy chọn; không trình bày như kết luận]
```

Severity là mức ảnh hưởng; priority là thứ tự ưu tiên xử lý. Không tự kết luận mọi lỗi bảo mật đều Critical nếu chưa đánh giá tác động.

## Ví dụ minh họa

Ví dụ này sử dụng đặc tả giả lập, không áp dụng tự động cho dự án thật:

- `REQ-DEMO-001`: `POST /api/products` yêu cầu `name` là chuỗi 1–100 ký tự, `price` là số nguyên không âm; dữ liệu hợp lệ trả HTTP 201.
- `REQ-DEMO-002`: Chỉ admin được tạo; user đã đăng nhập không có quyền nhận HTTP 403 và không tạo bản ghi.
- `REQ-DEMO-003`: Dữ liệu không hợp lệ trả HTTP 422, response có `errors` theo tên trường và không tạo bản ghi.

**TC-PRODUCT-001 — Từ chối tạo sản phẩm khi price âm**

- Requirement ID: REQ-DEMO-001, REQ-DEMO-003.
- Module: Product API.
- Mục tiêu: kiểm tra validation `price` và không ghi dữ liệu khi request bị từ chối.
- Loại test / kỹ thuật: API negative / giá trị biên `-1` của số nguyên không âm.
- Priority: P1 — bảo vệ tính hợp lệ của dữ liệu sản phẩm.
- Tiền điều kiện: môi trường test; admin đã đăng nhập; tên `QA_PRICE_NEG_001` chưa tồn tại; có quyền đọc dữ liệu test để đối chiếu.
- Dữ liệu: `{"name":"QA_PRICE_NEG_001","price":-1}`; dùng token test, không ghi token vào báo cáo.
- Tình trạng thiết kế: Ready.
- Trạng thái thực thi: Not Run.

| Bước | Thao tác | Kết quả mong đợi |
|---|---|---|
| 1 | Gửi `POST /api/products` với JSON trên, header xác thực admin và `Accept: application/json` | HTTP 422; response có `errors.price` chứa ít nhất một thông báo validation |
| 2 | Đối chiếu dữ liệu `products` bằng truy vấn read-only theo tên fixture | Không có bản ghi `name = QA_PRICE_NEG_001` |

- Hậu điều kiện: không có sản phẩm mới từ request này.
- Cleanup: nếu test thất bại và tạo dữ liệu, xóa fixture trong môi trường test theo cơ chế cleanup được cấp.
- Phụ thuộc: đặc tả giả lập ở trên; không yêu cầu nguyên văn thông báo vì đặc tả chưa quy định.

Các case liên quan cần thiết kế riêng: `price = 0`, `name` dài 100/101 ký tự, user thiếu quyền, request chưa đăng nhập. Expected result của request chưa đăng nhập phải được bổ sung từ contract trước khi đánh dấu Ready.
