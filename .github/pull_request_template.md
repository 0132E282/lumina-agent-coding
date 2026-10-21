## Tóm tắt

<!-- Thay đổi chính và lý do. -->

## Kiểm chứng

- [ ] `npm test`
- [ ] Đã chạy: case lỗi, case bình thường, case biên, regression liên quan (ghi lệnh/kết quả)
- [ ] `python3 scripts/check-agent-config.py`
- [ ] UI: ảnh trước/sau cùng route/viewport (bỏ nếu không có UI)

## Sửa bug (bỏ nếu không phải bug fix)

Theo [`rules/bug-fix`](../.agents/rules/bug-fix.md); reviewer kiểm mục C10 trong [checklist review](../.agents/skills/workflow-review/references/code-review-checklists.md).

- Mức độ: S1 | S2 | S3 | S4
- Nguồn gốc: code | dữ liệu | cấu hình/môi trường | input người dùng | dependency
- Nguyên nhân gốc và bằng chứng:
- Regression test (`file:dòng`): fail trên base (dán output `verify-regression.sh`), pass sau sửa, fail lại khi bỏ riêng bản sửa
- Ảnh UI trước/sau (nếu bug UI):
- Bảo mật: có/không (có thì đã qua `review-web-security`, không ghi payload khai thác)
