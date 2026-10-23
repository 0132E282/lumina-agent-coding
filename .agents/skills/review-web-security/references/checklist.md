# Checklist bảo mật chi tiết

Đánh dấu mỗi mục theo trạng thái: `Đạt`, `Lỗi xác nhận`, `Không áp dụng`. Với `Đạt` hoặc `Lỗi xác nhận`, dẫn bằng chứng; với `Không áp dụng`, nêu lý do ngắn. Gom những mục cùng nguyên nhân thành một finding.

## A. Xác thực và tài khoản

- Mật khẩu plaintext, hash nhanh/không phù hợp, credential mặc định hoặc yếu.
- Brute force, credential stuffing; thiếu giới hạn lượt thử và phát hiện lạm dụng.
- User enumeration qua response, thời gian hoặc luồng reset/đăng ký.
- Reset token dễ đoán, không hết hạn, dùng lại được hoặc không gắn đúng tài khoản.
- Đổi mật khẩu/email và liên kết tài khoản thiếu xác minh phù hợp.
- OTP/MFA thiếu giới hạn, hết hạn, dùng một lần; bypass qua endpoint phụ/recovery.
- OAuth/OIDC kiểm tra sai redirect URI, state, nonce, PKCE, issuer hoặc audience.
- JWT không kiểm tra đúng chữ ký, thuật toán cho phép, issuer, audience, thời hạn.
- Session/token còn hiệu lực trái chính sách sau logout, khóa tài khoản, đổi quyền hoặc đổi mật khẩu.
- API key dùng chung, quyền rộng, lộ hoặc thiếu thu hồi/xoay vòng.

## B. Session, cookie và CSRF

- Session fixation; không regenerate session sau xác thực hoặc nâng quyền.
- Thiếu idle/absolute timeout phù hợp; logout không vô hiệu hóa session server.
- Cookie thiếu Secure/HttpOnly/SameSite phù hợp; domain/path quá rộng.
- Token/session xuất hiện trong URL, log, referrer hoặc analytics.
- CSRF trên thao tác dùng credential tự động gửi như cookie; GET có side effect.
- WebSocket dùng cookie nhưng thiếu kiểm tra origin phù hợp.
- Cơ chế chống CSRF có nhưng endpoint liên quan được miễn sai hoặc có đường bypass.

## C. Phân quyền và cách ly dữ liệu

- IDOR/BOLA: truy cập đối tượng của người khác qua ID hoặc quan hệ.
- BFLA: role thấp gọi chức năng quản trị; chỉ kiểm tra quyền ở UI.
- Endpoint thiếu xác thực: route mới mặc định cho phép thay vì mặc định chặn; middleware auth gắn từng route nên dễ sót; route API/admin/internal gọi được khi chưa đăng nhập.
- Thiếu quyền đọc/sửa field; mass assignment role, owner, tenant, giá hoặc trạng thái.
- Tin user_id/tenant_id/role từ client thay vì danh tính và ngữ cảnh được xác minh.
- Thiếu tenant scope ở query, cache, storage, search, export hoặc job.
- Bulk action chỉ kiểm tra một phần bản ghi; export/download/restore/preview bỏ qua quyền.
- Model/module/relation/action động không có allowlist và policy tương ứng.
- Quyền cũ còn trong cache; default allow khi policy thiếu hoặc kiểm tra lỗi.
- Tài liệu riêng tư có URL công khai; signed URL không ràng buộc phạm vi/thời hạn phù hợp.

## D. Injection và xử lý input backend

- SQL/NoSQL injection; ghép raw query hoặc cho phép operator/query tùy ý.
- OS command/code/expression injection; eval, shell hoặc script động từ input.
- Server-side template injection; input trở thành template thực thi.
- LDAP/XPath/XML injection; XXE qua parser cho phép external entity.
- Unsafe deserialization hoặc prototype pollution khi input tác động object/config nhạy cảm.
- CRLF/HTTP header/email header injection; log injection.
- CSV/formula injection khi export dữ liệu không đáng tin.
- Dynamic sort/filter/table/column/relation không giới hạn; nhầm giá trị với identifier.
- Validation thiếu kiểu, chiều dài, miền giá trị, cấu trúc lồng nhau hoặc canonicalization cần thiết.

## E. Frontend và trình duyệt

- Stored/reflected/DOM XSS; encode không đúng ngữ cảnh HTML, attribute, URL hoặc JavaScript.
- innerHTML, dangerouslySetInnerHTML, v-html, document.write nhận dữ liệu chưa xử lý an toàn.
- Rich text/Markdown/SVG dùng sanitizer không phù hợp hoặc có cấu hình bypass.
- HTML injection, URL scheme nguy hiểm, DOM clobbering; eval/new Function từ input.
- postMessage không kiểm tra chính xác origin, source và schema dữ liệu.
- Clickjacking trên thao tác nhạy cảm; open redirect hỗ trợ lừa đảo.
- Secret/private key nhúng trong bundle hoặc biến môi trường frontend.
- Token/storage có mô hình bảo vệ không phù hợp; XSS có thể đọc dữ liệu hoặc gọi API thay user.
- Dữ liệu nhạy cảm vào analytics, URL, source map công khai hoặc error report.
- Browser/service worker cache giữ dữ liệu giữa user hoặc sau logout.
- Script bên thứ ba thiếu kiểm soát nguồn/toàn vẹn phù hợp; CSP quá rộng.
- Tin dữ liệu API là an toàn để render; tin hidden field hoặc frontend validation.

## F. HTTP, API và tích hợp

- CORS phản chiếu origin hoặc cho origin không đáng tin đọc response có credential.
- SSRF qua fetch URL, import ảnh, PDF renderer; bỏ qua redirect, DNS hoặc truy cập nội bộ.
- WebSocket/channel/message thiếu xác thực, quyền hoặc giới hạn tài nguyên.
- HTTP parameter pollution, parser differential, request smuggling giữa proxy và backend.
- Host-header poisoning; tin X-Forwarded-* từ nguồn không được cấu hình tin cậy.
- Webhook thiếu xác minh chữ ký, timestamp, chống replay hoặc đối chiếu sự kiện.
- API bên thứ ba thiếu schema validation, timeout, giới hạn kích thước hoặc xử lý lỗi an toàn.
- Endpoint cũ/debug/internal bị lộ; inventory API không đầy đủ.
- GraphQL resolver thiếu quyền; query depth/complexity/batching không giới hạn phù hợp.
- Serializer trả field thừa hoặc dữ liệu nhạy cảm ngoài nhu cầu.

## G. File và nội dung upload

- Chỉ tin extension/MIME client; file executable hoặc HTML/SVG chủ động được phục vụ cùng origin.
- File upload có thể được thực thi; thiếu cách ly storage phù hợp.
- Path traversal, arbitrary file read/write/overwrite qua đường dẫn hoặc tên file.
- Zip Slip, archive symlink hoặc decompression bomb.
- Upload/giải nén/chuyển đổi thiếu giới hạn dung lượng, số file, thời gian và tài nguyên.
- Parser ảnh/PDF/Office/video có lỗ hổng; công cụ chuyển đổi nhận input nguy hiểm.
- File tạm, file riêng tư, thumbnail hoặc kết quả chuyển đổi thiếu kiểm soát quyền.

## H. Nghiệp vụ và thanh toán

- Tin giá, thuế, tổng tiền, giảm giá, số dư hoặc payment status do frontend gửi.
- Không đối chiếu giao dịch với order, amount, currency, merchant và trạng thái từ nguồn tin cậy.
- Số âm, overflow, rounding/currency sai hoặc số lượng vượt miền hợp lệ.
- Bypass bước quy trình; sửa đối tượng đã khóa; thiếu kiểm tra chuyển trạng thái.
- Race condition, double spending, TOCTOU; thiếu transaction/locking/constraint phù hợp ([`rules/backend.md`](../../../rules/backend.md#an-toàn-dữ-liệu)).
- Thiếu idempotency hoặc chống replay cho thanh toán, webhook, refund và retry.
- Refund vượt giá trị, nhiều lần; coupon/referral/multi-account abuse.
- Exception/timeout làm hệ thống fail-open hoặc ghi dữ liệu một phần.

## I. Database, dữ liệu và mật mã

- Database/cache/search public; tài khoản ứng dụng quá quyền.
- Backup/dump/snapshot lộ; dữ liệu production đưa sang test không che phù hợp.
- Mật khẩu, OTP, session, token, PII trong log hoặc telemetry.
- Thuật toán tự thiết kế, primitive lỗi thời hoặc sử dụng thư viện sai.
- Random token yếu; nonce/IV dùng lại sai yêu cầu; ciphertext thiếu bảo vệ toàn vẹn.
- Khóa lộ, quyền rộng, lưu không phù hợp hoặc thiếu lifecycle management.
- Thiếu bảo vệ dữ liệu nhạy cảm khi truyền/lưu theo threat model.
- Retention/xóa dữ liệu không nhất quán giữa database, file, cache và bản sao theo chính sách.

## J. Cache, tài nguyên và availability

- Cache key thiếu user/tenant/quyền; private response bị cache dùng chung.
- Cache poisoning/deception; cache giữ quyền hoặc dữ liệu đã thu hồi.
- Login/OTP/search/export/SMS/email/AI thiếu rate limit, quota và chống abuse phù hợp.
- Pagination, GraphQL, filter, regex hoặc request body tạo tải không giới hạn.
- ReDoS, query nặng, upload lớn, queue flooding hoặc decompression gây cạn tài nguyên.
- Thiếu timeout, concurrency limit, backpressure; retry storm.
- Rate limit chỉ dựa IP dễ bypass hoặc khóa nhầm; không kiểm tra giới hạn theo danh tính/nghiệp vụ.

## K. Hạ tầng và cấu hình

- Debug/profiler bật production; .env, .git, backup, directory listing bị phục vụ công khai.
- HTTP/TLS cấu hình không phù hợp; backend tắt certificate verification.
- Bucket/storage/port quản trị/database/dashboard public trái nhu cầu.
- Container/process chạy quyền cao; service account và filesystem quyền quá rộng.
- Dev/staging dùng secret hoặc tài nguyên production trái phạm vi.
- Dangling DNS/subdomain takeover; origin bị truy cập trực tiếp bỏ qua kiểm soát cần thiết.
- Secret commit vào code/history; thiếu thu hồi secret đã lộ.
- Runtime/framework/OS không được cập nhật bản vá phù hợp.

## L. Supply chain, CI/CD và giám sát

- Dependency trực tiếp/gián tiếp có lỗ hổng khả dụng trong ngữ cảnh ứng dụng.
- Typosquatting, dependency confusion, package/build script không đáng tin.
- CI chạy code PR không tin cậy với secret; token runner/deploy quá quyền.
- Artifact/image/build provenance không được kiểm soát phù hợp.
- Thiếu audit log cho đổi quyền, truy cập tài liệu, export, thao tác tài chính.
- Log có thể bị sửa/xóa dễ dàng; thiếu cảnh báo cho hành vi rủi ro.
- Error response lộ SQL, stack trace, cấu hình hoặc secret.
- Backup chưa kiểm tra restore; thiếu khả năng thu hồi token/key và xử lý sự cố.
