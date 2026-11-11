#!/usr/bin/env bash
# Chỉ được `source` từ hook, không đăng ký trong settings.json.
# ! Chuẩn hoá đường dẫn file Write/Edit (file có thể chưa tồn tại) để so sánh với thư mục project.

# resolve_path <path> <thư mục gốc cho path tương đối>: mở `~`, gộp `.`/`..`, rồi
# realpath thư mục tổ tiên gần nhất còn tồn tại (đi qua symlink); phần chưa tồn
# tại giữ nguyên. `..` được gộp theo chữ trước khi resolve symlink.
resolve_path() {
  local path="$1" base="$2" existing remainder=""
  case "$path" in
    "~") path="$HOME" ;;
    "~/"*) path="$HOME/${path#\~/}" ;;
  esac
  case "$path" in /*) ;; *) path="$base/$path" ;; esac
  path="$(printf '%s' "$path" | awk -F/ '{
    count = 0
    for (i = 1; i <= NF; i++) {
      if ($i == "" || $i == ".") continue
      if ($i == "..") { if (count > 0) count--; continue }
      parts[++count] = $i
    }
    out = ""
    for (i = 1; i <= count; i++) out = out "/" parts[i]
    printf "%s", (out == "" ? "/" : out)
  }')"
  existing="$path"
  while [ ! -d "$existing" ] && [ "$existing" != "/" ]; do
    remainder="/$(basename "$existing")$remainder"
    existing="$(dirname "$existing")"
  done
  existing="$(cd "$existing" 2>/dev/null && pwd -P)" || return 1
  [ "$existing" = "/" ] && existing=""
  printf '%s%s' "$existing" "$remainder"
}
