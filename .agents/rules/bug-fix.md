# Debug — có bằng chứng, đúng nguyên nhân gốc

- Không sửa lỗi dựa trên phỏng đoán: phải tái hiện được hoặc xác định rõ điều kiện xảy ra, có expected vs actual theo đặc tả và bằng chứng thật (log, stack trace, request/response, query, dữ liệu).
- Khoanh vùng tầng lỗi và xác định nguồn gốc (code, dữ liệu, cấu hình/môi trường, input/thao tác người dùng ngoài đặc tả, dependency/hệ thống ngoài) bằng bằng chứng; kiểm từng giả thuyết, sửa nguyên nhân gốc, không workaround tùy tiện hay chỉ che triệu chứng. Input người dùng sai đặc tả mà hệ thống không validate/báo lỗi rõ vẫn là lỗi code.
- Có regression test tái hiện và fail vì đúng lỗi trước khi sửa, pass sau khi sửa và fail lại khi bỏ riêng bản sửa; không tắt test, không đổi expected trái đặc tả.
- Sửa tối thiểu đúng phạm vi; lỗi phát hiện thêm ngoài scope chỉ báo vị trí/tác động và xin phép.
- Gán mức độ S1–S4 theo impact (chức năng, người dùng, mất/sai dữ liệu, bảo mật) để ưu tiên; dữ liệu/database thật chỉ đọc, không lộ secret/PII khi thu bằng chứng.
- Bug bảo mật bắt buộc qua [`review-web-security`](../skills/review-web-security/SKILL.md); không ghi payload khai thác, token hay dữ liệu nhạy cảm vào báo cáo, log, commit hoặc PR công khai.
- Lỗi lúc có lúc không (intermittent/flaky): chạy lặp và ghi tần suất, thử điều kiện thời gian/đồng thời/tài nguyên chung; không kết luận "flaky" khi chưa tìm ra nguyên nhân.
- Bug UI: chụp ảnh lỗi trước khi sửa và ảnh sau khi sửa cùng route/viewport, lưu tại `.agents/storage/evidence/<task-slug>/`, báo cáo kèm `URL`/`Ảnh chứng` theo [`frontend`](./frontend.md); không chụp được phải ghi rõ lý do.
- Kiểm chứng lại case lỗi, case bình thường, case biên, regression và hiệu năng liên quan; phần chưa xác minh trên môi trường mục tiêu phải ghi rõ, không báo pass khi chưa chạy.

Quy trình, kiểm tra theo loại lỗi và checklist chất lượng: [`debugs`](../skills/debugs/SKILL.md). Database: [`backend`](./backend.md#database-read-only-mặc-định). Phạm vi: [`coding`](./coding.md#kiss-yagni-và-phạm-vi).
