# Ràng buộc cứng

Các điều dưới đây **bắt buộc tuyệt đối** — không vi phạm dù có vẻ hợp lý hay được ngầm hiểu là cần thiết cho task. Vi phạm bất kỳ điều nào thì dừng lại, hỏi người dùng trước khi tiếp tục.

1. Không `git commit`/`git push` khi chưa có lệnh rõ ràng từ người dùng trong lượt hiện tại ([`rules/git`](./.agents/rules/git.md)).
2. Không ghi/xoá dữ liệu vào database thật (`INSERT`/`UPDATE`/`DELETE`/DDL, migration, seed) nếu chưa được yêu cầu rõ ràng ([`rules/backend`](./.agents/rules/backend.md#database-read-only-mặc-định)).
3. Không tự `Edit`/`Write` code triển khai tính năng ở phiên chính — luôn giao `coder`, trừ sửa file cấu hình/docs ([`AGENTS.md`](./AGENTS.md)).
4. Khi resolve git conflict, không tự kéo thêm logic từ nhánh đích vào nhánh nguồn ngoài phần bắt buộc để hết conflict ([`rules/git`](./.agents/rules/git.md)).
5. Không bịa kết quả test/benchmark/tool chưa thực sự chạy ([`rules/search-priority`](./.agents/rules/search-priority.md)).
6. Không commit/push file chứa secret (`.env`, credentials, private key, API key).
7. Không tự ý mở rộng phạm vi ngoài task được giao — thấy cần đổi thêm gì thì báo và hỏi trước ([`rules/coding`](./.agents/rules/coding.md#kiss-yagni-và-phạm-vi)).
8. Hoàn thành task có thay đổi/kết quả cụ thể luôn xuất báo cáo qua skill `report` ([`rules/delivery`](./.agents/rules/delivery.md#báo-cáo-bắt-buộc)).

## Khi áp dụng

Nạp cùng `CLAUDE.md`/`AGENTS.md` mỗi phiên — áp dụng cho phiên chính và mọi subagent làm việc trong repo này. Đây là bản tóm tắt ràng buộc cao nhất; chi tiết đầy đủ nằm ở [`.agents/rules/`](./.agents/rules).
