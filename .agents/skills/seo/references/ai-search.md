# SEO cho tìm kiếm AI (AI Overviews, ChatGPT, Claude, Perplexity)

Phần riêng cho AI search (GEO/AEO); nền tảng crawl/index, render, structured data, uy tín vẫn theo [website.md](./website.md) và nội dung theo [content.md](./content.md). Hành vi bot thay đổi nhanh: kiểm tra lại mục Nguồn trước khi chốt cấu hình; không bịa user-agent, IP hay cam kết nhà cung cấp.

## Nguyên tắc

- Không có mẹo riêng thay SEO: Google nêu trang chỉ cần được index và đủ điều kiện hiển thị snippet để làm link hỗ trợ trong AI Overviews/AI Mode, không có yêu cầu kỹ thuật bổ sung.
- Tách **training** với **search/trích dẫn**: chặn bot training không làm mất hiển thị AI search nếu vẫn cho bot search.
- Chặn/mở từng bot là quyết định kinh doanh/pháp lý của chủ site — đề xuất và hỏi, không tự đổi.
- Không cam kết thứ hạng hay việc được trích dẫn.

## Crawler AI (robots.txt)

| User-agent | Vai trò | Chặn thì |
|---|---|---|
| `GPTBot` (OpenAI) | Training | Không dùng để train; không ảnh hưởng ChatGPT search |
| `OAI-SearchBot` (OpenAI) | Index ChatGPT search | Không xuất hiện trong câu trả lời ChatGPT search |
| `ChatGPT-User` (OpenAI) | Truy cập theo yêu cầu người dùng | robots.txt có thể không áp dụng |
| `ClaudeBot` (Anthropic) | Có thể dùng cho training | Loại nội dung tương lai khỏi training |
| `Claude-SearchBot` (Anthropic) | Index Claude search | Có thể giảm hiển thị trong Claude search |
| `Claude-User` (Anthropic) | Truy cập theo yêu cầu người dùng | Chặn truy cập theo yêu cầu người dùng |
| `PerplexityBot` | Index Perplexity, không train foundation model | Không xuất hiện trong kết quả Perplexity |
| `Perplexity-User` | Truy cập theo yêu cầu người dùng | Có thể bỏ qua robots.txt — **xác minh** |
| `Google-Extended` (token, không phải bot riêng) | Dùng nội dung cho Gemini/training | Không ảnh hưởng Search; AI Overviews theo Googlebot — **xác minh** |

- Rule đặt ở `robots.txt` gốc **từng subdomain**; không chặn bằng IP với bot tuân thủ robots.txt. Xác minh bot thật bằng dải IP nhà cung cấp công bố. Thay đổi có độ trễ (OpenAI nêu ~24 giờ cho search).
- Mẫu "cho AI search, chặn training" (chỉ khi chủ site đồng ý):

```txt
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Google-Extended
Disallow: /

User-agent: OAI-SearchBot
User-agent: Claude-SearchBot
User-agent: PerplexityBot
Allow: /
```

## Kiểm soát trích dẫn trên Google AI

`nosnippet`, `data-nosnippet`, `max-snippet` áp dụng cả AI Overviews/AI Mode; `noindex` loại khỏi Search lẫn AI features. Chỉ dùng cho đoạn không muốn bị trích, không diện rộng vì giảm cả snippet thường.

## Nội dung dễ được trích dẫn

- Mỗi heading một câu hỏi thật của người dùng; trả lời trực tiếp 1–2 câu đầu section rồi mới chi tiết.
- Dữ kiện cụ thể kèm đơn vị, thời điểm, nguồn; bảng/danh sách cho so sánh và các bước.
- Entity nhất quán (tên thương hiệu, sản phẩm, địa chỉ) giữa nội dung, `Organization` schema và hồ sơ bên ngoài. Structured data giúp hiểu trang, không phải điều kiện vào AI Overviews.

## llms.txt (tuỳ chọn)

- **Đề xuất cộng đồng**, không phải chuẩn của Google/OpenAI/Anthropic; chỉ thêm khi chủ site muốn (thường cho docs/dev tool).
- Đặt ở `/llms.txt` hoặc subpath (`/docs/llms.txt`; file cụ thể nhất được ưu tiên). Markdown theo thứ tự: H1 tên site (**phần bắt buộc duy nhất**) → blockquote tóm tắt → đoạn chi tiết không heading → các H2 chứa `[tên](url): ghi chú`; H2 `Optional` là link có thể bỏ khi thiếu context.
- Có thể cung cấp bản Markdown của trang tại cùng URL thêm `.md` (`page.html.md`/`page.md`; thư mục dùng `index.html.md`).

## Kiểm chứng

- `curl -A "<user-agent>" <url>`: bot được phép nhận 200 và nội dung chính trong HTML; robots.txt parse đúng (Search Console robots.txt report).
- Log server theo user-agent AI: request, lỗi 4xx/5xx, IP khớp dải công bố.

## Nguồn

- Google — AI features and your website: https://developers.google.com/search/docs/appearance/ai-features
- Google — common crawlers (Google-Extended): https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers
- OpenAI — crawlers: https://developers.openai.com/api/docs/bots
- Anthropic — crawlers: https://support.claude.com/en/articles/8896518
- Perplexity — crawlers: https://docs.perplexity.ai/docs/resources/perplexity-crawlers.md
- llms.txt: https://llmstxt.org/ (https://github.com/AnswerDotAI/llms-txt)
