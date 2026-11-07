#!/usr/bin/env bash
# Lưu trữ dùng chung của hook cho bash: MỘT file log mỗi ngày (giờ LOCAL của máy), giữ N ngày.
# Không đăng ký trong settings.json; chỉ `source`:  . _hook-storage.sh
#   lumina_project_root                            CLAUDE_PROJECT_DIR hợp lệ, không thì cwd
#   lumina_log_file <log_dir>                      đường dẫn logs-YYYYMMDD.jsonl của hôm nay (tạo thư mục)
#   lumina_log_files <log_dir>                     các file log theo ngày còn trong cửa sổ giữ, cũ → mới
#   lumina_session_log_lines <log_dir> <session>   dòng log có thể thuộc session, từ mọi file theo ngày
#   lumina_state_get <root> <session> <key>        in JSON của key (rỗng nếu chưa có)
#   lumina_state_set <root> <session> <key> <json>
#   lumina_state_push <root> <session> <key>       mỗi dòng stdin thêm vào mảng (không trùng)
# State và dọn file cũ do _hook-storage.mjs đảm nhiệm (cùng quy ước tên/ngày); thiếu node thì state
# im lặng không lưu và không dọn. Env: LUMINA_STORAGE_KEEP_DAYS (mặc định 7, tính cả hôm nay).
# Best-effort: không bao giờ làm writer thất bại.

lumina_storage_helper_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"
lumina_storage_node_helper="$lumina_storage_helper_dir/_hook-storage.mjs"

lumina_dated_log_pattern='^logs-[0-9]{8}\.jsonl$'

# Chạy lệnh con của helper node; thiếu node/helper thì im lặng. Luôn trả 0, stdin chuyển thẳng cho node.
lumina_storage_node() {
  command -v node >/dev/null 2>&1 && [ -f "$lumina_storage_node_helper" ] || return 0
  node "$lumina_storage_node_helper" "$@" 2>/dev/null || true
  return 0
}

# Dọn file cũ (log + state) một lần mỗi ngày; root = thư mục chứa .agents/storage.
lumina_storage_prune() {
  lumina_storage_node prune "$1" >/dev/null
}

# Thư mục project: CLAUDE_PROJECT_DIR nếu hợp lệ, không thì cwd.
lumina_project_root() {
  if [ -n "$CLAUDE_PROJECT_DIR" ] && [ -d "$CLAUDE_PROJECT_DIR" ]; then
    printf '%s\n' "$CLAUDE_PROJECT_DIR"
  else
    pwd
  fi
}

lumina_log_file() {
  local log_dir="$1" file
  mkdir -p "$log_dir" 2>/dev/null || return 0
  file="$log_dir/logs-$(date +%Y%m%d).jsonl"
  # Lần ghi đầu của ngày: dọn file cũ. log_dir luôn là <root>/.agents/storage/logs.
  if [ ! -e "$file" ]; then
    : >> "$file" 2>/dev/null
    lumina_storage_prune "${log_dir%/.agents/storage/logs}"
  fi
  printf '%s\n' "$file"
  return 0
}

lumina_log_files() {
  local log_dir="$1"
  [ -d "$log_dir" ] || return 0
  ls -1 "$log_dir" 2>/dev/null | grep -E "$lumina_dated_log_pattern" | sort | while IFS= read -r name; do
    printf '%s\n' "$log_dir/$name"
  done
  return 0
}

# Chỉ lọc thô bằng grep (rẻ) để reader không phải đưa cả log vào jq; reader vẫn tự lọc chính xác bằng jq.
# Writer ghi JSON compact (jq -c / JSON.stringify) nên chuỗi "session_id":"<id>" khớp nguyên văn. Cần jq.
lumina_session_log_lines() {
  local log_dir="$1" session_id="$2" needle file
  local files=()
  while IFS= read -r file; do
    files+=("$file")
  done < <(lumina_log_files "$log_dir")
  [ "${#files[@]}" -gt 0 ] || return 0
  needle="$(jq -cn --arg sid "$session_id" '{session_id: $sid}')" || return 0
  needle="${needle#\{}"
  needle="${needle%\}}"
  grep -hF -- "$needle" "${files[@]}" 2>/dev/null
  return 0
}

lumina_state_get() {
  lumina_storage_node state-get "$1" "$2" "$3"
}

lumina_state_set() {
  printf '%s' "$4" | lumina_storage_node state-set "$1" "$2" "$3" >/dev/null
}

lumina_state_push() {
  lumina_storage_node state-push "$1" "$2" "$3" >/dev/null
}
