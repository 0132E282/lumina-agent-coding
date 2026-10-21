# 🧪 Test Case Writer

Khi thiết kế hoặc thực thi test hộp đen theo module/tính năng, áp dụng thêm rule [`black-box-feature-testing`](../../../rules/delivery.md#kiểm-thử-hộp-đen-theo-moduletính-năng).

Skill viết **test case có cấu trúc** cho một hành vi/luồng cụ thể, dùng ngay trong phiên hiện tại. Khác agent [`qa-tester-agent`](../../../agents/qa-tester-agent.md) — agent đó làm toàn bộ quy trình (phân tích yêu cầu diện rộng, đánh giá rủi ro P0–P3, thực thi, bug report, bàn giao) cho một feature; skill này là lớp kỹ thuật "viết đúng định dạng, đúng kỹ thuật" khi chỉ cần vài test case nhanh, không cần spawn agent riêng. Dùng chung field/định dạng với `qa-tester-agent` để hai bên tương thích.

## 1. Mục tiêu và phạm vi

Viết test case cho UI, API, nghiệp vụ, database hoặc toàn hệ thống. Xác định rõ phạm vi trước khi viết — một luồng/API/bug cụ thể, không mặc định mở rộng ra toàn feature.

## 2. Khi nào dùng

Tính năng mới, thay đổi yêu cầu, sửa bug (viết test tái hiện bug **trước** khi fix — [`rules/delivery`](../../../rules/delivery.md#chất-lượng-và-bằng-chứng)), hoặc cần bổ sung case cho bộ regression test.

## 3. Dữ liệu đầu vào

Đọc trước khi viết: đặc tả/acceptance criteria, thiết kế UI, API contract, vai trò người dùng, quy tắc nghiệp vụ. Thiếu một trong số này → áp dụng mục 9, không tự bịa.

## 4. Quy trình phân tích

Xác định: luồng chính, luồng thay thế, điều kiện lỗi, trạng thái nghiệp vụ liên quan, phụ thuộc dữ liệu/tích hợp/thứ tự.

## 5. Kỹ thuật thiết kế test

Chọn kỹ thuật theo bài toán, không thêm case chỉ để tăng số lượng ([`rules/coding`](../../../rules/coding.md#kiss-yagni-và-phạm-vi)):

| Kỹ thuật | Dùng khi |
|---|---|
| Phân vùng tương đương | Nhóm dữ liệu hợp lệ/không hợp lệ |
| Giá trị biên | Ngay dưới, tại, ngay trên giới hạn (số, Unicode, múi giờ) |
| Bảng quyết định | Tổ hợp điều kiện/quyền/quy tắc nghiệp vụ |
| Chuyển trạng thái | Chuyển hợp lệ/không hợp lệ, thao tác lặp, trạng thái kết thúc |
| Pairwise | Nhiều tổ hợp, rủi ro cho phép giảm số case — không thay thế tổ hợp nghiệp vụ bắt buộc |
| Kiểm thử theo rủi ro | Ưu tiên case ảnh hưởng lớn/khả năng xảy ra cao khi thời gian hạn chế |

## 6. Phạm vi kiểm thử

Happy path, dữ liệu không hợp lệ, phân quyền, lỗi hệ thống/tích hợp, toàn vẹn dữ liệu (rollback, unique, soft delete), đồng thời nếu liên quan (idempotency, race condition).

## 7. Định dạng đầu ra

Mỗi test case bắt buộc các trường:

| Trường | Ý nghĩa |
|---|---|
| ID | Mã duy nhất, ví dụ `TC_LOGIN_001` |
| Requirement ID | Yêu cầu/acceptance criterion được kiểm tra |
| Title | Mô tả ngắn hành vi cần kiểm thử |
| Priority | High / Medium / Low |
| Preconditions | Trạng thái hệ thống trước khi chạy |
| Test data | Dữ liệu và tài khoản sử dụng (dữ liệu giả, không dùng secret/PII thật — [`rules/backend`](../../../rules/backend.md#an-toàn-dữ-liệu)) |
| Steps | Các bước thao tác cụ thể, đánh số |
| Expected result | Kết quả quan sát được, xác minh được — gắn với bước/checkpoint tương ứng |
| Postconditions / Cleanup | Trạng thái sau test và cách dọn dữ liệu nếu có tạo mới |

Dùng để **ghi nhận kết quả đã chạy** (không chỉ thiết kế) → bổ sung thêm: Actual result, Status (Pass/Fail/Blocked/Skipped/Not Run), Evidence/Bug ID. Chỉ ghi Pass/Fail khi đã thực thi và có bằng chứng — test mới thiết kế là Not Run ([`rules/delivery`](../../../rules/delivery.md#chất-lượng-và-bằng-chứng)).

## 7.1. Hộp đen và lập lịch khi thực thi

Khi test theo module/tính năng, áp dụng rule [`black-box-feature-testing`](../../../rules/delivery.md#kiểm-thử-hộp-đen-theo-moduletính-năng); không lặp lại hoặc tự đặt giới hạn khác trong test case.
- Helper phải kiểm tra `đã phân bổ = tổng case đầu vào`, ID không trùng, và ghi nhận đủ `Pass/Fail/Blocked/Skipped/Not Run` sau mỗi batch.
- Nếu chưa có framework/runner hỗ trợ, chỉ ghi rõ kế hoạch batch và trạng thái `Not Run`; không tự thêm dependency để tạo chạy song song.

## 8. Tiêu chí chất lượng

- Thực thi được: bước cụ thể, không mơ hồ ("kiểm tra form hoạt động" không phải một bước).
- Expected result kiểm chứng được — không viết "hoạt động bình thường", "hiển thị đúng", "báo lỗi hợp lệ" mà thiếu tiêu chí cụ thể.
- Không trùng lặp — case khác nhau phải kiểm tra hành vi khác nhau, không chỉ đổi dữ liệu vô nghĩa.
- Truy vết được về yêu cầu — Requirement ID khớp với tài liệu/API contract thật, không tự chế ID khi chưa có nguồn.

## 9. Khi thiếu thông tin

Ghi rõ giả định đang dùng. Điểm thiếu ảnh hưởng trực tiếp tới expected result → hỏi lại trước khi đánh dấu case Ready; không hỏi được ngay thì đánh dấu Draft/TBD, không tự điền nghiệp vụ để hoàn thiện case ([`rules/coding`](../../../rules/coding.md#nguyên-tắc-code), [`rules/search-priority`](../../../rules/search-priority.md): không bịa quy tắc/ngưỡng/thông báo lỗi chưa xác nhận).

## 10. Lưu testcase và kết quả

- Trước khi tạo hoặc cập nhật bộ testcase, đọc `docs/testcases/index.json` nếu file này tồn tại; đây là dữ liệu testcase và kết quả, không phải mục lục file.
- Lưu case, ma trận truy vết và trạng thái thực thi tại `docs/testcases/index.json`, giữ ID ổn định. Bổ sung case vào bộ có sẵn thay vì tạo bản trùng.
- Suite và case mới có `title` và `createdAt` theo `YYYY-MM-DD`; mỗi lần chạy có `executedAt` theo ISO 8601. Mỗi case có vùng kết quả chạy gồm `status`, `actualResult`, `evidence` và `bugId` khi có. Case mới là `Not Run`; chỉ ghi `Pass`/`Fail` sau khi chạy và lưu bằng chứng. Giữ lịch sử lần chạy nếu schema hiện tại có lịch sử.
- Sau khi cập nhật testcase hoặc kết quả, parse JSON và đối soát số case, ID duy nhất, traceability và trạng thái.

### Testcase cấp repository

- Khi coding cho toàn bộ task của một implementation plan đã hoàn tất, tạo tài liệu testcase cấp repo tại `docs/repo/<title-slug>-<yyyyMMdd>.md`; nội dung dựa trên code, route, API và luồng thực tế đã kiểm tra trong repository.
- Đọc `docs/repo/index.json` trước để tránh tạo testcase repo trùng; mở các file Markdown được trỏ tới khi liên quan. Nếu menu chưa tồn tại, tạo JSON array rỗng rồi thêm entry mới.
- Ghi testcase theo cấu trúc mục 7. Kết quả chưa chạy ghi `Not Run`; chỉ ghi Pass/Fail khi đã thực thi và có bằng chứng.
- Thêm/cập nhật entry trong cả `docs/repo/index.json` và `docs/index.json` với đúng `title`, `description`, `tags`, `path`. `docs/repo/index.json` là mục lục con, không nhúng nội dung testcase vào index.
- Việc tự động tạo tài liệu sau khi code xong chỉ thiết kế testcase, không chạy test. Chỉ thực thi khi người dùng yêu cầu hoặc workflow test được giao.
- Quy ước này dành cho testcase cấp repository; bộ testcase và lịch sử kết quả theo feature vẫn lưu tại `docs/testcases/index.json`.

Nếu test case được review độc lập, review report thuộc `docs/reviews/` theo workflow-review; testcase và trạng thái chạy vẫn ở `docs/testcases/index.json`.

## Khi áp dụng

- Cần viết nhanh một vài test case cho tính năng/API/bug cụ thể ngay trong phiên hiện tại.
- Không dùng cho việc thiết kế + thực thi toàn bộ bộ test có risk assessment, ma trận bao phủ REQ→AC và bug report đầy đủ cho một feature lớn — giao cho agent [`qa-tester-agent`](../../../agents/qa-tester-agent.md).
