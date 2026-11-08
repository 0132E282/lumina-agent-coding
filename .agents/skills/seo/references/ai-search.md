# SEO for AI search (AI Overviews, ChatGPT, Claude, Perplexity)

Dedicated section for AI search (GEO/AEO); crawl/index foundations, rendering, structured data, credibility still follow [website.md](./website.md) and content follows [content.md](./content.md). Bot behavior changes fast: recheck the Sources section before finalizing config; never invent user-agents, IPs or vendor commitments.

## Principles

- No special trick replaces SEO: Google states a page only needs to be indexed and snippet-eligible to be a supporting link in AI Overviews/AI Mode, with no extra technical requirement.
- Separate **training** from **search/citation**: blocking training bots does not remove AI search visibility if search bots stay allowed.
- Blocking/allowing each bot is the site owner's business/legal decision — propose and ask, never change on your own.
- Never promise ranking or citation.

## AI crawlers (robots.txt)

| User-agent | Role | If blocked |
|---|---|---|
| `GPTBot` (OpenAI) | Training | Not used for training; does not affect ChatGPT search |
| `OAI-SearchBot` (OpenAI) | ChatGPT search index | Does not appear in ChatGPT search answers |
| `ChatGPT-User` (OpenAI) | User-requested access | robots.txt may not apply |
| `ClaudeBot` (Anthropic) | May be used for training | Excludes future content from training |
| `Claude-SearchBot` (Anthropic) | Claude search index | May reduce visibility in Claude search |
| `Claude-User` (Anthropic) | User-requested access | Blocks user-requested access |
| `PerplexityBot` | Perplexity index, does not train foundation models | Does not appear in Perplexity results |
| `Perplexity-User` | User-requested access | May ignore robots.txt — **verify** |
| `Google-Extended` (token, not a separate bot) | Uses content for Gemini/training | Does not affect Search; AI Overviews follow Googlebot — **verify** |

- Rules go in the root `robots.txt` of **each subdomain**; do not block by IP for bots that obey robots.txt. Verify real bots with the vendor's published IP ranges. Changes are delayed (OpenAI states ~24 hours for search).
- "Allow AI search, block training" sample (only with owner consent):

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

## Citation control on Google AI

`nosnippet`, `data-nosnippet`, `max-snippet` apply to AI Overviews/AI Mode too; `noindex` removes from both Search and AI features. Use only for passages you do not want quoted, not site-wide since it also cuts normal snippets.

## Quotable content

- One real user question per heading; answer directly in the first 1–2 sentences of the section, then detail.
- Concrete facts with units, dates, sources; tables/lists for comparisons and steps.
- Consistent entities (brand name, product, address) across content, `Organization` schema and external profiles. Structured data helps understand the page, not a condition for AI Overviews.

## llms.txt (optional)

- A **community proposal**, not a Google/OpenAI/Anthropic standard; add only if the owner wants it (usually for docs/dev tools).
- Place at `/llms.txt` or a subpath (`/docs/llms.txt`; the most specific file wins). Markdown in order: H1 site name (**the only required part**) → summary blockquote → detail paragraphs without headings → H2s containing `[name](url): note`; the `Optional` H2 holds links that may be dropped when context is short.
- Can provide a Markdown version of a page at the same URL plus `.md` (`page.html.md`/`page.md`; directories use `index.html.md`).

## Verification

- `curl -A "<user-agent>" <url>`: allowed bots get 200 and main content in HTML; robots.txt parses correctly (Search Console robots.txt report).
- Server logs by AI user-agent: requests, 4xx/5xx errors, IPs matching published ranges.

## Sources

- Google — AI features and your website: https://developers.google.com/search/docs/appearance/ai-features
- Google — common crawlers (Google-Extended): https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers
- OpenAI — crawlers: https://developers.openai.com/api/docs/bots
- Anthropic — crawlers: https://support.claude.com/en/articles/8896518
- Perplexity — crawlers: https://docs.perplexity.ai/docs/resources/perplexity-crawlers.md
- llms.txt: https://llmstxt.org/ (https://github.com/AnswerDotAI/llms-txt)
