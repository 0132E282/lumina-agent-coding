---
name: testing-playwright
description: "Kiểm thử UI/E2E và API bằng Playwright: viết và chạy test theo testcase, lưu evidence vào .agents/storage/<task-slug>/, liệt kê đủ API đã test. Dùng khi cần test giao diện, luồng người dùng hoặc API bằng Playwright; không tự cài package."
license: MIT
metadata:
  version: "1.0"
---

# Kiểm thử bằng Playwright

Bổ sung cho [`testing`](../testing/SKILL.md) và [`workflow-test`](../workflow-test/SKILL.md): testcase, ID và kết quả vẫn theo [`testcase`](../testing/references/testcase.md); skill này chỉ nói cách chạy bằng Playwright.

## Điều kiện

1. Kiểm tra project đã có Playwright (`@playwright/test` trong `package.json`, `npx playwright --version` resolve được) và trình duyệt đã cài. Chưa có thì dừng, báo thiếu gì và giao `setup` hoặc hỏi người dùng; không tự `npm install` hay tải trình duyệt khi chưa được yêu cầu.
2. App cần test phải chạy được (dev server hoặc URL staging do người dùng cung cấp). Không test trên production khi chưa được cho phép; database thật chỉ đọc ([`backend`](../../rules/backend.md#database-read-only-by-default)).
3. Dùng config và thư mục test sẵn có của project; không tạo cấu trúc mới khi chưa cần.

## Test UI / E2E

- Một testcase = một test; locator theo `getByRole`/`getByLabel`/`getByText` trước, `data-testid` khi cần; không dùng `waitForTimeout` cố định, chờ bằng assertion có auto-wait.
- Ảnh luôn có **trước** và **sau** cùng route và viewport ([`rules/frontend`](../../rules/frontend.md)): đặt tên `<testcase-id>-before.png` / `<testcase-id>-after.png`, lưu cùng log/trace trong `.agents/storage/<task-slug>/` theo [`artifacts`](../../rules/artifacts.md). Cấu hình output của Playwright vào thư mục này nếu được; nếu runner bắt buộc ghi nơi khác, chuyển evidence cần dùng rồi xóa output tạm của task trước khi handoff.
- Chạy tối thiểu desktop (1440×900) và mobile (390×844) khi UI có responsive; ghi rõ viewport trong kết quả.
- Kiểm thử cả trường hợp lỗi: input không hợp lệ, trạng thái rỗng/loading/lỗi, quyền truy cập.
- Không chụp hoặc không chạy được thì ghi rõ lý do, không coi là Pass.

## Test API

- Dùng `request` fixture của Playwright cho API thuần; luồng UI gọi API thì kiểm bằng `page.waitForResponse`.
- Báo đầy đủ **mọi API đã test**: từng endpoint, tham số, request và response thật (status, body), kết quả `Đúng | Sai` theo [`testcase` mục 7.2](../testing/references/testcase.md#72-evidence-and-api-results); API chưa chạy ghi `Chưa chạy`, không bịa response; không ghi token/secret vào evidence.

## Chạy và báo kết quả

- Chạy bằng lệnh test của project (ví dụ `npx playwright test`), headless; chạy lại case fail để phân biệt lỗi thật và flaky; chưa tìm ra nguyên nhân thì không kết luận "flaky" ([`bug-fix`](../../rules/bug-fix.md)).
- Chỉ ghi Pass/Fail khi đã chạy và có bằng chứng (ảnh, trace, request/response); không sửa expected để test đạt, không tắt test.
- Artifact tạm của Playwright (`test-results/`, `playwright-report/`, trace) không được để lại ở các thư mục đó; chuyển evidence cần dùng vào task folder rồi xóa output tạm. Không commit storage artifacts.
- Test mới chính thức nằm trong thư mục test của project là deliverable; test thử nghiệm dùng một lần thì xoá, không commit.
