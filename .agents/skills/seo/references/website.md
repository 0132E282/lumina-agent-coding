# SEO Website

Combines **content, technology, user experience and credibility**. Based on the website's real stack, data and goals; never promise ranking or indexing time.

## Principles

- Read `CLAUDE.md`/`AGENTS.md`, spec, routes, templates and real config before proposing. Distinguish public pages needing index from admin, accounts, internal search and private content.
- If only an audit is requested, only report/propose; if implementation is requested, change exactly the assigned scope. Never publish, deploy, submit sitemaps or edit Search Console/analytics accounts unless assigned.
- Existing UI must follow the current pattern and design system unless redesign is requested. SEO does not allow changing theme, layout or UI library.
- Never invent search volume, backlinks, traffic, index errors or measurement results. Record source, time and data limits; state missing access explicitly.

## Process

1. **Survey**: determine business goals, audience, language/market, URLs and priority page types; identify stack/CMS, rendering, existing SEO data. Pick representative pages by template and state (valid, redirect, nonexistent, private).
2. **Audit**: check each group below using code, HTTP responses, initial HTML and post-render DOM when tools exist. For source/local-preview-only sites, state production or Google index status is unverified.
3. **Prioritize**: record issue, URL/file, evidence, impact, fix and verification. Prioritize crawl/index blocks, wrong content/status and loss of important URLs before small improvements.
4. **Implement if assigned**: reuse the project's metadata/components/schema. URL changes need a redirect mapping and updates to internal links/canonical/sitemap. Data/schema changes follow the project's authority and process.
5. **Verify and hand off**: check representative cases, suitable test/lint/type check and affected docs. Write the report at the specified path, default `docs/seo-audit.md`; distinguish fixed, proposed and unverified.

## Groups to check

| Group | Approach |
|---|---|
| Keywords | Map search need → intent → landing page; use Search Console/provided tool data or sourced research. If inferred only from the brief, label as hypothesis, never assign search volume. |
| Content | Serve the reader's task, accurate information with unique value; clear titles, author/source/update date when suitable. No keyword stuffing, mass empty pages or date changes without content updates. |
| On-page | Title and description suited to each page; hierarchical headings, understandable URLs, alt by image function (decorative images use empty alt), internal links crawlable via `<a href>`. Never use meta keywords or keyword density as SEO criteria. |
| Crawl/index | Check robots.txt, meta robots/X-Robots-Tag, canonical, status and access. `robots.txt` controls crawl, not a guarantee of index removal; `noindex` needs the crawler able to access the page to read it. Private content needs authentication/authorization, never robots as security. |
| URL/HTTP | Stable URLs, absolute canonical to the equivalent priority page; never canonical all pages to the homepage. Permanent redirects use 301/308, temporary 302/307; avoid loops/chains. Nonexistent pages return suitable 404/410, never 200 for error screens or redirecting all error URLs to the homepage. |
| Sitemap | Generated from public, canonical, indexable URLs; excludes redirected, error, private or noindex pages. Absolute URLs, `lastmod` reflects only meaningful updates; split sitemap/index beyond standard limits. A sitemap aids discovery, not index guarantee. |
| Render | Verify main content, metadata and links are crawler-accessible/renderable. Prefer SSR/SSG suited to the stack for public pages; a full CSR rewrite is not required. Check hydration, blocked JS/CSS resources and data appearing only after interaction. Never serve different content to deceive crawlers. |
| Structured data | Choose types by real content and currently Google-supported features; JSON-LD matches what users see. Never invent rating/review/price/stock status; validate with Rich Results Test when a tool exists. Valid does not guarantee a rich result. |
| AI search | AI crawlers in robots.txt (separate training from search), citation control on AI Overviews/AI Mode, optional `llms.txt`: per [ai-search.md](./ai-search.md). Blocking/allowing AI bots is the site owner's decision. |
| Performance/UX | Check mobile, reading/interaction, image sizes, layout shift and JavaScript. Measure LCP/INP/CLS when data exists; separate field data from lab/Lighthouse. Never claim a site passes Core Web Vitals from a single lab test. |
| Credibility | Clear business, contact and author information; suitable references. Suggest content that can earn natural links; never buy/spam backlinks or contact outsiders on your own. |
| Measurement | Search Console for query/page, click, impression, CTR, index and sitemap; analytics for behavior/conversion per goals. Record baseline, comparison period and implemented changes; never infer SEO effect from a single audit score. |

## Backend focus

- Use a consistent data source for slug/URL, title, description, canonical, indexability and structured data; sensible fallbacks per template, no new schema/database when the existing structure suffices.
- Sitemap takes only published content; paginate/batch by scale, with suitable cache and invalidation. Removed/deleted/unpublished content must be reflected in sitemap, HTTP response and cache.
- Escape metadata for the HTML context; serialize JSON-LD safely so entered data cannot inject script. Never put internal information or secrets in HTML/schema.
- Check canonical hostname/protocol from trusted deployment config, never arbitrarily from uncontrolled request headers. For multilingual, use matching URLs and hreflang; never add them if the website has no real language versions.

## Report template

| Priority | URL/file | Issue and evidence | Fix | Verification | Status |
|---|---|---|---|---|---|

Include goal/scope, keyword-page mapping if relevant, before/after measurements if any and what to keep monitoring. Never treat a local check as evidence Google has indexed.

## Official sources

Check the current version when confirming specific limits, features or behavior; prefer official stack docs and:

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [SEO for developers](https://developers.google.com/search/docs/fundamentals/get-started-developers)
- [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)
