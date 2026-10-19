# Mẫu báo cáo thay đổi

- Mỗi file một mục `Path`; không dùng `Title`, `Description` hoặc bảng.
- Chỉ hiện nhóm có thay đổi: `Đã sửa:`, `Đã thêm mới:`, `Đã xóa:`. Một thay đổi ghi cùng hàng nhãn; nhiều thay đổi dùng bullet, có dòng trống trước danh sách.
- Mô tả ngắn nêu thay đổi và vấn đề được giải quyết. Link dùng số dòng/khoảng dòng thực tế làm nhãn, đường dẫn tuyệt đối mở tại dòng đầu: `[3–27](/absolute/path/file:3)`.
- Nội dung xóa phải nêu lý do thực tế; không tạo link khi vị trí không còn tồn tại. Không bịa số dòng.
- Xuất ngoài code fence; dòng phân cách 80 dấu `-` đặt trong inline code ở đầu/cuối danh sách và một dòng chung giữa hai file.
- Thay đổi UI/frontend (gồm clone-website): thêm `URL:` (route đã kiểm tra trên trình duyệt thật) và `Ảnh chứng:` (đường dẫn screenshot thật, ví dụ `.agents/storage/evidence/<task-slug>/...png`) ngay sau phần kiểm chứng — xem [`rules/frontend`](../../../rules/frontend.md). Không áp dụng cho thay đổi backend/config/docs thuần túy.
- Sau danh sách ghi kiểm chứng, Big O và đánh giá ngắn; chỉ thêm code cũ/mới hoặc giải thích sâu khi được yêu cầu.

`--------------------------------------------------------------------------------`

Path: path/to/file.ext

Đã sửa: [3–27](/absolute/path/to/file.ext:3): Thay đổi chính và vấn đề được giải quyết.

`--------------------------------------------------------------------------------`

**Kiểm chứng**: Lệnh và kết quả thực tế; nêu phần chưa kiểm tra.

**URL**: Route đã mở trên trình duyệt thật (chỉ khi có thay đổi UI/frontend; bỏ dòng này nếu không áp dụng).

**Ảnh chứng**: `.agents/storage/evidence/<task-slug>/...png` — nêu rõ `trước` (source/trạng thái cũ, nếu có để so sánh) và `kết quả` (trạng thái cuối cùng, bắt buộc) (chỉ khi có thay đổi UI/frontend; bỏ dòng này nếu không áp dụng).

**Big O**: Code phụ thuộc dữ liệu ghi time/space Before → After, input `n`/`m`, allocation/preprocessing và căn cứ khi đáng kể; database nêu query, record quét/trả về, `WHERE`/`JOIN`/`ORDER BY`, index/query plan. Rule/skill/docs/template/config thuần túy ghi: Không áp dụng — không có thuật toán/runtime phụ thuộc input. Không suy diễn Big O từ việc đọc hay số file cấu hình.

**Đánh giá**: Kết luận, trade-off và rủi ro còn lại; ghi `Không có` khi phù hợp.
