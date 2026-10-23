# 🧪 Testing Strategy

Code test/helper tuân thủ type, comment, DRY/SRP và readability trong [`coding-standards`](../../coding-standards/SKILL.md). Khi chạy nhiều module/case, giữ đủ case accounting và chỉ hạ concurrency vì dependency/state/rate-limit/tài nguyên có bằng chứng.

Khi kiểm thử hộp đen theo module/tính năng và lập lịch nhiều module, áp dụng thêm [`testcase` mục 7.1](./testcase.md#71-hộp-đen-và-lập-lịch-khi-thực-thi).

Lớp **kỹ thuật viết test code** khi implement — khác [`qa-tester`](../../../agents/qa-tester.md) (thiết kế ca kiểm thử **nghiệp vụ** từ đặc tả). Skill này không quan tâm case nghiệp vụ nào cần test, chỉ quan tâm cách viết test đúng kỹ thuật cho một đơn vị code.

## Nguyên tắc bắt buộc

- Test **hành vi** (input/output), không test chi tiết triển khai — đổi cách viết nội bộ hàm mà không đổi input/output thì test không được fail.
- Sửa bug → viết test tái hiện bug **trước**, thấy fail, rồi fix tới khi pass ([`rules/delivery`](../../../rules/delivery.md#chất-lượng-và-bằng-chứng)).
- Độ phủ theo **rủi ro**, không theo % cứng — ưu tiên business logic/edge case/luồng tiền-dữ liệu nhạy cảm, bỏ qua getter/setter/CRUD đã cover gián tiếp.
- Rule of Three cho test fixture/helper ([`rules/coding`](../../../rules/coding.md#nguyên-tắc-code)) — không gom chung từ lần lặp thứ 2.

## Chọn test double

| Loại | Dùng khi |
|---|---|
| **Stub** | Chỉ cần trả dữ liệu giả cố định, không quan tâm cách nó được gọi |
| **Mock** | Cần xác nhận tương tác đã xảy ra đúng (gọi đúng hàm/tham số/số lần) |
| **Fake** | Cần bản triển khai nhẹ, hoạt động thật nhưng không hợp production (in-memory DB thay SQL) |
| **Spy** | Chạy hành vi thật **và** ghi lại lời gọi để kiểm tra sau |

Chỉ double hóa dependency **không xác định/không kiểm soát được** (I/O thật, `Date.now()`, số ngẫu nhiên, env thay đổi). Logic nội bộ thuần test trực tiếp — mock quá tay làm test chỉ còn xác nhận lại mock ([`rules/coding`](../../../rules/coding.md#kiss-yagni-và-phạm-vi)).

## Cấu trúc test

**Arrange–Act–Assert**: tên test mô tả hành vi + điều kiện (`should_X_when_Y`, không mô tả cách triển khai); mỗi test tập trung một khái niệm hành vi, hành vi không liên quan thì tách test riêng.

## Hộp đen và chạy song song theo tính năng

Khi task kiểm thử theo module/tính năng, áp dụng [`testcase` mục 7.1](./testcase.md#71-hộp-đen-và-lập-lịch-khi-thực-thi) làm nguồn chuẩn cho thiết kế hộp đen, lập lịch toàn bộ module, chia case và đối soát kết quả.

## Dấu hiệu test có vấn đề

- Luôn pass dù code sai (thiếu assert thật, hoặc assert hiển nhiên đúng).
- Flaky do `Date.now()`/`Math.random()`/thứ tự chạy không seed/cách ly.
- Phụ thuộc trạng thái test khác chạy trước (fail khi đổi thứ tự).
- Mock quá nhiều tới mức chỉ còn xác nhận lại chính mock.

## Khi áp dụng

- Sau khi viết/sửa logic mới cần test kỹ thuật, hoặc ngay sau khi fix bug (regression test).
- Khi review test hiện có nghi giả/flaky — rà theo mục "Dấu hiệu" trên.
- Không dùng cho thiết kế ca kiểm thử nghiệp vụ (→ `qa-tester`) hay chọn pattern kiến trúc (→ [`design-patterns`](../../design-patterns/SKILL.md)).
