---
name: workflow-plan
description: "Bổ sung quy trình lập kế hoạch của project vào Plan mode có sẵn khi người dùng yêu cầu plan; khảo sát, thiết kế khi cần, task/AC/test và bàn giao, không triển khai."
---

# workflow-plan

## Kết hợp Plan mode

Đây là nguồn quy trình planning chung, không phụ thuộc command riêng. Khi người dùng yêu cầu lập kế hoạch trong Plan mode của Claude/Codex/Antigravity, áp dụng skill này cùng hướng dẫn project. Có thể gọi `$workflow-plan` nếu cần; không cần `/plan` custom.

- Mode, quyền ghi và định dạng trả lời do runtime quyết định. Skill không tự bật/tắt mode, không giả lập tool chuyển mode, không vượt read-only bằng subagent.
- Không sửa code sản phẩm, cài dependency, migrate hoặc commit/push khi đang planning. Tái dùng handoff/plan còn hợp lệ; không chạy lại phân tích cho cùng input.
- Không ghi plan file chuyên biệt của runtime ngoài repo hay dưới `~/` (vd `~/.claude/plans/`, `~/.codex/`, `~/.gemini/`), kể cả khi Plan mode của Claude/Codex/Antigravity gợi ý; plan chỉ lưu trong repo theo [`plan-format`](../../rules/docs.md#implementation-plan-contract). Khi native mode read-only, trình bày plan trong chat, ghi rõ JSON/index chưa lưu, rồi lưu ngay sau khi được duyệt và trước triển khai. Không nói đã lưu khi chưa ghi.

## Khảo sát và báo cáo trước khi lập plan

Khi yêu cầu plan là một tính năng, luồng hoặc khu vực của dự án (không phải thay đổi nhỏ đã rõ file), chưa lập plan ngay: dùng [`system-understanding`](../system-understanding/SKILL.md) đọc toàn bộ phần dự án liên quan, rồi báo cáo cho người dùng mọi chỗ **cần fix** và **cần làm** (có `file:dòng`, bằng chứng, tác động). Chỉ lên plan sau khi người dùng đã xem báo cáo và chốt phạm vi; không tự chuyển bước.

## Quy trình theo phạm vi

1. Đọc yêu cầu và hướng dẫn project; đọc `docs/plans/index.json` nếu có, tìm bằng title/description/tags rồi mở file liên quan qua path. Tái sử dụng `docs/requirement-analysis.md`/`docs/system-design.md` nếu còn đúng. Khảo sát stack, file và hành vi bị ảnh hưởng; không dump toàn repo.
2. Research chỉ khi thiếu bằng chứng. System design chỉ khi cần HLD/LLD/mô hình dữ liệu mới; dùng vai trò tương ứng và file handoff khi runtime cho phép. Không mặc định full pipeline cho thay đổi nhỏ.
3. Dùng vai trò [`planner`](../../agents/planner.md) để lập yêu cầu → task → AC → test, phạm vi, dependency, file/hành vi cụ thể, thứ tự thực hiện, rollback/rủi ro và câu hỏi còn thiếu. Chỉ giao subagent khi workflow/phạm vi cần và runtime hỗ trợ; nếu không, thực hiện planning tuần tự theo vai trò, không giả lập delegation.
4. Review plan khi độ phức tạp/rủi ro cần hoặc người dùng yêu cầu. `reviewer` chỉ nêu findings; planner xử lý findings trong phạm vi kế hoạch. Báo ngắn phần đã chốt/còn thiếu, không tự chuyển sang implement.
5. Khi được phép ghi, lưu JSON hợp lệ tại `docs/plans/<title-slug>-<yyyyMMdd>.json` theo [`plan-format`](../../rules/docs.md#implementation-plan-contract), mỗi task có `filesToChange` là path đã xác minh. Cập nhật `docs/plans/index.json` với entry chỉ gồm `title`, `description`, `tags`, `path`. JSON trong repo là nguồn plan duy nhất.
6. Xuất Plan Summary bằng skill `report`, nêu trạng thái lưu file và kiểm chứng thật. Dùng điểm duyệt/thoát Plan mode của runtime; chỉ triển khai khi người dùng đã cho phép và runtime cho phép. Không tạo thêm vòng xác nhận trùng với phê duyệt đã có.
