# Văn phong và sơ đồ trong tài liệu

## AI-readable — mặc định

- Viết ngắn, có heading ổn định; ưu tiên facts, path, contract, dependency và kết quả kiểm chứng.
- Dùng sơ đồ Mermaid khi có quan hệ/flow phức tạp; không lặp lại toàn bộ sơ đồ bằng prose.
- Phân biệt dữ kiện, giả định và phần chưa kiểm chứng. Bỏ lời dẫn/trang trí và mục không áp dụng.
- Chỉ đọc/ghi phần liên quan; ghi thông tin ở nguồn chuẩn một lần rồi liên kết. Mở chi tiết theo nhu cầu.

## Human-readable — chỉ khi được yêu cầu

- Viết giải thích theo ngữ cảnh người đọc, có thể thêm narrative, ví dụ, glossary và hướng dẫn từng bước.
- Vẫn giữ path, nguồn kiểm chứng, cảnh báo và trạng thái chưa xác minh; không hy sinh tính chính xác để văn phong dễ đọc.
- Có thể diễn giải lại sơ đồ bằng prose nếu người đọc cần hướng dẫn tuần tự.

Nếu không được chỉ định đối tượng đọc, luôn chọn `AI-readable` và tối ưu cho context nhỏ nhất đủ dùng.

## Giảm tải đọc hiểu bằng sơ đồ

- Khi tài liệu có từ 3 thành phần liên quan, luồng nhiều bước, hierarchy hoặc dependency khó đọc tuyến tính, ưu tiên dùng sơ đồ Mermaid để AI và người đọc nắm quan hệ nhanh hơn.
- Dùng sơ đồ cho quan hệ, ownership, sequence, boundary và dependency; dùng văn bản cho mục đích, assumption, constraint, caveat và chi tiết không thể hiện tốt bằng hình.
- Không lặp lại toàn bộ nội dung sơ đồ bằng prose. Sau sơ đồ chỉ ghi kết luận, điểm dễ nhầm và nguồn kiểm chứng.
- Sơ đồ phải có nhãn ngắn, ít node cần thiết và phân biệt `Đã xác minh`/`Giả định`; nếu sơ đồ làm tài liệu khó đọc hơn thì giữ bản text ngắn và ghi lý do.
