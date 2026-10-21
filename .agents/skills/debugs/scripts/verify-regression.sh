#!/usr/bin/env bash
# Kiểm máy tiêu chí Regression của rules/bug-fix.md: regression test phải
# FAIL trên bản chưa sửa (<base-ref>) và PASS trên working tree hiện tại.
#
# Usage: bash verify-regression.sh [--evidence-dir <dir>] <base-ref> -- <test command...>
#   vd:  bash .agents/skills/debugs/scripts/verify-regression.sh main -- node --test tests/cart.test.mjs
#
# - Tạo git worktree tạm (thư mục tạm hệ thống) ở <base-ref>, copy vào đó các
#   file test mới/sửa so với base (commit từ merge-base tới HEAD, staged,
#   unstaged, untracked); `node_modules` ở gốc repo được symlink sang nếu có.
# - Chạy lệnh test trong worktree base rồi trong working tree hiện tại.
# - Log đầy đủ: .agents/storage/evidence/<slug-nhánh>/<yyyyMMdd-HHmm>-regression.log
#   (hoặc --evidence-dir). Đọc log để chắc base fail vì đúng lỗi, không vì môi trường.
# - Không sửa working tree/index hiện tại; worktree tạm luôn được dọn (trap EXIT).
#   Script chỉ chạy đúng lệnh test được truyền vào — không tự ghi DB hay push.
#
# Exit: 0 base FAIL + head PASS; 1 base PASS (test không tái hiện lỗi) hoặc
# head FAIL; 2 sai cách dùng, ref không hợp lệ hoặc không có regression test.

set -u

usage() {
  echo "Usage: bash verify-regression.sh [--evidence-dir <dir>] <base-ref> -- <test command...>" >&2
  exit 2
}

evidence_directory=""
base_ref=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --evidence-dir)
      [ "$#" -ge 2 ] || usage
      evidence_directory="$2"
      shift 2
      ;;
    --)
      shift
      break
      ;;
    *)
      [ -z "$base_ref" ] || usage
      base_ref="$1"
      shift
      ;;
  esac
done
[ -n "$base_ref" ] && [ "$#" -gt 0 ] || usage
test_command=("$@")

repository_root="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "Không ở trong repo git." >&2; exit 2; }
cd "$repository_root" || exit 2
base_sha="$(git rev-parse --verify --quiet "${base_ref}^{commit}")" || { echo "Ref không hợp lệ: $base_ref" >&2; exit 2; }

test_pattern='(^|/)(tests?|__tests__)/|\.test\.|\.spec\.|_test\.|(^|/)test_'
test_files=()
while IFS= read -r file; do
  [ -n "$file" ] && [ -f "$file" ] && test_files+=("$file")
done < <(
  {
    git diff --name-only --diff-filter=ACMR "${base_sha}...HEAD"
    git diff --name-only --diff-filter=ACMR --cached
    git diff --name-only --diff-filter=ACMR
    git ls-files --others --exclude-standard
  } | sort -u | grep -E -- "$test_pattern"
)
if [ "${#test_files[@]}" -eq 0 ]; then
  echo "Không có regression test: không thấy file test mới/sửa so với $base_ref." >&2
  exit 2
fi

if [ -z "$evidence_directory" ]; then
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
  [ "$branch" = "HEAD" ] && branch="detached-$(git rev-parse --short HEAD)"
  slug="$(printf '%s' "$branch" | sed -E 's/[^A-Za-z0-9._-]+/-/g; s/^-+|-+$//g')"
  evidence_directory="$repository_root/.agents/storage/evidence/${slug:-regression}"
fi
mkdir -p "$evidence_directory" || exit 2
log_file="$evidence_directory/$(date +%Y%m%d-%H%M)-regression.log"

temporary_directory="$(mktemp -d "${TMPDIR:-/tmp}/verify-regression.XXXXXX")" || exit 2
base_worktree="$temporary_directory/base"
cleanup() {
  git -C "$repository_root" worktree remove --force "$base_worktree" >/dev/null 2>&1
  rm -rf "${temporary_directory:?}"
  git -C "$repository_root" worktree prune >/dev/null 2>&1
}
trap cleanup EXIT

if ! git worktree add --quiet --detach "$base_worktree" "$base_sha" >>"$log_file" 2>&1; then
  echo "Không tạo được worktree ở $base_ref (xem $log_file)." >&2
  exit 2
fi
for file in "${test_files[@]}"; do
  mkdir -p "$base_worktree/$(dirname "$file")"
  cp -p "$file" "$base_worktree/$file"
done
if [ -d "$repository_root/node_modules" ] && [ ! -e "$base_worktree/node_modules" ]; then
  ln -s "$repository_root/node_modules" "$base_worktree/node_modules"
fi

run_tests() {
  local label="$1" directory="$2"
  {
    printf '===== %s (%s) =====\n$ %s\n' "$label" "$directory" "${test_command[*]}"
  } >>"$log_file"
  (cd "$directory" && "${test_command[@]}") >>"$log_file" 2>&1
}

{
  printf 'base-ref: %s (%s)\nhead: %s\ntest files:\n' "$base_ref" "$base_sha" "$(git rev-parse HEAD 2>/dev/null) + working tree"
  printf '  %s\n' "${test_files[@]}"
} >>"$log_file"

run_tests "base $base_sha" "$base_worktree"
base_status=$?
run_tests "head" "$repository_root"
head_status=$?

short_base="$(git rev-parse --short=12 "$base_sha")"
if [ "$base_status" -ne 0 ]; then echo "base $short_base: FAIL (exit $base_status)"; else echo "base $short_base: PASS"; fi
if [ "$head_status" -eq 0 ]; then echo "head: PASS"; else echo "head: FAIL (exit $head_status)"; fi
echo "log: $log_file"

if [ "$base_status" -eq 0 ]; then
  echo "Kết luận: test không tái hiện lỗi (pass cả trên base)."
  exit 1
fi
if [ "$head_status" -ne 0 ]; then
  echo "Kết luận: bản sửa chưa làm test pass."
  exit 1
fi
echo "Kết luận: regression test fail trên base và pass trên head."
exit 0
