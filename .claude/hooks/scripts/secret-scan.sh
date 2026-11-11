#!/usr/bin/env bash
# PreToolUse hook: scan `git add`/`git commit` for content that looks like
# secrets/credentials (API key, private key, .env file) before it is staged
# or committed -- see rules/backend.md.
#
# Reads JSON input from stdin per the PreToolUse schema:
#   { "tool_name": "Bash", "tool_input": { "command": "..." }, ... }
#
# Only uses permissionDecision "ask" (not "deny"): the regex heuristic may
# give false positives (e.g. a test file containing a sample string), so let the user
# confirm instead of hard blocking.
#
# Best-effort: missing jq/git, or path/diff cannot be extracted -> do not block.

# ! Skip if the project already has the same hook (avoid running twice with the user-level copy).
. "$(dirname "$0")/_dedupe-guard.sh"

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0

input="$(cat)"

tool_name="$(printf '%s' "$input" | jq -r '.tool_name // ""' 2>/dev/null)"
[ "$tool_name" = "Bash" ] || exit 0

command_str="$(printf '%s' "$input" | jq -r '.tool_input.command // ""' 2>/dev/null)"
[ -z "$command_str" ] && exit 0

. "$(dirname "$0")/_shell-command.sh"
add_invocations="$(git_invocations "$command_str" add)" || true
commit_invocations="$(git_invocations "$command_str" commit)" || true
[ -n "$add_invocations$commit_invocations" ] || exit 0

SECRET_PATTERNS=(
  '-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----'
  'AKIA[0-9A-Z]{16}'
  "(api[_-]?key|secret|token|password)[[:space:]]*[:=][[:space:]]*[\"'][A-Za-z0-9/+_=-]{16,}[\"']"
  # Unquoted .env/shell assignment: KEY=value, value >= 16 characters, not `$VAR`.
  "^[[:space:]]*(export[[:space:]]+)?[A-Z0-9_]*(API_?KEY|SECRET|TOKEN|PASSWORD|PASSWD)[A-Z0-9_]*=[\"']?[^[:space:]\"'\$]{16,}"
  '(ghp|gho|ghs|ghu|ghr)_[A-Za-z0-9]{20,}'
  'github_pat_[A-Za-z0-9_]{20,}'
  'xox[baprs]-[A-Za-z0-9-]{10,}'
  'sk_live_[A-Za-z0-9]{16,}'
  'AIza[0-9A-Za-z_-]{35}'
  'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'
)
SECRET_PATTERN="$(IFS='|'; printf '%s' "${SECRET_PATTERNS[*]}")"

flagged=()

is_env_file() {
  case "$1" in
    *.env|*.env.*)
      case "$1" in
        *.example|*.sample|*.template) return 1 ;;
        *) return 0 ;;
      esac
      ;;
    *) return 1 ;;
  esac
}

# If the `git -C` directory cannot be entered it cannot be checked -> ask again instead of skipping.
directory_is_usable() {
  [ -z "$1" ] || [ -d "$1" ] && return 0
  flagged+=("cannot enter git -C directory '$1' to check")
  return 1
}

# A pathspec may match many files (directory, glob, `:` magic), must be listed via git.
pathspec_needs_listing() {
  case "$1" in
    :*|*'*'*|*'?'*|*'['*) return 0 ;;
  esac
  [ -d "$2" ]
}

# Check .env names and file contents (paths relative to `$1`, NUL-separated on
# stdin); grep runs in batches via xargs, not one process spawned per file.
check_listed_files() {
  local base="$1" name
  local -a existing=()
  while IFS= read -r -d '' name; do
    is_env_file "$name" && flagged+=("$name (file .env)")
    [ -f "$base/$name" ] && existing+=("$name")
  done
  [ "${#existing[@]}" -eq 0 ] && return 0
  while IFS= read -r name; do
    [ -n "$name" ] && flagged+=("$name (matches secret pattern)")
  done < <(cd "$base" && printf '%s\0' "${existing[@]}" | xargs -0 grep -lIE -- "$SECRET_PATTERN" 2>/dev/null)
  return 0
}

# Files `git add` will stage: modified tracked (+ untracked not ignored, or even
# ignored with `-f`), paths relative to the repo root.
list_add_candidates() {
  local directory="$1" tracked_only="$2" include_ignored="$3"
  shift 3
  local -a selection=(--modified --others --exclude-standard)
  if [ "$tracked_only" -eq 1 ]; then
    selection=(--modified)
  elif [ "$include_ignored" -eq 1 ]; then
    selection=(--modified --others)
  fi
  git -C "${directory:-.}" ls-files -z --full-name "${selection[@]}" -- "$@" 2>/dev/null
}

# Add a warning when the diff (added lines) matches a pattern or the file name is .env.
check_diff() {
  local directory="$1" label="$2" name diff_text
  shift 2
  while IFS= read -r -d '' name; do
    is_env_file "$name" && flagged+=("$name (file .env)")
  done < <(git -C "${directory:-.}" diff --name-only -z "$@" 2>/dev/null)
  diff_text="$(git -C "${directory:-.}" diff --no-color --no-ext-diff "$@" 2>/dev/null)" || true
  if [ -n "$diff_text" ] && printf '%s\n' "$diff_text" | grep -E '^\+' | sed 's/^+//' | grep -qE -- "$SECRET_PATTERN"; then
    flagged+=("$label (matches secret pattern)")
  fi
  return 0
}

while IFS= read -r invocation; do
  [ -z "$invocation" ] && continue
  IFS=$'\037' read -r -a fields <<< "$invocation"
  add_directory="${fields[1]}"
  directory_is_usable "$add_directory" || continue
  stages_everything=0
  tracked_only=0
  include_ignored=0
  options_ended=0
  listed_pathspecs=()
  pathspec_count=0
  for raw_argument in "${fields[@]:2}"; do
    case "$raw_argument" in $'\035'*) continue ;; esac
    p="$(decode_shell_token "$raw_argument")"
    [ -z "$p" ] && continue
    if [ "$options_ended" -eq 0 ]; then
      case "$p" in
        --) options_ended=1; continue ;;
        --all|--no-ignore-removal) stages_everything=1; continue ;;
        --update) tracked_only=1; continue ;;
        --force) include_ignored=1; continue ;;
        --*) continue ;;
        -*)
          [[ "$p" == *A* ]] && stages_everything=1
          [[ "$p" == *u* ]] && tracked_only=1
          [[ "$p" == *f* ]] && include_ignored=1
          continue
          ;;
      esac
    fi
    pathspec_count=$((pathspec_count + 1))
    if is_env_file "$p"; then
      flagged+=("$p (file .env)")
    fi
    path_on_disk="$p"
    case "$p" in
      /*) ;;
      *) [ -n "$add_directory" ] && path_on_disk="$add_directory/$p" ;;
    esac
    if [ -f "$path_on_disk" ] && grep -qE -- "$SECRET_PATTERN" "$path_on_disk" 2>/dev/null; then
      flagged+=("$p (matches secret pattern)")
    fi
    if pathspec_needs_listing "$p" "$path_on_disk"; then
      listed_pathspecs+=("$p")
    fi
  done
  # `git add -A`/`-u` without a pathspec stages the whole repo.
  if [ "$pathspec_count" -eq 0 ] && [ "$((stages_everything + tracked_only))" -gt 0 ]; then
    listed_pathspecs=(':/')
  fi
  [ "${#listed_pathspecs[@]}" -eq 0 ] && continue
  repository_root="$(git -C "${add_directory:-.}" rev-parse --show-toplevel 2>/dev/null)" || continue
  check_listed_files "$repository_root" \
    < <(list_add_candidates "$add_directory" "$tracked_only" "$include_ignored" "${listed_pathspecs[@]}")
done <<< "$add_invocations"

while IFS= read -r invocation; do
  [ -z "$invocation" ] && continue
  IFS=$'\037' read -r -a fields <<< "$invocation"
  commit_directory="${fields[1]}"
  directory_is_usable "$commit_directory" || continue
  includes_tracked_changes=0
  options_ended=0
  skip_next=0
  commit_pathspecs=()
  for raw_argument in "${fields[@]:2}"; do
    case "$raw_argument" in $'\035'*) continue ;; esac
    argument="$(decode_shell_token "$raw_argument")"
    if [ "$skip_next" -eq 1 ]; then skip_next=0; continue; fi
    if [ "$options_ended" -eq 1 ]; then commit_pathspecs+=("$argument"); continue; fi
    case "$argument" in
      --) options_ended=1 ;;
      --all) includes_tracked_changes=1 ;;
      --message|--file|--author|--date|--reuse-message|--reedit-message|--fixup|--squash|--template|--cleanup|--trailer|--pathspec-from-file) skip_next=1 ;;
      --*) ;;
      -*)
        # Short flag cluster: `-am msg`; m/F/C/c/t take a value (attached or next argument).
        for ((position = 1; position < ${#argument}; position++)); do
          flag="${argument:position:1}"
          case "$flag" in
            a) includes_tracked_changes=1 ;;
            m|F|C|c|t) [ "$position" -eq "$((${#argument} - 1))" ] && skip_next=1; break ;;
            S|u) break ;;
          esac
        done
        ;;
      *) commit_pathspecs+=("$argument") ;;
    esac
  done
  check_diff "$commit_directory" "staged changes" --cached
  # `-a` or a pathspec commits tracked changes not yet staged.
  if [ "$includes_tracked_changes" -eq 1 ]; then
    check_diff "$commit_directory" "tracked changes (commit -a)" HEAD
  elif [ "${#commit_pathspecs[@]}" -gt 0 ]; then
    check_diff "$commit_directory" "tracked changes (commit <pathspec>)" HEAD -- "${commit_pathspecs[@]}"
  fi
done <<< "$commit_invocations"

[ "${#flagged[@]}" -eq 0 ] && exit 0

flagged_list="$(printf '%s; ' "${flagged[@]}")"
reason="Detected content that looks like secrets/credentials or could not be checked: ${flagged_list%; }. Confirm with the user again before continuing (rules/backend.md)."
jq -n --arg reason "$reason" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "ask",
    permissionDecisionReason: $reason
  }
}'
exit 0
