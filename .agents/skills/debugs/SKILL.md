---
name: debugs
description: Chẩn đoán và sửa lỗi dựa trên đặc tả và bằng chứng — tái hiện, khoanh vùng, nguyên nhân gốc, sửa tối thiểu, kiểm chứng regression/hiệu năng/bảo mật. Dùng khi cần debug hành vi sai, exception, HTTP 4xx/5xx, test thất bại, lỗi chỉ có trên production hoặc lỗi hiệu năng; dùng được với Claude Code, Codex và các coding agent khác.
license: MIT
metadata:
  version: "1.2"
---

# Debugs

Thực thi [`rules/bug-fix`](../../rules/bug-fix.md): không sửa lỗi dựa trên phỏng đoán, cần bằng chứng, nguyên nhân gốc và kiểm chứng sau sửa. Dùng công cụ đọc, tìm kiếm và chạy lệnh có sẵn của agent. Kiểm tra theo loại lỗi và checklist chất lượng: [references/checklist.md](references/checklist.md).

## Quy trình

1. **Xác định lỗi và căn cứ**: đọc hướng dẫn áp dụng (`AGENTS.md`, `CLAUDE.md` hoặc tương đương), rồi đặc tả trong README, `docs/`, issue hoặc yêu cầu người dùng. Ghi thông báo lỗi, thời điểm, môi trường, thao tác gây lỗi và **expected vs actual**. Thiếu hoặc mâu thuẫn ảnh hưởng cách sửa thì hỏi phần cần xác nhận.
2. **Tái hiện và thu bằng chứng**: chạy trường hợp nhỏ nhất gây lỗi; bug UI thì chụp ảnh lỗi (route, viewport, trạng thái) vào `.agents/storage/evidence/<task-slug>/` bằng trình duyệt có sẵn (Playwright/Chromium); không tái hiện được thì ghi rõ điều kiện xảy ra đã biết. Lỗi lúc có lúc không: chạy lặp N lần, ghi tỉ lệ fail, thử song song/đổi thời gian/tài nguyên chung (thư mục, port, cache, DB) để lộ race. Bằng chứng không phải ảnh (log, HAR, output) lưu đã che secret vào cùng thư mục evidence, đặt tên `<yyyyMMdd-HHmm>-<loại>.<ext>`; trước khi dẫn vào báo cáo chạy `grep -rEnIi -e 'AKIA[0-9A-Z]{16}' -e 'BEGIN [A-Z ]*PRIVATE KEY' -e '(api[_-]?key|secret|token|password)[^[:alnum:]]{0,3}[:=]' .agents/storage/evidence/<task-slug>/` và che mọi dòng khớp. Thu log, stack trace, HTTP status, request/response, SQL/query và dữ liệu đầu vào thật — chỉ đọc, database theo [`rules/backend`](../../rules/backend.md#database-read-only-mặc-định). Không lộ secret/PII trong ghi chép.
3. **Khoanh vùng và nguồn gốc**: xác định tầng lỗi (frontend, API, service, database, queue, network, hệ thống ngoài) và nguồn gốc: code, dữ liệu, cấu hình/môi trường, input/thao tác người dùng ngoài đặc tả, dependency. Input sai mà hệ thống không validate/báo lỗi rõ vẫn tính là lỗi code. Thu hẹp bằng chia đôi: tắt/thay từng thành phần, gọi thẳng tầng dưới (API thay UI, query thay API) để biết lỗi nằm trên hay dưới điểm cắt. Regression thì đối chiếu thay đổi gần đây (`git log`/`git bisect`).
4. **Tìm nguyên nhân gốc**: đặt giả thuyết, kiểm từng giả thuyết, mỗi lần đổi một yếu tố; phân biệt nguyên nhân gốc với triệu chứng. Truy ngược nguyên nhân bằng câu hỏi "vì sao" liên tiếp tới điểm sửa được trong code/cấu hình. Gán **mức độ S1–S4** theo impact ([checklist](references/checklist.md#mức-độ)); có dính **bảo mật** (phân quyền, lộ dữ liệu, injection, XSS, xác thực) thì chuyển luồng [`review-web-security`](../review-web-security/SKILL.md), không ghi payload khai thác vào báo cáo/log.
5. **Sửa tối thiểu đúng phạm vi**: tạo regression test và xác nhận fail vì lỗi đang xét trước khi sửa (assert đúng triệu chứng, không chỉ "có exception"); không tự động hóa được thì ghi cách kiểm tra trước/sau. Sửa nguyên nhân, không workaround tùy tiện, không refactor ngoài phạm vi, không tắt test hoặc đổi expected trái đặc tả. Chỉ được yêu cầu chẩn đoán thì báo nguyên nhân và đề xuất sửa.
6. **Kiểm chứng**: chạy lại trường hợp lỗi, trường hợp bình thường và biên; bug UI chụp ảnh sau sửa cùng route/viewport để so với ảnh trước; regression test, test liên quan và lint/type check phù hợp. Chứng minh test fail trên base và pass trên bản sửa bằng `bash .agents/skills/debugs/scripts/verify-regression.sh <base-ref> -- <lệnh test>` (exit 0 mới đạt; đọc log để chắc base fail vì đúng assertion, không phải lỗi môi trường). Chứng minh bản sửa nhắm đúng nguyên nhân: tạm bỏ riêng thay đổi sửa lỗi thì regression test fail lại, khôi phục thì pass. Bắt buộc đo (không chỉ rà tĩnh) khi lỗi được báo là chậm/tốn tài nguyên, bản sửa đổi query/vòng lặp/cache trên luồng nóng, hoặc S1–S2 liên quan tải; ngoài ra mọi bản sửa trên luồng phụ thuộc dữ liệu rà N+1/vòng lặp theo [`complexity-performance`](../complexity-performance/SKILL.md). Lỗi hiệu năng đo trước/sau cùng điều kiện và ghi tối thiểu: latency p50/p95, số query/request, CPU/RAM khi đo được, kèm lệnh/công cụ đo; không đo được thì ghi chỉ rà tĩnh. Không xác minh được trên môi trường mục tiêu thì ghi rõ.
7. **Đánh giá sau sửa**: xác nhận không phát sinh lỗi mới; lỗi production thì nêu log/phương án theo dõi sau triển khai và ghi chú postmortem ngắn (timeline, nguồn gốc, tác động, bản sửa, cách phòng lặp lại). Dọn log tạm do mình thêm, giữ thay đổi của người dùng và cập nhật tài liệu bị ảnh hưởng.

## Báo cáo

Dùng skill `report`, mẫu [Debug](../report/assets/debug-report-template.md). Phân biệt dữ kiện với giả thuyết; mục checklist chưa đạt ghi là giới hạn; không báo pass cho kiểm tra chưa chạy.
