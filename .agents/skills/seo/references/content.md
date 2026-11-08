# SEO Website Content

Every page must answer: **Who is it for? What problem does it solve? What should the reader do next?** Write enough to meet the need, never pad or repeat keywords just for SEO. Applies to Claude Code, Codex and other agents.

## Principles

- Read project guidance, brief, existing content and product/business data first. Keep existing brand voice, language, URLs and UI structure; a content-writing request does not allow redesign.
- Never invent prices, capabilities, customers, certifications, figures, reviews or experiences. Missing facts go in the needs-confirmation section, never stated as fact in the draft. Hypothetical examples must be clearly labeled.
- Never guess search volume or promise ranking. Without keyword data, offer intent/topic suggestions labeled as hypotheses. Check reliable sources when content needs current information verified.
- Do only the assigned scope: plan, outline or draft. Never post to the CMS, publish, change code/URLs or create commitment policies on the business's behalf.

## Process

1. **Identify the reader**: field, product/service, market, customer group, problem, pre-purchase questions and desired action. Use the brief/repo to infer; ask only about missing information that affects content, continue independent parts.
2. **List topics**: from products, services, FAQ, customer feedback and search data if any. Classify needs as learn, compare, choose or buy/contact.
3. **Assign topics to pages**: check existing pages before proposing new ones. Each need has one main landing page; avoid several articles answering the same intent without useful difference. On overlap, propose update/merge, never delete or change URLs on your own.
4. **Outline**: state reader, goal, main message, questions to answer, headings, needed evidence and suitable CTA. Do not force every page type into the same marketing layout.
5. **Write and optimize**: answer the main need early; use clear sentences, readable paragraphs, real examples and consistent terminology. Create sensible SEO title, meta description, H1 and headings; use keywords naturally, no fixed density or word count. Suggest contextual internal links to verified pages or mark pages that do not exist yet.
6. **Review and handoff**: check accuracy, duplication, brand voice, CTA and sources. Write files where the user specifies; by default plan in `docs/content-plan.md`, drafts in `docs/content/<page-slug>.md`. Record publish/update suggestions and information needing confirmation; distinguish drafts from published content.

## Page groups

| Page | Needed content | Goal |
|---|---|---|
| Home | What is offered, for whom, main benefits, evidence-based reasons to choose and CTA | Quick understanding and action |
| About | Story, capabilities, team and real information | Build trust |
| Product/service | Features, benefits, suitable audience, price/quoting method, process and FAQ | Support decisions |
| Blog/knowledge | Guides, answers, comparisons and solving specific problems | Meet learning needs |
| Project/case study | Context, problem, scope, solution, evidence-backed results | Prove capability |
| Contact/policy | Contact channels and real applicable policies by website type | Provide needed information |

Choose only suitable groups; never create every page. Policies must rest on the business's provided rules and scope; if missing, hand off an outline with questions needing confirmation.

## Output

**Content plan**:

| Page/URL | Reader and intent | Proposed topic/keyword | Message and CTA | Needed evidence | Internal links | Priority |
|---|---|---|---|---|---|---|

**Per-page draft**: goal/reader → existing URL or proposed slug → SEO title → meta description → H1 → content by heading → CTA/internal links → sources and information needing confirmation. Editorial notes are separate from customer-visible content.

Example for a software-services website: service page "Laravel website development for businesses"; guide "What to prepare before hiring a website developer?"; comparison "How do template and custom-designed websites differ?". Case studies use only the real projects and results provided.

For crawl/index, sitemap, canonical, HTTP status or rendering, use [seo](../../seo/references/website.md). After publishing, suggest tracking queries/pages and conversions when data exists; update when information changes, not just the article date.
