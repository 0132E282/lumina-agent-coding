# Mẫu bàn giao nội bộ (subagent → agent điều phối)

Subagent dùng mẫu này thay cho báo cáo người dùng; agent điều phối gộp vào một báo cáo cuối. Text ngắn, không bảng, không kể quá trình, không lặp checklist đã đạt.

`------------------------`

**Kết quả**: một câu — xong | xong một phần | blocked (lý do)

**File đổi**:
- `path/to/file.ext` (thêm | sửa | xoá): thay đổi chính, một dòng

**Check đã chạy**:
- `lệnh` → kết quả thật (vd `npm test` 251/251 pass); check chưa chạy ghi `Chưa chạy` + lý do

**Chưa làm / ❌**: mục chưa đạt, blocker, phần chưa xác minh; `Không có` khi phù hợp

**Ngoài scope**: lỗi/đề xuất phát hiện thêm (vị trí, tác động), chưa sửa; `Không có` khi phù hợp
