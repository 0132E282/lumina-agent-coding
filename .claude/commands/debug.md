---
description: "Debug và sửa lỗi theo skill debugs: tái hiện, nguyên nhân gốc, regression test, sửa qua coder, báo cáo Debug"
argument-hint: "[mô tả lỗi | log | URL | issue]"
---

Debug và sửa lỗi: $ARGUMENTS

- Đọc và làm theo skill [`debugs`](../skills/debugs/SKILL.md) và rule [`bug-fix`](../rules/bug-fix.md): xác định expected/actual, tái hiện, thu bằng chứng, khoanh vùng, nguyên nhân gốc.
- Thiếu mô tả lỗi thì dùng lỗi đang bàn trong phiên; không có thì hỏi một câu trước khi làm.
- Chẩn đoán ở phiên chính; sửa code giao agent `coder` với nguyên nhân gốc, `file:dòng` và regression test cần fail trước sửa. Chỉ được yêu cầu chẩn đoán ("chỉ debug", "chưa sửa") thì dừng ở nguyên nhân và đề xuất sửa.
- Database/production chỉ đọc; log production đọc qua MCP đang kết nối theo [`search-priority`](../rules/search-priority.md).
- Báo cáo bằng skill `report`, mẫu Debug. Không tự commit/push. Codex dùng `$workflow-debug` tương đương.
