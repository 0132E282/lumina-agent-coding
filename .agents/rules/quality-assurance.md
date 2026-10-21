# ✅ Chất lượng — Test + Static Analysis + Code Review

**Nhóm quy tắc kết hợp**: Test + Static Analysis + Code Review

## Cách áp dụng

- **Test luồng quan trọng**: ưu tiên business logic, edge case, luồng ảnh hưởng tiền/dữ liệu nhạy cảm; không cần cover 100%, nhưng không bỏ luồng rủi ro cao.
- **Static analysis** (linter/type checker) chạy trước khi chạy thử — bắt buộc trước khi báo hoàn thành.
- **Newline cuối file**: trước bàn giao/commit, kiểm tra file text mới/sửa (gồm JSON/index/docs/config) bằng `node .agents/hooks/scripts/ensure-final-newline.mjs --check <file...>` với danh sách file thật trong scope và `git diff --check` (`git diff --check` một mình không chứng minh có newline cuối file). Có lỗi thì sửa đúng file và kiểm tra lại. Claude có hook sau Edit/Write; Codex/Antigravity phải chạy check thực tế, không giả lập hook. Repo chưa có script thì dùng formatter/checker sẵn có hoặc kiểm tra byte cuối; không tự cài dependency.
- **Code review**: thay đổi đáng kể nên được review lại (tự review nếu không có người khác) — đúng phạm vi, đúng chuẩn, không phá hành vi hiện có.
- **Diff và đường chạy bị ảnh hưởng**: kiểm tra thay đổi component/page ngoài yêu cầu, vòng lặp render/state/effect và N+1 xuyên stack (request frontend lặp theo item; backend/ORM lazy-load hoặc query theo từng record ở Laravel, EF/SQL hay ORM khác). Backend/data access: đếm query cho một request/job với nhiều record bằng query log/profiler/test instrumentation sẵn có, xem số query có tăng theo số record không. Frontend: kiểm tra network/API call có nhân theo số item không. Không có công cụ đo thì rà code path tĩnh và ghi rõ chưa đo. Chỉ rà luồng liên quan task, không audit toàn hệ thống.
- Lỗi ngoài phạm vi và có từ trước: không tự sửa; báo vị trí/tác động và xin chấp thuận. Lỗi do diff hiện tại hoặc thuộc hành vi được giao: sửa và kiểm tra lại trước khi hoàn thành.
- Sửa bug → **viết test tái hiện trước khi fix** (regression test).
- **Phạm vi kiểm tra tương xứng task**: mức nhỏ nhất đủ cho hành vi/contract vừa đổi; full suite/E2E chỉ khi người dùng yêu cầu rõ hoặc có gate release/CI.
- Kiểm thử theo module/tính năng: áp dụng [`black-box-feature-testing`](../rules/black-box-feature-testing.md); không tạo quy tắc song song ở đây.
- Repo có `docs/testcases/index.json`: đọc trước khi thiết kế/chạy; lưu testcase và kết quả thực tế vào đó, giữ ID/history, không ghi Pass/Fail khi chưa có bằng chứng.
- Review cần lưu hồ sơ: ghi JSON dưới `docs/reviews/` và cập nhật `docs/reviews/index.json`; không sửa artifact đang review.
- Người dùng nói rõ không cần test/check thì tôn trọng, không lách bằng cách đổi lệnh hay chạy ngầm. Luôn nói rõ đã kiểm tra gì và còn thiếu gì.

### Checklist trước khi hoàn thành

- [ ] Luồng chính và edge case quan trọng đã có test?
- [ ] Không có lỗi linter/type checker?
- [ ] Test hiện có vẫn pass (không phá vỡ tính năng cũ)?
- [ ] Đã tự review lại diff trước khi báo cáo xong?
- [ ] Đã rà phạm vi component/page, vòng lặp render/state/effect và N+1 xuyên stack; đã đếm query/request hoặc ghi rõ chỉ kiểm tra tĩnh?
