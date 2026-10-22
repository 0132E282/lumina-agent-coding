---
description: Setup DESIGN.md tooling trong project, xem spec và lint tài liệu thiết kế
argument-hint: "[đường dẫn DESIGN.md; mặc định DESIGN.md tại project hiện tại]"
---

Giao vai trò `setup` thiết lập DESIGN.md tooling cho **project đang mở**: $ARGUMENTS

Agent đọc vai trò [`setup`](../agents/setup.md), hướng dẫn project và rule liên quan trước khi thực hiện. Nếu runtime không hỗ trợ delegation, thực hiện tuần tự theo cùng vai trò và nêu rõ giới hạn.

## Phạm vi

- Lệnh này cho phép cài devDependency `@google/design.md` và thêm hai npm scripts bên dưới vào package của project đang mở. Giữ package manager, phiên bản đã có, lockfile, scripts và dependency khác; không cài global vào `~/` dù command được cài tại home.
- Nếu project chưa có `package.json`, tạo manifest tối thiểu `private: true` để phục vụ tooling; không đổi manifest của workspace cha. Với monorepo, dùng package đang làm việc; nếu chưa xác định được package đích, hỏi đường dẫn trước khi cài.
- Không tạo lại UI, theme hoặc tự sinh/ghi đè `DESIGN.md`. Chỉ đọc file được chỉ định; không có file thì setup + spec, báo lint chưa chạy vì thiếu file.

## Thực hiện

1. Đọc `package.json`, lockfile và hướng dẫn project. Xác định package manager, runtime tương thích và dependency đã cài. Tái sử dụng tooling hiện có; không tự nâng phiên bản nếu package đã khai báo.
2. Nếu thiếu dependency, dùng package manager hiện có thêm `@google/design.md` làm devDependency. Với npm: `npm install --save-dev @google/design.md@^0.4.0`. Nếu đã khai báo nhưng binary chưa có, cài theo lockfile/hướng dẫn project thay vì tải qua `npx`. Giữ peer dependency và kiểm tra TLS mặc định; không dùng `--force`.
3. Bổ sung các key còn thiếu vào `scripts`:

   ```json
   {
     "design:lint": "designmd lint",
     "design:spec": "designmd spec"
   }
   ```

   Nếu key đã có nội dung khác, giữ nguyên và báo xung đột; không chạy script xung đột như thể đó là tooling này. Không thay toàn bộ `scripts`.
4. Chạy spec bằng script của package manager hiện có (npm: `npm run design:spec`). Dùng kết quả làm căn cứ cho format, không suy đoán schema.
5. Với file `$ARGUMENTS` hoặc `DESIGN.md` tại package đích nếu không truyền đường dẫn, kiểm tra file tồn tại rồi lint (npm: `npm run design:lint -- "path/to/DESIGN.md"`). Truyền đường dẫn như một argument, không nội suy input thành shell code. Giữ exit code/findings thật; không tự sửa tài liệu để lint đạt.
6. Kiểm tra diff manifest/lockfile đúng phạm vi. Báo dependency/phiên bản, package đích, script đã thêm, kết quả spec/lint và lỗi còn lại bằng skill `report`. Không commit/push.

