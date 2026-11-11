---
name: markitdown
description: "Convert PDF, DOCX, PPTX, XLSX, HTML, CSV, JSON or image files and URLs to compact Markdown before reading, to save context tokens. Use when the user attaches or points to such a document, or a task needs its content. Works on every runtime via the markitdown CLI or MCP; read-only on the source."
---

# markitdown

Turn a document into Markdown, then read the Markdown instead of the raw file. Same behavior as the Claude-only `UserPromptSubmit` hook `~/.claude/hooks/markitdown.sh`, but runnable on Codex and Antigravity and on demand.

## Choose the tool

1. CLI (preferred for local files): `markitdown <file> -o <out>.md`.
2. MCP `markitdown` → `convert_to_markdown(uri)` for `http(s):`, `file:` or `data:` URIs; needs the MCP connected, otherwise say so and use the CLI.
3. Plain text/Markdown/code files: read directly, no conversion.
4. Image with empty result (markitdown only reads EXIF): fallback `tesseract <img> stdout -l vie+eng` if installed; otherwise view the image directly.

If neither CLI nor MCP exists, say so; never install packages just for this, never guess the content.

## Rules

- Save output to `.agents/storage/attachments/<task-slug>/<name>.md` (ignored by git); never `/tmp` or beside the source. Reuse an existing non-empty output instead of converting again.
- Never modify or delete the source file; never put secrets/PII from a document into logs, commits or reports.
- Read the Markdown in parts when long (use `offset`/`limit`); do not paste whole files into prompts or handoffs, link the saved path.
- Check the result is non-empty and plausible (tables, headings kept); state what failed to convert (scanned pages, charts, images inside documents) instead of filling gaps.
- A URL is fetched by the tool: only public URLs the user gave; authenticated/private pages are out of scope.

## Output

State source → saved `.md` path → what was lost or unverified. The Markdown is context for the task, not a deliverable unless requested.
