# Mẫu báo cáo dependency audit

Dùng sau khi skill `dependency-audit` chạy audit read-only. Dạng text, không bảng; chỉ liệt kê lệnh để người dùng tự chạy, không tự upgrade.

`--------------------------------------------------------------------------------`

Package: `pkg-name`
Severity: critical | high | medium | low (theo tool)
Version: `x.y.z` → `x.y.z` (fix tối thiểu)
Loại thay đổi: patch | minor | major

- Lệnh đề xuất: `npm install pkg@x.y.z`
- Rủi ro breaking (nếu fix nhảy major): [thay đổi cần test lại]

`--------------------------------------------------------------------------------`

**Ecosystem / Tool đã chạy**: [npm/composer/pip/cargo/go] — `[lệnh audit]`

**Không audit được**: [package/ecosystem thiếu tool, hoặc `Không có`; không bịa kết quả]

**Đánh giá**: [kết luận, thứ tự nâng cấp đề xuất]
