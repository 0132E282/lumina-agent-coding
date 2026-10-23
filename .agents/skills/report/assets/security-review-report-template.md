# Mẫu báo cáo security review

Trình bày kết quả đã review theo skill `review-web-security`; không bịa thêm trường. Dạng text, không bảng; giữ đủ chín nhãn mỗi finding.

`------------------------`

Finding #1: [Tiêu đề]
Severity: Critical | High | Medium | Low
Kết quả: Đúng | Sai
Vị trí: `path/to/file.ext:line` hoặc route

- Nguyên nhân gốc: [luồng dữ liệu/quyền bị vi phạm]
- Điều kiện khai thác: [tiền đề + kịch bản tái hiện tối thiểu trong môi trường thử nghiệm]
- Tác động: [phạm vi dữ liệu/tài khoản/tenant]
- Cách sửa: [patch hoặc hướng xử lý]
- Kiểm thử hồi quy: [case hợp lệ vẫn pass / case vượt quyền bị chặn / side effect cần tránh]
- CWE/OWASP: [mapping nếu xác minh được, bỏ nếu không chắc]

`------------------------`

**Tổng quan**: [X] lỗi đã xác nhận, mức cao nhất [mức], phạm vi đã review [...].

**Kết luận**: Đã kiểm thử [...] | Chưa kiểm thử/chưa đủ dữ kiện [...]. Thứ tự xử lý đề xuất: [...].

Không có lỗi xác nhận → ghi `Chưa phát hiện lỗi trong phạm vi đã kiểm tra`, không ghi `Không có lỗ hổng`.
