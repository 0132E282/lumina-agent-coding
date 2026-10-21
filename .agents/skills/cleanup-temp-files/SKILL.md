---
name: cleanup-temp-files
description: Dọn dẹp file tạm/scratch/debug/test thử nghiệm do CHÍNH Claude tạo ra trong lúc làm task (không phải deliverable) để tránh phình dự án — xóa thẳng, không cần hỏi xác nhận vì là file tự tạo trong session hiện tại. KHÔNG xóa test chính thức thuộc bộ test suite của project (unit/integration/regression — xem rules/delivery.md) và KHÔNG xóa file không rõ nguồn gốc/có sẵn trong workspace (việc đó thuộc agent workspace-auditor-agent, luôn phải liệt kê + chờ xác nhận). Dùng ngay trước khi báo "hoàn thành task", hoặc khi người dùng yêu cầu dọn file tạm/rác do Claude tạo ra.
license: MIT
metadata:
  version: "1.0"
---

# 🧹 Cleanup Temp Files

Skill dọn dẹp file tạm do **chính mình (Claude) tạo ra** trong lúc làm task hiện tại — script thử một lần, file output trung gian, bản nháp trước khi tổng hợp, file test viết ra chỉ để tự kiểm tra thủ công (không thuộc bộ test suite chính thức).

## Phạm vi — chỉ xóa khi cả 2 điều kiện đúng

1. **Do mình tạo ra trong session hiện tại** (nhớ rõ đã `Write`/tạo file đó lúc nào, để làm gì).
2. **Không phải deliverable**: không phải code được yêu cầu, không phải test chính thức (xem dưới), không phải doc được yêu cầu tạo.

Không chắc một trong hai điều kiện → **không xóa**. Việc quét file không rõ nguồn gốc/có sẵn trong toàn workspace là phạm vi của agent [`workspace-auditor-agent`](../../agents/workspace-auditor-agent.md) (luôn liệt kê + chờ xác nhận người dùng), không phải skill này.

## Không xóa — test chính thức

Theo [`rules/delivery.md`](../../rules/delivery.md#chất-lượng-và-bằng-chứng), test thuộc bộ test suite của project (file nằm đúng cấu trúc test của framework, được chạy bởi lệnh test chính thức, đặc biệt regression test viết sau khi fix bug) là **deliverable**, không phải rác — giữ lại trong codebase dù task đã xong.

Dấu hiệu phân biệt file test là rác (nên xóa) vs chính thức (giữ lại):

| | Rác — nên xóa | Chính thức — giữ lại |
|---|---|---|
| Vị trí | Ngoài cấu trúc test của project, hoặc ở scratchpad/`/tmp` | Đúng thư mục/convention test của framework |
| Mục đích | Tự kiểm tra thủ công một lần trong lúc debug | Regression/unit/integration test cho hành vi cần khóa lại |
| Có trong lệnh test chính thức không | Không (`npm test`, `pytest`... không chạy tới nó) | Có |

## Quy trình

1. Lấy danh sách ứng viên bằng script (đáng tin hơn tự nhớ lại, nhất là sau khi context đã bị compact):
   ```bash
   bash .claude/skills/cleanup-temp-files/scripts/find-session-scratch-files.sh "$SESSION_ID"
   ```
   Script đọc `.agents/storage/logs/logs.jsonl` (ghi bởi hook `audit-log`), chỉ lấy file đã `Write` **trong session hiện tại**, **trong phạm vi dự án** (so khớp `cwd`), còn tồn trên đĩa, và khớp pattern tên file tạm (`tmp`/`scratch`/`debug`/`draft`/`sandbox`/`test-output`/`.bak`/`.orig`...). Không tự xóa gì, không quét ra ngoài dự án.
2. Với mỗi ứng viên script trả về, xác nhận lại theo bảng trên — loại nào rác, loại nào giữ lại. Script chỉ gợi ý theo tên file, có thể báo sai (ví dụ file tên có "draft" nhưng là deliverable thật) — Claude luôn tự xác nhận trước khi xóa, không xóa máy móc theo script.
3. Xóa trực tiếp các file rác đã xác định (không cần hỏi xác nhận — tự chịu trách nhiệm vì là file tự tạo).
4. Báo ngắn gọn: đã xóa file nào, giữ lại file nào vì là deliverable/test chính thức.

Ưu tiên không tạo file tạm trong repo từ đầu — dùng scratchpad directory hoặc `/tmp` khi có thể, để không phải dọn lại. Hook `remind-cleanup` (xem [`hook/README.md`](../../hooks/README.md)) tự nhắc ở cuối session nếu phát hiện ứng viên chưa dọn.

## Khi áp dụng

- Trước khi báo "hoàn thành task", nếu trong lúc làm có tạo file tạm/scratch/debug/test thử.
- Khi người dùng yêu cầu dọn file tạm/rác do Claude tạo ra.
- **Không** dùng cho file không rõ Claude có tạo ra hay không, hoặc file có sẵn trong workspace trước khi task bắt đầu — chuyển sang `workspace-auditor-agent`.
