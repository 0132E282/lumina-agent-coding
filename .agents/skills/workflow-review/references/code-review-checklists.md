# Checklist review code backend và frontend

## Cách sử dụng

Chốt scope/SHA/file và đọc context, caller/callee, rule, manifest/lockfile, cấu hình formatter/linter trước khi kiểm tra. Dùng phần chung (C), backend (B), frontend (F) và xuyên tầng (X) tương ứng code trong phạm vi. Không coi một mục là lỗi chỉ vì checklist nhắc tới nó.

Mỗi ID phải có trạng thái `Đã kiểm tra` / `Lỗi xác nhận` / `Cần xác minh` / `Không áp dụng` / `Chưa kiểm tra`, vị trí/bằng chứng và lý do khi không áp dụng/chưa kiểm tra. `Đã kiểm tra` chỉ nghĩa là chưa phát hiện lỗi trong phần đã đọc hoặc kiểm chứng; không nghĩa là đảm bảo an toàn. Scope chỉ có một tầng thì ghi lý do không áp dụng cho nhóm còn lại.

Chạy parser/typecheck/linter/formatter/test có sẵn khi phù hợp, ở chế độ không sửa file; ghi lệnh và kết quả thật, thiếu công cụ ghi `Not Run`. Không chạy auto-fix, tự cài package, ghi DB thật hay thử khai thác phá hoại. Rule vi phạm phải dẫn tên rule và code; không áp sở thích cá nhân thành convention bắt buộc. Xác minh reference, dynamic import, reflection hoặc code generation trước khi kết luận code không được dùng.

## C — Chung cho mọi code

- **C01 Cú pháp và type:** parse/compile/import/export, type/nullability, async/await, promise không được xử lý; TypeScript không `any` theo rule dự án.
- **C02 Tuân thủ codebase/rule:** stack, cấu trúc module, naming, API convention, types, error handling; đối chiếu rule thực sự áp dụng và pattern hiện có.
- **C03 Format:** cấu hình formatter/linter thật, indent, quote, import order, whitespace và newline cuối file text không rỗng (kể cả JSON/index/docs); giữ LF/CRLF theo codebase. `git diff --check` không thay kiểm tra newline cuối file. Phân biệt lỗi format với lỗi logic.
- **C04 Code thừa:** unused import/variable/function, dead/unreachable branch, code comment-out, logic lặp, dependency/abstraction không cần thiết; chứng minh đường dùng trước khi kết luận.
- **C05 Logic và yêu cầu:** contract/AC, điều kiện/thứ tự xử lý, empty/null/boundary, lỗi, tính tương thích và thay đổi ngoài scope.
- **C06 Thiết kế và dễ đọc:** trách nhiệm, coupling, DRY/KISS, nesting, tên hàm/biến và comment đúng rule; không đề xuất refactor không có tác động cụ thể.
- **C07 Big O và tài nguyên:** xác định `n`/`m`, time/space đường chính và worst case, lookup/sort/traversal/đệ quy, allocation/preprocessing, I/O và concurrency; dùng complexity-performance. Nếu đề xuất tối ưu, ghi hiện tại → dự kiến, trade-off và phần chưa đo. Config/docs thuần túy ghi N/A.
- **C08 Bảo mật:** đọc review-web-security cùng references/checklist.md, đối soát cả 12 nhóm theo stack/scope; truy vết input → validation/quyền → sink, đọc middleware/helper thật. Kiểm tra secret/PII/log/error và dependency/lockfile liên quan; xác minh CVE/khuyến nghị theo phiên bản bằng nguồn chính thức khi cần, che giá trị nhạy cảm.
- **C09 Kiểm chứng:** test phù hợp cho success/error/boundary/quyền, regression và bằng chứng thật; phân biệt lỗi xác nhận, nghi vấn và khuyến nghị. Không kết luận Pass cho kiểm tra chưa chạy.
- **C10 Sửa bug:** chỉ áp dụng khi diff sửa lỗi; đối chiếu [`rules/bug-fix`](../../../rules/bug-fix.md) và [`debugs`](../../debugs/SKILL.md): nguồn gốc lỗi (code/dữ liệu/cấu hình-môi trường/input người dùng/dependency) và nguyên nhân gốc có bằng chứng; regression test assert đúng triệu chứng và fail trên code cũ (báo cáo phải trích kết quả `verify-regression.sh` hoặc lệnh + output fail trên base SHA; reviewer chạy lại test mới trên base SHA bằng `git worktree`/`git stash` ở bản sao khi chạy được; không chạy được thì `Cần xác minh` kèm lý do); bản sửa nhắm nguyên nhân, không workaround/che triệu chứng, không tắt test hay đổi expected trái đặc tả; case bình thường/biên và luồng liên quan không bị hỏng; bug UI có ảnh trước/sau cùng route/viewport (thiếu thì ghi `Cần xác minh`); mức độ S1–S4 hợp lý; bug bảo mật đã qua review-web-security và không lộ payload khai thác trong commit/PR/test.

## B — Backend

- **B01 Route/API contract:** method, status, schema/serialization, compatibility, pagination ổn định, filter/sort allowlist và validation tại boundary.
- **B02 Xác thực/session:** token/session lifecycle, expiry/revoke, cookie/CSRF theo cơ chế auth, reset password và đường bypass.
- **B03 Phân quyền:** quyền chức năng/đối tượng/field, ownership/tenant, bulk/export/download/preview, service account; kiểm tra trước khi đọc/ghi dữ liệu nhạy cảm.
- **B04 Input và injection:** SQL/NoSQL/command/template injection, deserialization, mass assignment, SSRF, path traversal; truy vết đến sink và kiểm tra parameterization/allowlist thực tế.
- **B05 Database và N+1:** query/lazy loading theo record, eager loading/batch, số query `Q(n)`, rows quét/trả, cột đọc, WHERE/JOIN/ORDER BY, index/plan nếu có; không suy Big O query từ số dòng code. Dùng database; thiếu plan/log ghi chỉ phân tích tĩnh.
- **B06 Nhất quán dữ liệu:** transaction, atomicity, race/lost update, uniqueness, idempotency/replay, rollback và side effect bên ngoài transaction.
- **B07 Big O backend:** thuật toán service/job, join/lookup trong RAM, serialize dữ liệu lớn, streaming/chunk/batch; giới hạn request/page/payload, timeout/retry/backoff và concurrency.
- **B08 File/upload:** quyền đọc/ghi, dung lượng/MIME thực, tên/path, storage public/private, thực thi file, signed URL và download header.
- **B09 Cache/queue/tích hợp:** cache key theo tenant/quyền, invalidation, cache poisoning, job retry/duplicate, webhook signature/replay, timeout và lỗi dịch vụ ngoài.
- **B10 Nghiệp vụ nhạy cảm:** tiền/đơn vị/làm tròn, giá và trạng thái lấy từ nguồn tin cậy, chuyển trạng thái hợp lệ, thanh toán/refund và chống thao tác trùng.
- **B11 Config và vận hành:** debug/error disclosure, CORS, secret, TLS/proxy, rate limit/resource abuse, quyền DB/storage; đánh giá theo môi trường thật, không coi thiếu header là lỗ hổng mặc định.
- **B12 Test backend:** contract, quyền/tenant, dữ liệu biên, rollback/replay/race khi áp dụng, query count và luồng lỗi; nêu phần chưa chạy.

## F — Frontend

- **F01 Render và trạng thái:** điều kiện render, loading/empty/error/success, state đồng bộ dữ liệu, stale closure, derived state và hành vi sau retry/navigation.
- **F02 Hook/effect/lifecycle:** dependency đúng, render/state/effect loop, cleanup listener/timer/subscription, request cancellation và race response khi framework áp dụng.
- **F03 API và N+1:** call theo item/component, fetch trùng/waterfall, phân trang/batch/cache, query key theo user/tenant, retry/timeout và invalidation sau mutation.
- **F04 Big O frontend:** filter/map/find/sort trong render, lồng lookup, copy/allocation, kích thước DOM/list, virtualization khi có căn cứ, bundle/asset/network; không thêm memoization chỉ theo cảm tính.
- **F05 Input/form:** validate UX và xử lý error server, double submit, null/boundary, format số/ngày/múi giờ; quyền và validation quan trọng vẫn kiểm tra backend.
- **F06 XSS và browser sink:** HTML/Markdown render, innerHTML, URL/protocol, DOM injection và sanitization; CSP và thư viện thật, không tin dữ liệu API mặc định an toàn.
- **F07 Dữ liệu nhạy cảm:** secret trong bundle/env public/source map, token/storage, log/analytics, response/cache/state chứa PII hoặc nội dung chưa được phép; ẩn UI không thay phân quyền.
- **F08 Browser boundary:** cookie/CSRF theo cơ chế auth, credential/CORS, open redirect, postMessage origin/source, iframe và external link khi áp dụng.
- **F09 Routing và truy cập:** route/guard, reload/back/forward, hydration/SSR, lỗi fetch và URL; route guard là UX, phải đối chiếu quyền server.
- **F10 UI/accessibility:** semantic HTML, keyboard/focus, label/error, contrast, responsive/overflow, ảnh và trạng thái tương tác theo yêu cầu; dùng công cụ sẵn có, ghi giới hạn nếu chưa chạy browser.
- **F11 Nội dung/SEO khi áp dụng:** metadata/canonical/status, escaping nội dung CMS, URL/link, draft/preview, render/index và ảnh; không áp SEO cho màn hình nội bộ không cần index.
- **F12 Test frontend:** tương tác chính, error/boundary, race/retry, quyền và hồi quy; bằng chứng cho browser/build/type/lint và format thực sự đã chạy.

## X — Luồng xuyên tầng

- **X01 Contract frontend → backend:** field/type/null/status/error/pagination nhất quán; không trust giá/quyền/tenant do client gửi.
- **X02 N+1 đầu cuối:** đếm request theo item và query theo request/record; báo riêng số API `A(n)` và query `Q(n, m)`, không cộng các đại lượng khác đơn vị thành một Big O thời gian.
- **X03 Bảo mật đầu cuối:** backend serialize đúng quyền/tenant/field trước khi trả client; cache/browser/storage không lộ chéo user/tenant hoặc nội dung chưa phát hành.
- **X04 Lỗi và mutation:** optimistic update/rollback, double submit/retry/idempotency, consistency sau mutation và side effect khi một tầng thất bại.

## Đầu ra

Báo độ bao phủ theo ID, toàn bộ findings có bằng chứng trong scope, phần chưa đọc/chưa chạy và đánh giá Big O cho các luồng phụ thuộc dữ liệu đã review kể cả chưa tìm thấy bottleneck. Gộp cùng nguyên nhân với đủ vị trí; không giới hạn số lỗi, không bỏ phát hiện bảo mật mức thấp. Findings bảo mật dùng đủ chín field của template security; tách severity bảo mật khỏi severity review chung. Không tuyên bố đã tìm hết lỗ hổng hoặc dùng checklist thay bằng chứng.
