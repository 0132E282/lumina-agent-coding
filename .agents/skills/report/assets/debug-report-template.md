# Mẫu báo cáo Debug

Dùng khi chẩn đoán/sửa lỗi theo skill [`debugs`](../../debugs/SKILL.md). Chỉ nêu kết quả cuối (vd "test fail trước sửa, pass sau sửa" là kết quả), không kể lại diễn biến các lần thử. Thay đổi file vẫn liệt kê theo [mẫu Change](./change-report-template.md); mẫu này thay phần tóm tắt lỗi. Bỏ dòng không áp dụng.

`------------------------`

**Lỗi**: tiêu đề ngắn — **Mức độ**: S1|S2|S3|S4 (lý do)

**Ảnh hưởng**: chức năng, nhóm/số người dùng, dữ liệu mất/sai (số liệu kèm nguồn: log, analytics, query đếm; không có thì `chưa xác định` + lý do)

**Căn cứ**: `file:dòng` đặc tả hoặc nguồn yêu cầu

**Expected / Actual**: kết quả mong đợi / kết quả thực tế

**Tái hiện**: môi trường/phiên bản + input + các bước đánh số tới lỗi (lệnh hoặc thao tác chạy lại được); lỗi lúc có lúc không ghi tỉ lệ (vd 2/5 lần); không tái hiện được thì ghi điều kiện đã biết, đã thử gì và vì sao vẫn sửa (bằng chứng từ log/dữ liệu)

**Phạm vi**: tầng lỗi (frontend | API | service | database | queue | network | hệ thống ngoài) — kèm `file:dòng`

**Nguồn gốc**: code | dữ liệu | cấu hình/môi trường | input người dùng | dependency — kèm `file:dòng`

**Nguyên nhân gốc**: một câu + `file:dòng` + bằng chứng nối trực tiếp tới triệu chứng

**Bằng chứng**: log/stack trace/query/request đã che secret (đã chạy lệnh kiểm secret ở skill debugs), đường dẫn `.agents/storage/evidence/<task-slug>/<yyyyMMdd-HHmm>-<loại>.<ext>`

**Bản sửa**: thay đổi chính và vì sao nhắm đúng nguyên nhân

**Regression test**: `file:dòng` — fail trước sửa (kết quả `verify-regression.sh <base> -- <lệnh>` + đường dẫn log evidence), pass sau sửa, fail lại khi bỏ riêng bản sửa; không tự động hóa được thì cách kiểm tra trước/sau

**Hiệu năng**: trước → sau (p50/p95, số query/request, CPU/RAM) khi lỗi hiệu năng; bug khác trên luồng phụ thuộc dữ liệu ghi kết quả rà N+1/vòng lặp

**Bảo mật**: có/không; có thì tham chiếu báo cáo security, không ghi payload khai thác

**URL / Ảnh chứng**: route và ảnh trước/sau trong `.agents/storage/evidence/<task-slug>/` — chỉ khi bug UI

**Kiểm chứng**: lệnh và kết quả cuối (case lỗi, bình thường, biên, regression)

**Ngoài scope**: lỗi phát hiện thêm — vị trí, tác động, đang chờ xin phép; `Không có` khi phù hợp

**Giới hạn**: mục checklist chưa đạt, phần chưa xác minh trên môi trường mục tiêu; `Không có` khi phù hợp

**Postmortem**: timeline, tác động, cách phòng lặp lại — chỉ khi lỗi production
