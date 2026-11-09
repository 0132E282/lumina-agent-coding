# Chọn bộ tài liệu thiết kế

Chọn bộ tài liệu và sơ đồ theo loại dự án, không viết đủ bộ cho mọi dự án. Dấu `✓` chỉ là thường cần; mục không áp dụng thì bỏ kèm lý do.

## Quy trình chọn

1. Phân loại dự án theo nhiều chiều (một dự án có thể thuộc nhiều loại, ví dụ AI SaaS cần bộ AI + SaaS + Web + API). Không rõ loại thì đọc manifest/cấu trúc repo; vẫn không rõ thì mặc định **Web Application** và ghi giả định.
2. Lấy **Core** (mục dưới), rồi cộng bộ riêng của từng loại đã xác định.
3. Bỏ mục không áp dụng theo độ phức tạp và yêu cầu thật; ghi lý do bỏ.
4. Mỗi sơ đồ chỉ vẽ khi có ≥3 thành phần/bước, theo [diagrams.md](./diagrams.md).
5. Tài liệu chính ở gốc repo (`ARCHITECTURE.md`, `DESIGN.md`); bản thiết kế chi tiết chia theo loại trong `system/` (database, api, frontend, backend, infrastructure, security, devops) và `design/` (mỗi trang một file, `animations.md`, `images/`); phần chưa có căn cứ là giả định hoặc câu hỏi mở.

## Phân loại dự án

- **Web Application**: website, CMS, admin panel, web portal.
- **Mobile Application**: iOS, Android, Flutter, React Native.
- **Desktop Application**: IDE, POS, phần mềm quản lý.
- **AI / Machine Learning**: chatbot, AI agent, RAG, LLM.
- **SaaS Platform**: multi-tenant, subscription, workspace.
- **E-commerce / Marketplace**: bán hàng, marketplace.
- **API / Backend System**: REST, GraphQL, microservices.
- **Enterprise System**: ERP, CRM, HRM — dùng Core + bộ SaaS/API theo thực tế.
- **IoT System**, **Game Application**: chưa có bộ riêng; dùng Core và ghi mục đặc thù cần thêm là giả định.

## Core — dùng chung

- **Planning**: overview, problem statement, goals, scope/out of scope, SRS, user story, acceptance criteria.
- **Analysis**: use case, activity/business flow, functional và non-functional requirements.
- **Design**: architecture, component, ERD/data model, sequence, API spec, authentication/authorization.
- **Technical**: tech stack, folder structure, coding standards, design pattern, infrastructure, environment config.
- **Quality & delivery**: test plan, security checklist, deployment plan, CI/CD, monitoring/logging, backup/recovery.

## Bộ riêng theo loại

- **Web**: sitemap, user flow, wireframe, UI/UX, frontend/backend architecture, routing, API integration, state management, responsive, SEO, caching, web performance. Sơ đồ: sitemap, user flow, frontend component, API sequence, deployment.
- **Mobile**: screen flow, navigation, UI/UX mobile, app lifecycle, local storage, offline mode, push notification, deep linking, device permission, camera/GPS/biometrics, app security, store deployment. Sơ đồ: screen flow, navigation, mobile architecture, push flow, offline sync.
- **AI**: AI use case, model selection, prompt, context management, RAG architecture, vector DB, embedding pipeline, agent workflow, tool/MCP, memory, evaluation, hallucination handling, token/cost, guardrails. Sơ đồ: AI architecture, RAG pipeline, agent workflow, prompt flow, data ingestion, evaluation pipeline.
- **Desktop**: window management, UI/process architecture, IPC, file system access, plugin, auto update, local database, OS integration, crash reporting.
- **SaaS**: multi-tenancy, tenant isolation, workspace, subscription/billing, RBAC, plan/feature, usage tracking, quota, tenant provisioning, audit log.
- **E-commerce**: product catalog/variant, inventory, cart/checkout, order lifecycle, payment, shipping, discount, refund/return, vendor. Sơ đồ: order state, checkout flow, payment sequence, inventory flow.
- **API/Backend**: API contract, service boundary/dependency, database per service, event-driven, queue, retry/idempotency, rate limiting, API gateway, distributed tracing.

## Ma trận Core và bộ riêng

- Cả Web, Mobile, AI, Desktop, SaaS thường cần: overview, SRS, use case, architecture, ERD, sequence, UI/UX, API design, deployment.
- Screen flow: Web, Mobile, Desktop, SaaS; AI thường không cần.
- RAG pipeline, agent workflow: chỉ AI. IPC diagram: chỉ Desktop. Multi-tenancy, billing architecture: chỉ SaaS.

## Checklist trước khi bàn giao

- [ ] Đã ghi loại dự án (nhiều chiều nếu có) và căn cứ phân loại
- [ ] Core + bộ riêng đã chọn, mục bỏ có lý do
- [ ] Sơ đồ chỉ vẽ khi ≥3 thành phần/bước và đối chiếu với file nguồn
- [ ] Phân biệt dữ kiện đã xác minh, giả định, câu hỏi mở
- [ ] Bám design system/UI hiện có, không tự redesign
- [ ] Môi trường (local/staging/production) tách secret; CI chạy lint/test/build trước deploy, có health check và rollback
- [ ] Đã ghi `ARCHITECTURE.md`/`DESIGN.md` ở gốc và chi tiết theo loại vào `system/`, `design/`
