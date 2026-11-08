#!/usr/bin/env bash
# PreToolUse hook: warn (ask) before a high-risk `git push` -- push
# directly to main/master, force push, or skipping hooks/commit signing --
# a second line of defense for the Git Safety Protocol, in case the agent ran
# this command without asking the user first.
#
# Reads JSON input from stdin per the PreToolUse schema:
#   { "tool_name": "Bash", "tool_input": { "command": "..." }, ... }
#
# Use permissionDecision "ask" (not "deny"): this is a warning for the user
# to confirm, not an absolute ban -- there are valid cases that need pushing
# straight to main or force pushing that the user already agreed to.
#
# Best-effort: missing jq/git -> do not block.

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
invocations="$(git_invocations "$command_str" push)" || true
[ -n "$invocations" ] || exit 0

reasons=()

is_protected_branch() {
  case "${1#refs/heads/}" in
    main|master) return 0 ;;
    *) return 1 ;;
  esac
}

# Target remote branch of a refspec (`[+]<src>[:<dst>]`); without `:` the target
# equals the source, `HEAD`/`@` is the current branch. With `--delete`, the refspec is the target.
refspec_destination() {
  local refspec="${1#+}" deleting="$2" current_branch="$3" source destination
  if [ "$deleting" -eq 1 ] || [[ "$refspec" != *:* ]]; then
    source="$refspec"
    destination="$refspec"
  else
    source="${refspec%%:*}"
    destination="${refspec#*:}"
  fi
  case "$destination" in
    HEAD|@) [ "$source" = "$destination" ] && destination="$current_branch" ;;
  esac
  printf '%s' "$destination"
}

# Only read the flags/refspec of the executed `git push` command itself, not heredoc/string
# data; a dynamic subcommand (`git "$x"`) is checked as a real push.
while IFS= read -r invocation; do
  [ -z "$invocation" ] && continue
  IFS=$'\037' read -r -a fields <<< "$invocation"
  directory="${fields[1]}"
  if [ -n "$directory" ] && [ ! -d "$directory" ]; then
    reasons+=("cannot enter git -C directory '$directory' to determine the branch")
    continue
  fi

  force=0
  skip_verification=0
  deleting=0
  pushes_every_branch=0
  options_ended=0
  skip_next=0
  positionals=()
  for raw_argument in "${fields[@]:2}"; do
    case "$raw_argument" in $'\035'*) continue ;; esac
    argument="$(decode_shell_token "$raw_argument")"
    if [ "$skip_next" -eq 1 ]; then skip_next=0; continue; fi
    if [ "$options_ended" -eq 1 ]; then positionals+=("$argument"); continue; fi
    case "$argument" in
      --) options_ended=1 ;;
      --force|--force=*|--force-with-lease|--force-with-lease=*|--force-if-includes) force=1 ;;
      --no-verify|--no-gpg-sign) skip_verification=1 ;;
      --delete) deleting=1 ;;
      --mirror|--all|--branches) pushes_every_branch=1 ;;
      --repo|--push-option|--receive-pack|--exec) skip_next=1 ;;
      --*) ;;
      -*)
        [[ "$argument" == *f* ]] && force=1
        [[ "$argument" == *d* ]] && deleting=1
        [[ "$argument" =~ ^-[A-Za-z]*o$ ]] && skip_next=1
        ;;
      *) positionals+=("$argument") ;;
    esac
  done

  [ "$force" -eq 1 ] && reasons+=("force push (may overwrite remote history/branch)")
  [ "$skip_verification" -eq 1 ] && reasons+=("skips hooks/commit signing (--no-verify/--no-gpg-sign)")
  [ "$pushes_every_branch" -eq 1 ] && reasons+=("pushes every branch (--mirror/--all), including main/master")

  current_branch="$(git -C "${directory:-.}" rev-parse --abbrev-ref HEAD 2>/dev/null)" || true
  # The first argument is the remote; without a refspec the target is decided by config,
  # so rely on the current branch as before.
  if [ "${#positionals[@]}" -le 1 ]; then
    if [ "$pushes_every_branch" -eq 0 ] && is_protected_branch "$current_branch"; then
      reasons+=("push directly to branch ${current_branch}")
    fi
    continue
  fi
  for refspec in "${positionals[@]:1}"; do
    destination="$(refspec_destination "$refspec" "$deleting" "$current_branch")"
    [[ "$refspec" == +* ]] && reasons+=("force push qua refspec '$refspec'")
    if [ -z "$destination" ] || [[ "$destination" == *'*'* ]]; then
      reasons+=("refspec '$refspec' may include main/master")
    elif [ "$deleting" -eq 1 ] || [[ "$refspec" == :* ]]; then
      if is_protected_branch "$destination"; then reasons+=("delete remote branch ${destination#refs/heads/}"); fi
    elif is_protected_branch "$destination"; then
      reasons+=("push directly to branch ${destination#refs/heads/}")
    fi
  done
done <<< "$invocations"

[ "${#reasons[@]}" -eq 0 ] && exit 0

reason_list="$(printf '%s; ' "${reasons[@]}")"
reason_text="High-risk action before push: ${reason_list%; }. Confirm with the user before continuing."
jq -n --arg reason "$reason_text" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "ask",
    permissionDecisionReason: $reason
  }
}'
exit 0
