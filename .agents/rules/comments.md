---
trigger: model_decision
description: "Áp dụng khi nhiệm vụ liên quan: 💬 Comment có kỷ luật — Minimal Comments + Better Comments"
---

# 💬 Comment có kỷ luật — Minimal Comments + Better Comments

**Nhóm quy tắc kết hợp**: Minimal Comments + Better Comments Convention

## Khi nào được comment

- **Mặc định không comment.** Tên hàm/biến phải tự giải thích (xem [coding-principles.md](./coding-principles.md)).
- **Không comment logic đơn giản**: gán biến, gọi hàm tên rõ, `if`/vòng lặp hiển nhiên, CRUD, getter/setter.
- Chỉ comment khi giải thích **"tại sao"** mà code không tự nói được: ràng buộc nghiệp vụ, workaround, hành vi bất ngờ của thư viện/bên thứ ba.

## Nhãn comment (Better Comments)

| Nhãn | Ý nghĩa | Ví dụ |
|---|---|---|
| `*` | Thông tin quan trọng cần chú ý | `// * Tiền lưu int VND — không nhân 100.` |
| `!` | Cảnh báo: nguy hiểm, deprecated | `// ! Đổi thứ tự sẽ ghi đè locale khác.` |
| `?` | Câu hỏi / điểm cần xác nhận | `// ? Có nên expose method này ra API public?` |
| `TODO:` | Việc còn thiếu — kèm ngữ cảnh cụ thể | `// TODO: dispatch NewOrderNotification sau khi tạo đơn.` |
| `@param`/`@return` | Chỉ khi thêm thông tin kiểu mà signature không có | `@return array<string, int>` |

```php
/**
 * * Idempotent: VNPay gọi IPN nhiều lần cho cùng giao dịch.
 */
public function verifyIPN(array $data): array
{
    // ! Phải xác minh chữ ký trước khi đọc số tiền.
}
```

## Cấm

- Code bị comment-out (`// $old = ...`) — xoá, git đã lưu lịch sử.
- `TODO` không ngữ cảnh, comment lỗi thời, banner/đường kẻ trang trí.
- PHPDoc/JSDoc lặp lại đúng signature đã có trong code.

## Độ dài

- Mỗi dòng comment ≤ 180 ký tự; tối đa 1–3 dòng. Cần dài hơn ⇒ đưa vào docs thay vì nhồi vào comment.
- **Sắp viết tới dòng comment thứ 4 cho cùng một đoạn → dừng lại ngay**, không viết tiếp rồi tự nhủ "giải thích cho đủ". Chọn 1 trong 2: (a) chỉ giữ đúng 1-3 dòng cốt lõi nhất — invariant/hệ quả nếu làm sai, bỏ phần diễn giải "vì sao đi đến kết luận này"; (b) nếu logic phức tạp tới mức cần nhiều đoạn lý luận, đó là dấu hiệu nên tách hàm riêng tên rõ nghĩa (xem [coding-principles.md](./coding-principles.md)) hoặc ghi vào docs, không nhồi hết vào comment.
- Nhiều ràng buộc cần cảnh báo trong cùng một đoạn code → mỗi ràng buộc 1 dòng `!` riêng, không gộp thành một đoạn văn dài nhiều câu.
- Khi sửa code, cập nhật hoặc xoá comment liên quan nếu nó không còn đúng.

```php
// ❌ Một đoạn văn 4+ dòng vừa giải thích lý do vừa liệt kê hệ quả — vượt giới hạn, khó đọc lướt
// Field A luôn có giá trị hợp lệ kể cả khi không thuộc nhóm B (fallback = chính nó) — không được
// gate theo cờ C, nếu không bản ghi đứng riêng sẽ không bao giờ match được dữ liệu cũ và bị tạo
// trùng mỗi lần đồng bộ, gây lệch số liệu báo cáo về sau.

// ✅ Rút còn đúng invariant + hệ quả nếu làm sai, dùng nhãn !
// ! Không gate theo cờ C — field A luôn hợp lệ dù không thuộc nhóm B, nếu không bản ghi standalone sẽ bị tạo trùng mỗi lần sync.
```
