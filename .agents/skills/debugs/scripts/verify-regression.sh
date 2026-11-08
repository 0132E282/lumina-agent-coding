#!/usr/bin/env bash
# Machine-checks the Regression criterion of rules/bug-fix.md: the regression test must
# FAIL on the unfixed version (<base-ref>) and PASS on the current working tree.
#
# Usage: bash verify-regression.sh [--evidence-dir <dir>] <base-ref> -- <test command...>
#   vd:  bash .agents/skills/debugs/scripts/verify-regression.sh main -- node --test tests/cart.test.mjs
#
# - Creates a temporary git worktree (system temp dir) at <base-ref>, copies into it the
#   test files added/changed vs base (commits from merge-base to HEAD, staged,
#   unstaged, untracked); the repo root `node_modules` is symlinked over if present.
# - Runs the test command in the base worktree, then in the current working tree.
# - Full log: .agents/storage/evidence/<branch-slug>/<yyyyMMdd-HHmm>-regression.log
#   (or --evidence-dir). Read the log to be sure base fails for the right reason, not the environment.
# - Never modifies the current working tree/index; the temp worktree is always cleaned (trap EXIT).
#   The script only runs the test command passed in — never writes to a DB or pushes.
#
# Exit: 0 base FAIL + head PASS; 1 base PASS (test does not reproduce the bug) or
# head FAIL; 2 bad usage, invalid ref or no regression test.

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

repository_root="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "Not inside a git repo." >&2; exit 2; }
cd "$repository_root" || exit 2
base_sha="$(git rev-parse --verify --quiet "${base_ref}^{commit}")" || { echo "Invalid ref: $base_ref" >&2; exit 2; }

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
  echo "No regression test: no new/changed test file found vs $base_ref." >&2
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
  echo "Could not create a worktree at $base_ref (see $log_file)." >&2
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
  echo "Conclusion: test does not reproduce the bug (passes on base too)."
  exit 1
fi
if [ "$head_status" -ne 0 ]; then
  echo "Conclusion: the fix did not make the test pass."
  exit 1
fi
echo "Conclusion: regression test fails on base and passes on head."
exit 0
