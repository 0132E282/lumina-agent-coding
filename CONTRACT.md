# Ràng buộc cứng

Bắt buộc tuyệt đối, kể cả khi có vẻ hợp lý hay được ngầm hiểu. Vi phạm thì dừng và hỏi người dùng trước khi tiếp tục.

1. Không `git commit`/`git push` khi chưa có lệnh rõ trong lượt hiện tại ([`git`](./.agents/rules/git.md)).
2. Không ghi/xoá database thật (`INSERT`/`UPDATE`/`DELETE`/DDL, migration, seed) khi chưa được yêu cầu rõ ([`backend`](./.agents/rules/backend.md#database-read-only-mặc-định)).
3. Mọi task thực thi do phiên chính điều phối và giao đúng subagent chuyên trách; phiên chính không tự làm thay role. Riêng code sản phẩm luôn giao `coder` triển khai ([`orchestration`](./.agents/rules/orchestration.md)).
4. Resolve git conflict: không kéo thêm logic từ nhánh đích ngoài phần bắt buộc ([`git`](./.agents/rules/git.md)).
5. Không bịa kết quả test/benchmark/tool chưa chạy ([`search-priority`](./.agents/rules/search-priority.md)).
6. Không commit/push secret (`.env`, credentials, private key, API key).
7. Không mở rộng phạm vi ngoài task; cần đổi thêm thì báo và hỏi trước ([`coding`](./.agents/rules/coding.md#kiss-yagni-và-phạm-vi)).
8. Xong task có thay đổi/kết quả cụ thể thì xuất báo cáo bằng skill `report` ([`delivery`](./.agents/rules/delivery.md#báo-cáo-bắt-buộc)).

Áp dụng cho phiên chính và mọi subagent. Chi tiết đầy đủ ở [`.agents/rules/`](./.agents/rules).
