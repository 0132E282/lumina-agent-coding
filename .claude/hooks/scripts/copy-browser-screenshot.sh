#!/usr/bin/env bash
# PostToolUse hook: tool trình duyệt (Claude in Chrome) lưu ảnh chụp vào thư mục
# tạm hệ thống; hook copy ảnh đó vào project để bằng chứng không mất khi OS dọn tạm
# và báo đường dẫn mới qua additionalContext.
#
# Nhận JSON input từ stdin theo schema PostToolUse:
#   { "tool_name": "...", "tool_response": ..., "cwd": "..." }
#
# ! Cấu trúc tool_response của Chrome chưa được xác minh nên quét mọi chuỗi trong đó
# theo regex file ảnh, rồi chỉ nhận file thường (không symlink) nằm dưới thư mục tạm.
#
# Copy, không move; trùng tên thì thêm hậu tố, không ghi đè. Luôn exit 0, không chặn tool.

# ! Bỏ qua nếu project đã có cùng hook (tránh chạy 2 lần với bản user-level).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

project_dir="$(printf '%s' "$input" | jq -r '.cwd // ""' 2>/dev/null)"
if [ -z "$project_dir" ] || [ ! -d "$project_dir" ]; then
  if [ -n "$CLAUDE_PROJECT_DIR" ] && [ -d "$CLAUDE_PROJECT_DIR" ]; then
    project_dir="$CLAUDE_PROJECT_DIR"
  else
    project_dir="$(pwd)"
  fi
fi
git_root="$(git -C "$project_dir" rev-parse --show-toplevel 2>/dev/null || true)"
[ -z "$git_root" ] || project_dir="$git_root"
project_dir_real="$(cd "$project_dir" 2>/dev/null && pwd -P)" || exit 0
project_dir="$project_dir_real"

candidates="$(printf '%s' "$input" \
  | jq -r '[.tool_response | .. | strings] | join("\n")' 2>/dev/null \
  | grep -oiE "/[^\"'[:space:]<>|\\\\]*\\.(png|jpe?g|webp)" \
  | sort -u)"
[ -z "$candidates" ] && exit 0

temp_roots=()
for root in "$TMPDIR" /tmp /private/tmp /var/folders /private/var/folders; do
  [ -n "$root" ] && [ -d "$root" ] || continue
  root_real="$(cd "$root" 2>/dev/null && pwd -P)" || continue
  temp_roots+=("${root_real%/}")
done
[ "${#temp_roots[@]}" -eq 0 ] && exit 0

is_under_temp_root() {
  local directory="$1" root
  for root in "${temp_roots[@]}"; do
    case "$directory/" in
      "$root"/*) return 0 ;;
    esac
  done
  return 1
}

task_slug="${LUMINA_TASK_SLUG:-}"
if [[ "$task_slug" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$ ]]; then
  destination_dir="$project_dir/.agents/storage/evidence/$task_slug"
  context_header="Ảnh chụp trình duyệt đã được copy vào thư mục evidence của task trong project đang hoạt động:"
  context_footer="Dùng đường dẫn trong project ở trên thay cho đường dẫn tạm."
else
  destination_dir="$project_dir/.agents/storage/evidence/browser/$(date +%Y%m%d)"
  context_header="Ảnh chụp trình duyệt đã được copy vào staging inbox của project đang hoạt động:"
  context_footer="Đây chưa phải evidence cuối. Trước khi dẫn trong báo cáo, hãy chuyển ảnh cần dùng vào .agents/storage/evidence/<task-slug>/ của project này."
fi
destination_relative="${destination_dir#"$project_dir"/}"
destination_cursor="$project_dir"
IFS='/' read -r -a destination_components <<< "$destination_relative"
for component in "${destination_components[@]}"; do
  destination_cursor="$destination_cursor/$component"
  [ ! -L "$destination_cursor" ] || exit 0
done
copied_lines=""

while IFS= read -r source_path; do
  [ -n "$source_path" ] || continue
  [ -f "$source_path" ] && [ ! -L "$source_path" ] || continue
  source_dir_real="$(cd "$(dirname "$source_path")" 2>/dev/null && pwd -P)" || continue
  is_under_temp_root "$source_dir_real" || continue
  # Project nằm dưới thư mục tạm thì không copy ảnh đã ở trong project.
  case "$source_dir_real/" in
    "$project_dir_real"/*) continue ;;
  esac

  mkdir -p "$destination_dir" 2>/dev/null || exit 0
  file_name="$(basename "$source_path")"
  stem="${file_name%.*}"
  extension="${file_name##*.}"
  destination_path="$destination_dir/$file_name"
  suffix=1
  while [ -e "$destination_path" ] || [ -L "$destination_path" ]; do
    destination_path="$destination_dir/$stem-$suffix.$extension"
    suffix=$((suffix + 1))
  done

  cp -p "$source_path" "$destination_path" 2>/dev/null || continue
  copied_lines="${copied_lines}- ${source_path} -> ${destination_path}
"
done <<< "$candidates"

[ -z "$copied_lines" ] && exit 0

context="${context_header}
${copied_lines}
${context_footer}"

jq -n --arg ctx "$context" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: $ctx
  }
}'
exit 0
