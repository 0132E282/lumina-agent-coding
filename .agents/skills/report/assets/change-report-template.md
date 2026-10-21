# Mẫu báo cáo thay đổi

- Mỗi file một mục. Giữa hai mục chỉ có **đúng một** dòng phân cách `-`; không bao giờ để hai dòng phân cách liền nhau. Dòng phân cách chỉ đặt ở đầu danh sách, giữa các mục và sau mục cuối. Nhiều file cùng một thay đổi thì mỗi file vẫn một `Path` trong mục riêng. Không dùng `Title`, `Description` hoặc bảng.
- Nhãn thay đổi: `Đã sửa:`, `Đã thêm mới:`, `Đã xóa:`; chỉ hiện nhóm có thay đổi. Một thay đổi ghi cùng hàng nhãn; nhiều thay đổi dùng bullet, có dòng trống trước danh sách.
- Mô tả ngắn nêu thay đổi và vấn đề được giải quyết. Link dùng số dòng/khoảng dòng thực tế làm nhãn, đường dẫn tuyệt đối mở tại dòng đầu: `[3–27](/absolute/path/file:3)`. Nội dung xóa nêu lý do thực tế, không tạo link khi vị trí không còn; không bịa số dòng.
- `Big O:` nằm ngay trong mục của file, sau các dòng thay đổi, bằng tiếng Anh, một dòng **in đậm cả dòng** cho nổi bật: `**Big O: <độ phức tạp> — Good | needs optimization**`. Ví dụ `**Big O: O(2n) — Good**`, `**Big O: N+1 — needs optimization**`. Chỉ ghi cho file có code xử lý phụ thuộc dữ liệu (thuật toán, vòng lặp, query/API); rule/skill/docs/template/config/test thì **bỏ hẳn dòng này**, không ghi "Không áp dụng", "Không có" hay bất kỳ câu giải thích nào thay thế.
- Cuối báo cáo (sau dòng phân cách cuối) ghi `Kiểm chứng:`, `Giới hạn:`, `Đánh giá:`; chỉ thêm code cũ/mới hoặc giải thích sâu khi được yêu cầu.
- Thay đổi UI/frontend (gồm clone-website): thêm `URL:` (route đã kiểm tra trên trình duyệt thật) và `Ảnh chứng:` (đường dẫn screenshot thật, ví dụ `.agents/storage/evidence/<task-slug>/...png`; nêu `trước` nếu có và `kết quả` bắt buộc) — xem [`rules/frontend`](../../../rules/frontend.md). Bỏ khi không có UI.
- Thay đổi API: chỉ khi có đụng API mới thêm `API:` (không có thì không ghi, không để dòng trống) — request thật (`METHOD URL` + giá trị input) và response thật (status, body) đã chạy, đối chiếu khớp kỳ vọng. Chưa chạy thì ghi `Chưa chạy`, không bịa response.
- Xuất ngoài code fence; dòng phân cách là 80 dấu `-` trong inline code.

`--------------------------------------------------------------------------------`

Path: path/to/file.ext

Đã sửa: [3–27](/absolute/path/to/file.ext:3): Thay đổi chính và vấn đề được giải quyết.

**Big O: O(2n) — Good**

`--------------------------------------------------------------------------------`

Path: path/to/other.ext

Đã sửa: [5](/absolute/path/to/other.ext:5): Thay đổi chính và vấn đề được giải quyết.

`--------------------------------------------------------------------------------`

**Kiểm chứng**: Lệnh và kết quả thực tế; nêu phần chưa kiểm tra.

**URL**: Route đã mở trên trình duyệt thật (chỉ khi có UI).

**Ảnh chứng**: `.agents/storage/evidence/<task-slug>/...png` (chỉ khi có UI).

**Giới hạn**: Phần chưa làm hoặc chưa đo; `Không có` khi phù hợp.

**Đánh giá**: Kết luận, trade-off và rủi ro còn lại; `Không có` khi phù hợp.
