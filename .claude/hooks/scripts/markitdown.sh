#!/usr/bin/env bash
# UserPromptSubmit hook: file HTML/PDF/ảnh đính kèm trong prompt được tự
# convert sang Markdown bằng CLI `markitdown`, rồi bơm nội dung vào
# additionalContext — không cần tự gọi skill markitdown bằng tay mỗi lần dán
# tài liệu. `markitdown` không OCR ảnh thường (chỉ EXIF) nếu không có
# Azure/LLM — ảnh PNG/JPG/GIF/WEBP nên fallback sang `tesseract` (OCR offline,
# không cần key) khi markitdown ra rỗng. Best-effort: thiếu `jq`/`markitdown`,
# không có file đính kèm phù hợp, hoặc convert lỗi -> bỏ qua êm, không chặn
# prompt.
#
# Nhận JSON input từ stdin theo schema UserPromptSubmit:
#   { "session_id": "...", "prompt": "...", "files": [{"path": "...", ...}], "images": [{"path": "...", ...}], ... }
#
# File .md convert được là tài nguyên của session hiện tại — lưu vào
# `.agents/storage/attachments/<session_id>/` (cạnh `.agents/storage/logs/`,
# đã ignore qua .gitignore), không dùng /tmp hệ thống và không tự xoá. File
# cùng tên đã convert rồi (còn tồn tại) thì tái dùng, không convert lại.
#
# Trả hookSpecificOutput.additionalContext — nội dung Markdown convert được,
# cắt ngắn mỗi file để tránh phình context khi tài liệu quá dài.

set -o pipefail
trap 'exit 0' ERR

MAX_CHARS_PER_FILE=8000
CONVERT_EXTS_REGEX='\.(pdf|html?|png|jpe?g|gif|webp)$'

command -v jq >/dev/null 2>&1 || exit 0
command -v markitdown >/dev/null 2>&1 || exit 0

input="$(cat)"

session_id="$(printf '%s' "$input" | jq -r '.session_id // "unknown-session"' 2>/dev/null)"
if [ -n "$CLAUDE_PROJECT_DIR" ] && [ -d "$CLAUDE_PROJECT_DIR" ]; then
  project_dir="$CLAUDE_PROJECT_DIR"
else
  project_dir="$(pwd)"
fi
outdir="$project_dir/.agents/storage/attachments/${session_id}"
mkdir -p "$outdir" || exit 0

context=""

while IFS= read -r path; do
  [ -n "$path" ] || continue
  [ -f "$path" ] || continue
  printf '%s' "$path" | grep -qiE "$CONVERT_EXTS_REGEX" || continue

  base="$(basename "$path")"
  out="$outdir/${base%.*}.md"

  if [ ! -s "$out" ]; then
    markitdown "$path" -o "$out" >/dev/null 2>&1
  fi

  # markitdown không OCR ảnh thường -> fallback tesseract (offline) nếu còn rỗng
  if [ ! -s "$out" ] && command -v tesseract >/dev/null 2>&1; then
    printf '%s' "$path" | grep -qiE '\.(png|jpe?g|gif|webp)$' \
      && tesseract "$path" stdout -l vie+eng >"$out" 2>/dev/null
  fi

  [ -s "$out" ] || continue

  content="$(head -c "$MAX_CHARS_PER_FILE" "$out")"
  context="${context}

### Markdown của \`${base}\` (tự convert bằng markitdown, lưu tại \`${out}\`)
${content}
"
done < <(printf '%s' "$input" | jq -r '(.files // [])[].path, (.images // [])[].path' 2>/dev/null)

[ -z "$context" ] && exit 0

jq -n --arg ctx "$context" '{
  hookSpecificOutput: {
    hookEventName: "UserPromptSubmit",
    additionalContext: $ctx
  }
}'
exit 0
