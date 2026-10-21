# ❓ Câu hỏi mở — Dạng text, mỗi câu một mục

**Phạm vi**: áp dụng cho **mọi** agent/skill (không riêng `planner-agent`) khi cần người dùng chốt nhiều câu hỏi mở/giả định/quyết định trước khi tiếp tục — là quy ước trình bày trong hội thoại (chat), khác với [`rules/plan-format`](./plan-format.md) (định dạng file JSON của `planner-agent`). Giữ tên file cũ để không gãy tham chiếu.

## Cách áp dụng

- Có **từ 2 câu hỏi mở trở lên** → trình bày dạng text, **không dùng bảng Markdown**. Mỗi câu một mục, ngăn cách bằng dòng 80 dấu `-` đặt trong inline code (không dùng `---`/`----------` trần vì Markdown render thành đường kẻ ngắn).
- Nhãn tối thiểu: `Câu hỏi:`, `Đề xuất:` (nếu có). Thêm `Ảnh hưởng nếu chọn sai:` khi quyết định rủi ro cao (tiền, mất dữ liệu, phân quyền — [`rules/data-safety`](./data-safety.md)).
- Chỉ có **1 câu hỏi duy nhất** → hỏi thẳng bằng câu bình thường.
- Không áp dụng cho `AskUserQuestion` hoặc tool hỏi có UI riêng của runtime.

```markdown
<!-- ✅ Mỗi câu hỏi một mục -->
`--------------------------------------------------------------------------------`
Câu hỏi 1: Giữ song song `customer_groups` legacy hay thay hoàn toàn bằng Segment?
Đề xuất: Thay thế dần
`--------------------------------------------------------------------------------`
Câu hỏi 2: Segment tạo từ Sapo customer_group nên là static hay dynamic?
Đề xuất: Static
```
