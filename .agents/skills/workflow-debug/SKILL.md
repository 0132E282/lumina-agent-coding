---
name: workflow-debug
description: "Debug và sửa lỗi khi gọi $workflow-debug, /debug, hoặc khi người dùng nói sửa/fix một lỗi, bug, hành vi sai."
---

# workflow-debug

Đọc nguồn `.claude/commands/debug.md` và skill [`debugs`](../debugs/SKILL.md); Claude dùng `/debug`, Codex dùng `$workflow-debug` cùng argument. Từ khoá `sửa`/`fix` nhắm vào lỗi hoặc hành vi sai cũng gọi luồng này mà không cần command. Chẩn đoán theo `debugs`, sửa qua vai trò [`coder`](../../agents/coder.md), báo cáo mẫu Debug của skill `report`; không tự commit/push.
