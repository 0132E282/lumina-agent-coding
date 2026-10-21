# 📋 Viết plan — JSON Schema + Task dạng bảng

**Phạm vi**: kế hoạch triển khai (implementation plan) do [`planner-agent`](../agents/planner-agent.md) xuất ra — không áp dụng cho report ([`rules/docs-sync`](./docs-sync.md) vẫn Markdown) hay tài liệu `system-design-agent`/`requirement-analysis-agent`.

## Cách áp dụng

- Plan mode native: áp dụng [`workflow-plan`](../skills/workflow-plan/SKILL.md) làm phần mở rộng quy trình. Quyền ghi/vị trí/format của runtime có ưu tiên: chưa được ghi repo thì dùng output/plan file được phép và ghi rõ JSON/index chưa lưu; không vượt giới hạn qua subagent. Schema dưới đây dùng cho JSON bàn giao khi runtime cho phép ghi.
- Ghi plan thành **JSON hợp lệ** tại `docs/plans/<title-slug>-<yyyyMMdd>.json` với `title`, `description`, `tags`, `content`, `createdAt` (`YYYY-MM-DD`); `content` theo schema bên dưới. Cập nhật `docs/plans/index.json` cùng lượt (entry chỉ `title`, `description`, `tags`, `path`; description nêu khi nào AI nên tham khảo plan). Không dùng Markdown tự do hay bảng Markdown rời rạc làm plan.
- `tasks` là **mảng object đồng nhất field**: mọi task dùng đúng bộ field dưới; field không có dữ liệu để `null`/`[]`, không xóa key.

| Field | Kiểu | Nội dung |
|---|---|---|
| `id` | string | `TASK-xxx` |
| `title` | string | Tên nêu rõ kết quả |
| `status` | enum | `TODO \| IN_PROGRESS \| BLOCKED \| DONE` |
| `priority` | enum | `P0 \| P1 \| P2` |
| `priorityReason` | string | Lý do ưu tiên |
| `requirements` | string[] | `REQ-xxx`/`BR-xxx` liên quan |
| `acceptanceCriteria` | string[] | `AC-xxx` liên quan |
| `inScope` | string | Trong phạm vi task |
| `outOfScope` | string | Ngoài phạm vi task |
| `dependencies` | string[] | `TASK-xxx` phụ thuộc, hoặc `[]` |
| `approach` | string | Hướng triển khai |
| `filesToChange` | object[] | File repo-relative cần sửa; mỗi object có `path` và `changes` mô tả chính xác thay đổi dự kiến |
| `test` | string | Dữ liệu, thao tác, kết quả mong đợi |
| `doneWhen` | string | Điều kiện hoàn thành đo được |

- Các mục nhiều bản ghi cùng cấu trúc (`requirements`, `acceptanceCriteria`, `traceability`, `remainingRisks`...) cũng là mảng object cùng field — xem [`agents/planner-agent.md`](../agents/planner-agent.md#định-dạng-kế-hoạch-đầu-ra). Mô tả dài (`technicalSolution`, ghi chú rủi ro) vẫn được là string nhiều dòng.
- Ghi tuần tự theo từng phần, nhưng mỗi lần `Write` phải là JSON hợp lệ — phần chưa làm để `null`/`[]`.

```json
{
  "tasks": [
    {
      "id": "TASK-001",
      "title": "Thêm API tạo đơn",
      "status": "TODO",
      "priority": "P0",
      "priorityReason": "Ảnh hưởng doanh thu",
      "requirements": ["REQ-001"],
      "acceptanceCriteria": ["AC-001"],
      "inScope": "Tạo đơn qua API /orders",
      "outOfScope": "Thanh toán",
      "dependencies": [],
      "approach": "Validate input, tạo transaction, trả response",
      "filesToChange": [
        {"path": "src/orders/order.controller.ts", "changes": "Thêm POST /orders và gọi OrderService sau khi xác thực request."}
      ],
      "test": "POST /orders với payload hợp lệ/không hợp lệ",
      "doneWhen": "AC-001 pass, có test, không lỗi linter"
    }
  ]
}
```

## Khi áp dụng

- `planner-agent` (hoặc agent khác được giao lập kế hoạch) đọc `docs/plans/index.json`, xuất plan mới, cập nhật index. Mỗi task nêu file path cần sửa và thay đổi cụ thể; chỉ ghi path đã xác minh từ repository, điểm chưa xác định chuyển thành câu hỏi mở.
- `reviewer-agent` review plan, hoặc `coding-agent`/`/implement` đọc plan để biết task `TODO` — đọc đúng field JSON, không suy đoán cấu trúc.
- **Không áp dụng** cho báo cáo của skill [`report`](../skills/report/SKILL.md) hay `docs/system-design.md`/`docs/requirement-analysis.md` (giữ Markdown).
