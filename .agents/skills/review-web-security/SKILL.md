---
name: review-web-security
description: "Review bảo mật website, backend, frontend, API, database và cấu hình triển khai, có bằng chứng, điều kiện khai thác, mức ảnh hưởng, bản sửa và test hồi quy. Dùng khi yêu cầu security review, audit, tìm lỗ hổng, kiểm tra xác thực/phân quyền/upload/thanh toán. Không chạy kiểm thử phá hoại hay quét ngoài phạm vi."
license: MIT
metadata:
  version: "1.2"
---

# Review Web Security

## Mục tiêu

Phát hiện lỗ hổng thực tế, ưu tiên theo rủi ro và đưa ra cách sửa có thể kiểm chứng. Dùng checklist như bản đồ kiểm tra, không coi mọi mục là một lỗi đã tồn tại. Không tuyên bố ứng dụng an toàn tuyệt đối hoặc checklist bao phủ mọi lỗ hổng.

## Nguyên tắc làm việc

- Đọc hướng dẫn dự án và xác định phạm vi người dùng yêu cầu trước khi làm việc.
- Review code và cấu hình được cung cấp; chỉ thử nghiệm trên môi trường thuộc phạm vi được cho phép. Dùng dữ liệu giả và tài khoản thử nghiệm; không chạy kiểm thử phá hoại hoặc gây tải lên production.
- Nếu chỉ được yêu cầu review, báo cáo và đề xuất patch. Nếu được yêu cầu sửa, thực hiện thay đổi nhỏ nhất xử lý nguyên nhân gốc và chạy kiểm thử phù hợp ([`rules/coding.md`](../../rules/coding.md#kiss-yagni-và-phạm-vi)).
- Không in giá trị secret, token, mật khẩu hoặc dữ liệu cá nhân. Che giá trị nhạy cảm trong bằng chứng; nếu secret bị lộ, đề xuất thu hồi/xoay vòng, không chỉ xóa khỏi code.
- Phân biệt lỗ hổng đã xác nhận, nghi vấn cần xác minh và đề xuất tăng cường. Thiếu một header không tự động là lỗi nghiêm trọng.
- Không suy luận rằng UUID, URL khó đoán, frontend validation, CORS, ORM hoặc framework tự động bảo vệ toàn bộ ứng dụng.
- Không chạy công cụ quét hoặc cài dependency mới khi không cần thiết. Không sửa toàn bộ kiến trúc để xử lý một lỗi cục bộ.
- Xác minh khuyến nghị phụ thuộc phiên bản bằng tài liệu chính thức ([`rules/search-priority.md`](../../rules/search-priority.md)). Không bịa CVE, CWE, CVSS, phiên bản hoặc kết quả scanner.

## Quy trình

### 1. Lập bản đồ ứng dụng

Xác định stack và phiên bản từ manifest/lockfile; đọc route, middleware, controller, service, policy, serializer, component frontend, schema và cấu hình triển khai liên quan.

Ghi lại:
- Điểm vào: HTTP, GraphQL, WebSocket, webhook, upload, import, queue, scheduled job.
- Danh tính: guest, user, admin, service account; tenant, role và quyền.
- Dữ liệu quan trọng: tài khoản, hồ sơ cá nhân, tài liệu riêng tư, thanh toán, secret.
- Ranh giới tin cậy: browser → API → database/storage/queue → dịch vụ bên ngoài.
- Luồng nhạy cảm: login, reset password, đổi email, CRUD, bulk action, export, thanh toán.

### 2. Truy vết và xác minh

Với từng luồng áp dụng:
1. Theo dõi input từ nguồn vào đến nơi truy vấn, ghi dữ liệu, render, thực thi hoặc gửi ra ngoài.
2. Kiểm tra xác thực, quyền chức năng, quyền đối tượng, quyền field, tenant và trạng thái nghiệp vụ.
3. Đọc helper/middleware/policy thực sự được gọi trước khi kết luận thiếu bảo vệ.
4. Kiểm tra đường đi phụ: bulk, export, download, restore, preview, API cũ, queue và webhook.
5. Thu thập vị trí code, điều kiện tiền đề và đường đi khả thi. Xác minh bằng kiểm thử nhỏ trên môi trường an toàn nếu có.
6. Nếu không thể kiểm chứng, ghi rõ dữ kiện còn thiếu và cách xác minh; không nâng nghi vấn thành lỗi chắc chắn.

### 3. Phân loại và ưu tiên

Đánh giá mức độ từ khả năng tiếp cận, đặc quyền cần có, tương tác nạn nhân, dữ liệu bị ảnh hưởng, phạm vi tenant và tác động thực tế.

- Critical: tác động rất lớn với đường khai thác khả thi, như chiếm quyền hệ thống hoặc truy cập hàng loạt dữ liệu quan trọng.
- High: chiếm tài khoản, vượt quyền đáng kể, truy cập dữ liệu nhạy cảm hoặc thao túng tài chính trong điều kiện thực tế.
- Medium: ảnh hưởng giới hạn hoặc cần điều kiện bổ sung đáng kể.
- Low: ảnh hưởng nhỏ; ghi riêng các đề xuất tăng cường chưa chứng minh khả năng khai thác.

Không gán severity chỉ dựa trên tên lỗi. Chỉ đưa CVSS khi có đủ dữ kiện và giải thích vector.

### 4. Sửa và kiểm thử

- Sửa tại ranh giới tin cậy và điểm thực thi; xử lý mọi đường đi cùng nguyên nhân.
- Dùng cơ chế chuẩn của framework, thư viện duy trì tốt và cấu hình phù hợp phiên bản.
- Thêm kiểm thử hồi quy có ý nghĩa: thao tác hợp lệ vẫn thành công, thao tác vượt quyền/độc hại bị từ chối và không gây side effect ([`rules/delivery.md`](../../rules/delivery.md#chất-lượng-và-bằng-chứng)).
- Kiểm tra user khác, tenant khác, guest, role thấp, field cấm và endpoint phụ khi liên quan.
- Với race condition và replay, kiểm tra tính nguyên tử, idempotency và request đồng thời khi môi trường cho phép.
- Báo rõ kiểm thử đã chạy, kết quả, phần chưa chạy và rủi ro còn lại.

## Checklist bảo mật

12 nhóm — đọc chi tiết từng mục (đánh dấu `Đạt`/`Lỗi xác nhận`/`Cần xác minh`/`Không áp dụng` kèm bằng chứng) tại [`references/checklist.md`](./references/checklist.md):

| Nhóm | Phạm vi |
|---|---|
| A | Xác thực và tài khoản |
| B | Session, cookie và CSRF |
| C | Phân quyền và cách ly dữ liệu |
| D | Injection và xử lý input backend |
| E | Frontend và trình duyệt |
| F | HTTP, API và tích hợp |
| G | File và nội dung upload |
| H | Nghiệp vụ và thanh toán ([`rules/backend`](../../rules/backend.md#an-toàn-dữ-liệu)) |
| I | Database, dữ liệu và mật mã |
| J | Cache, tài nguyên và availability |
| K | Hạ tầng và cấu hình |
| L | Supply chain, CI/CD và giám sát |

## Stack cụ thể

Review Laravel/React → đọc [`references/stack-notes.md`](./references/stack-notes.md) (route→policy trace, mass assignment, Sanctum, `VITE_*`...). Stack khác thì áp dụng checklist chung ở trên, không suy diễn theo convention Laravel/React.

## Định dạng báo cáo

Mở đầu bằng số lỗi xác nhận, mức độ cao nhất và giới hạn phạm vi. Sắp xếp findings theo rủi ro, không theo thứ tự đọc file.

Với mỗi finding, cung cấp:
1. ID, tiêu đề, severity và confidence.
2. Trạng thái: xác nhận hay cần xác minh.
3. Vị trí file/dòng hoặc route; đoạn code tối thiểu, che dữ liệu nhạy cảm.
4. Nguyên nhân gốc và luồng dữ liệu/quyền bị vi phạm.
5. Điều kiện tiền đề và kịch bản tái hiện tối thiểu trong môi trường thử nghiệm.
6. Tác động thực tế và phạm vi dữ liệu/tài khoản/tenant.
7. Cách sửa cụ thể hoặc patch nếu được yêu cầu.
8. Kiểm thử hồi quy: trường hợp hợp lệ, bị từ chối và side effect cần tránh.
9. CWE/OWASP mapping nếu xác minh được, không dùng mapping thay bằng chứng.

Kết thúc bằng kiểm thử đã thực hiện, các phần chưa truy cập/chưa kiểm thử, nghi vấn cần thêm dữ kiện và thứ tự xử lý. Nếu không có lỗi xác nhận, ghi "Chưa phát hiện lỗi trong phạm vi đã kiểm tra", không ghi "Không có lỗ hổng".

Nếu project có skill [`report`](../report/SKILL.md), dùng đúng template [`assets/security-review-report-template.md`](../report/assets/security-review-report-template.md) của skill đó để trình bày kết quả — không dùng template review chung (thiếu field confidence/điều kiện khai thác/CWE) và không tự bịa format khác.

## Tài liệu tham chiếu

Dùng nguồn chính thức để xác minh quy tắc, phiên bản và cách sửa khi cần:
- OWASP ASVS: https://owasp.org/projects/asvs
- OWASP Top 10: https://owasp.org/projects/top-ten
- OWASP API Security: https://owasp.org/projects/api-security-project
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/
- CWE: https://cwe.mitre.org/
- Tài liệu chính thức của framework, runtime và nhà cung cấp liên quan.
