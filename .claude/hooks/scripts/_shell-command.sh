#!/usr/bin/env bash
# Chỉ được `source` từ hook, không đăng ký trong settings.json.
# ! Tách lệnh Bash thành từng lệnh đơn đã bỏ nháy để hook chỉ xét lệnh git
# thực thi thật — không bắt nhầm chữ "git ..." trong thân heredoc/chuỗi.
#
# Mã hoá đầu ra: token cách nhau bởi \037; xuống dòng trong token là \036;
# token bắt đầu bằng \035 là thân heredoc gắn với lệnh đó.

# In mỗi lệnh git thực thi có subcommand = $2 (hoặc subcommand động như
# `git "$x"`/`git $(...)` — fail-safe, coi như có thể là $2) một dòng:
#   <known|unknown>\037<thư mục chạy git>\037<đối số sau subcommand...>
#
# Tách lệnh Bash thành lệnh đơn (sau `;`, `&&`, `||`, `|`, `&`, `(`, `)`,
# xuống dòng), bỏ nháy; nội dung `$(...)` có heredoc được thay bằng thân
# heredoc (dạng `-m "$(cat <<'EOF' ... EOF)"`), `$(...)` khác giữ nguyên chữ.
# `<<` trong `((...))`, `$((...))` và `let` không phải heredoc; heredoc thiếu
# dòng kết thúc thì phần sau vẫn là lệnh.
# Thư mục chạy git gộp `cd <dir>` tĩnh trước đó và `-C <dir>`; rỗng = cwd.
# Bỏ qua tiền tố gán biến, từ khoá (!, if/then/do/else/elif/while/until/{),
# wrapper (sudo/env/command/time/nohup/exec/nice/timeout/xargs/stdbuf/ionice/
# flock) và global option của git. Script con (`$(...)`, backtick,
# `bash|sh|zsh|dash|ksh -c`, `eval`) được phân tích tối đa 4 tầng trong cùng
# một tiến trình awk.
git_invocations() {
  printf '%s\n' "$1" | awk -v wanted="$2" '
    { text = text $0 "\n" }
    function combine(parent, child) {
      if (child ~ /^\// || parent == "") return child
      return parent "/" child
    }
    function takes_argument(wrapper, option) {
      return index(" " wrapper_options[wrapper] " ", " " option " ") > 0
    }
    function enqueue_script(parent, content) {
      if (script_depths[parent] >= 4) return 0
      script_count++
      script_texts[script_count] = content
      script_depths[script_count] = script_depths[parent] + 1
      directories[script_count] = directories[parent]
      return script_count
    }
    # Xét một lệnh đơn của script `identifier`: theo dõi `cd`, đưa `bash -c`/
    # `eval` vào hàng đợi, in lệnh git khớp `wanted`.
    function analyze(identifier, record,    words, count, i, k, word, option, program, target, script, git_directory, subcommand, status, line) {
      count = split(record, words, "\037")
      for (k = 1; k <= count; k++) gsub(/\036/, "\n", words[k])
      i = 1
      while (i <= count) {
        word = words[i]
        if (word ~ /^[A-Za-z_][A-Za-z0-9_]*=/ || (word in keywords)) { i++; continue }
        if (word in wrapper_options) {
          i++
          while (i <= count && words[i] ~ /^-/) {
            option = words[i]
            i++
            if (option == "--") break
            if (takes_argument(word, option)) i++
          }
          if (word in positional_arguments) i += positional_arguments[word]
          continue
        }
        break
      }
      if (i > count) return
      program = words[i]
      sub(/.*\//, "", program)
      if (program == "cd") {
        target = words[i + 1]
        if (target == "--") target = words[i + 2]
        if (target != "" && target !~ /^[-~]/ && target !~ /[$`]/ && substr(target, 1, 1) != "\035") directories[identifier] = combine(directories[identifier], target)
        return
      }
      if (program == "bash" || program == "sh" || program == "zsh" || program == "dash" || program == "ksh") {
        for (k = i + 1; k <= count && words[k] ~ /^[-+]/; k++) {
          if (words[k] ~ /^-[A-Za-z]*c[A-Za-z]*$/) { if (k < count) enqueue_script(identifier, words[k + 1]); return }
          if (words[k] == "-o" || words[k] == "+o") k++
        }
        return
      }
      if (program == "eval") {
        script = ""
        for (k = i + 1; k <= count; k++) script = script (k > i + 1 ? " " : "") words[k]
        enqueue_script(identifier, script)
        return
      }
      if (program != "git") return
      i++
      git_directory = directories[identifier]
      while (i <= count && words[i] ~ /^-/) {
        option = words[i]
        if (option == "-C") { git_directory = combine(git_directory, words[i + 1]); i += 2; continue }
        if (option == "-c" || option == "--git-dir" || option == "--work-tree" || option == "--namespace" || option == "--config-env" || option == "--super-prefix") { i += 2; continue }
        i++
      }
      if (i > count) return
      subcommand = words[i]
      status = "known"
      if (subcommand ~ /[$`]/ || substr(subcommand, 1, 1) == "\035") status = "unknown"
      else if (subcommand != wanted) return
      line = status "\037" git_directory
      for (k = i + 1; k <= count; k++) {
        gsub(/\n/, "\036", words[k])
        line = line "\037" words[k]
      }
      print line
    }
    BEGIN {
      wrapper_options["sudo"] = "-u -g -h -p -C -U -r -t -D"
      wrapper_options["env"] = "-u -C -S"
      wrapper_options["command"] = ""
      wrapper_options["time"] = "-f -o"
      wrapper_options["nohup"] = ""
      wrapper_options["exec"] = "-a"
      wrapper_options["nice"] = "-n"
      wrapper_options["timeout"] = "-s -k"
      wrapper_options["xargs"] = "-I -n -P -L -d -s -a -E"
      wrapper_options["stdbuf"] = "-i -o -e"
      wrapper_options["ionice"] = "-c -n -p -P -u"
      wrapper_options["flock"] = "-w -E"
      positional_arguments["timeout"] = 1
      positional_arguments["flock"] = 1
      split("! if then do else elif while until {", keyword_list, " ")
      for (k in keyword_list) keywords[keyword_list[k]] = 1
    }
    function line_end(start,    offset) {
      offset = index(substr(text, start), "\n")
      return offset ? start + offset - 1 : length_of_text + 1
    }
    function trim(value) { sub(/^[ \t]+/, "", value); sub(/[ \t]+$/, "", value); return value }
    # Đọc toán tử heredoc tại vị trí `<<`; đặt heredoc_delimiter.
    function parse_heredoc_operator(position,    quote, start) {
      position += 2
      if (substr(text, position, 1) == "-") position++
      while (substr(text, position, 1) ~ /[ \t]/) position++
      quote = substr(text, position, 1)
      if (quote == "\047" || quote == "\"") {
        start = position + 1
        position = start
        while (position <= length_of_text && substr(text, position, 1) != quote) position++
        heredoc_delimiter = substr(text, start, position - start)
        return position + 1
      }
      if (quote == "\\") position++
      start = position
      while (position <= length_of_text && substr(text, position, 1) !~ /[ \t\n;&|<>()]/) position++
      heredoc_delimiter = substr(text, start, position - start)
      return position
    }
    # Đọc thân heredoc sau ký tự xuống dòng tại `position`. Tìm thấy dòng kết
    # thúc: heredoc_closed=1, trả về vị trí xuống dòng của dòng đó. Không thấy:
    # heredoc_closed=0, giữ nguyên vị trí để phần sau được phân tích như lệnh.
    function read_heredoc_body(position, delimiter,    start, finish, line, cursor) {
      heredoc_body = ""
      heredoc_closed = 0
      cursor = position
      while (cursor <= length_of_text) {
        start = cursor + 1
        finish = line_end(start)
        line = substr(text, start, finish - start)
        if (trim(line) == delimiter) { heredoc_closed = 1; return finish }
        heredoc_body = heredoc_body line "\n"
        cursor = finish
      }
      heredoc_body = ""
      return position
    }
    # Bỏ qua cặp ngoặc tròn lồng nhau bắt đầu tại `position` (dùng cho số học).
    function skip_parentheses(position,    depth, character) {
      depth = 0
      while (position <= length_of_text) {
        character = substr(text, position, 1)
        if (character == "(") depth++
        if (character == ")") { depth--; if (depth == 0) return position + 1 }
        position++
      }
      return position
    }
    # Ghi script con (nội dung `$(...)`/backtick) của lệnh sở hữu; được đưa
    # vào hàng đợi khi tới lượt lệnh đó để kế thừa đúng thư mục `cd`.
    function add_nested(owner, content) {
      nested_counts[owner]++
      nested_texts[owner, nested_counts[owner]] = content
    }
    # Đọc `$(...)` bắt đầu tại `$`; đặt substitution_value, trả về vị trí sau `)`.
    function parse_substitution(position,    start, depth, character, next_character, count, delimiters, k, body, found, finish) {
      start = position
      if (substr(text, position + 2, 1) == "(") {
        position = skip_parentheses(position + 1)
        substitution_value = substr(text, start, position - start)
        return position
      }
      position += 2
      depth = 1
      count = 0
      body = ""
      found = 0
      while (position <= length_of_text && depth > 0) {
        character = substr(text, position, 1)
        next_character = substr(text, position + 1, 1)
        if (character == "\\") { position += 2; continue }
        if (character == "\047" || character == "\"") {
          position++
          while (position <= length_of_text && substr(text, position, 1) != character) {
            if (character == "\"" && substr(text, position, 1) == "\\") position++
            position++
          }
          position++
          continue
        }
        if (character == "<" && next_character == "<" && substr(text, position + 2, 1) != "<") {
          position = parse_heredoc_operator(position)
          delimiters[++count] = heredoc_delimiter
          continue
        }
        if (character == "\n" && count > 0) {
          for (k = 1; k <= count; k++) {
            finish = read_heredoc_body(position, delimiters[k])
            if (!heredoc_closed) continue
            position = finish
            body = body heredoc_body
            found = 1
          }
          count = 0
          position++
          continue
        }
        if (character == "(") depth++
        if (character == ")") depth--
        position++
      }
      add_nested(current, substr(text, start + 2, position - start - 3))
      substitution_value = found ? body : substr(text, start, position - start)
      return position
    }
    # Bỏ qua một từ (đích redirect/here-string), tôn trọng nháy.
    function skip_word(position,    character, quote) {
      while (substr(text, position, 1) ~ /[ \t]/) position++
      while (position <= length_of_text) {
        character = substr(text, position, 1)
        if (character ~ /[ \t\n;&|<>()]/) break
        if (character == "\047" || character == "\"") {
          quote = character
          position++
          while (position <= length_of_text && substr(text, position, 1) != quote) position++
        }
        position++
      }
      return position
    }
    function add_token(owner, value) {
      gsub(/\n/, "\036", value)
      if (!token_counts[owner]) first_tokens[owner] = value
      commands[owner] = token_counts[owner] ? commands[owner] "\037" value : value
      token_counts[owner]++
    }
    function flush_token() {
      if (has_token) add_token(current, token)
      token = ""
      has_token = 0
    }
    function end_command() {
      flush_token()
      if (token_counts[current] > 0) { current++; commands[current] = ""; token_counts[current] = 0 }
    }
    # Tách rồi phân tích một script trong hàng đợi.
    function tokenize(identifier) {
      script_id = identifier
      text = script_texts[identifier]
      length_of_text = length(text)
      delete commands
      delete token_counts
      delete first_tokens
      delete nested_counts
      delete nested_texts
      current = 1
      commands[1] = ""
      token_counts[1] = 0
      pending_count = 0
      token = ""
      has_token = 0
      for (i = 1; i <= length_of_text; i++) {
        character = substr(text, i, 1)
        next_character = substr(text, i + 1, 1)
        if (character == "\\") {
          if (next_character != "\n") { token = token next_character; has_token = 1 }
          i++
          continue
        }
        if (character == "\047") {
          finish = index(substr(text, i + 1), "\047")
          if (finish == 0) finish = length_of_text - i + 1
          token = token substr(text, i + 1, finish - 1)
          has_token = 1
          i += finish
          continue
        }
        if (character == "\"") {
          k = i + 1
          while (k <= length_of_text && substr(text, k, 1) != "\"") {
            inner = substr(text, k, 1)
            if (inner == "\\") {
              escaped = substr(text, k + 1, 1)
              if (escaped ~ /["\\$`]/) token = token escaped
              else if (escaped != "\n") token = token "\\" escaped
              k += 2
              continue
            }
            if (inner == "$" && substr(text, k + 1, 1) == "(") {
              k = parse_substitution(k)
              token = token substitution_value
              continue
            }
            if (inner == "`") {
              finish = index(substr(text, k + 1), "`")
              if (finish == 0) finish = length_of_text - k + 1
              add_nested(current, substr(text, k + 1, finish - 1))
              token = token "`" substr(text, k + 1, finish)
              k += finish + 1
              continue
            }
            token = token inner
            k++
          }
          has_token = 1
          i = k
          continue
        }
        if (character == "$" && next_character == "(") {
          i = parse_substitution(i) - 1
          token = token substitution_value
          has_token = 1
          continue
        }
        if (character == "`") {
          finish = index(substr(text, i + 1), "`")
          if (finish == 0) finish = length_of_text - i + 1
          add_nested(current, substr(text, i + 1, finish - 1))
          token = token "`" substr(text, i + 1, finish)
          has_token = 1
          i += finish
          continue
        }
        if (character == " " || character == "\t") { flush_token(); continue }
        if (character == "\n") {
          flush_token()
          for (p = 1; p <= pending_count; p++) {
            finish = read_heredoc_body(i, pending_delimiters[p])
            if (!heredoc_closed) continue
            i = finish
            add_token(pending_owners[p], "\035" heredoc_body)
          }
          pending_count = 0
          end_command()
          continue
        }
        if (character == "#" && !has_token) { i = line_end(i) - 1; continue }
        if (character == "<" && next_character == "<") {
          if (token_counts[current] > 0 && first_tokens[current] == "let") {
            token = token "<<"
            has_token = 1
            i++
            continue
          }
          flush_token()
          if (substr(text, i + 2, 1) == "<") { i = skip_word(i + 3) - 1; continue }
          i = parse_heredoc_operator(i) - 1
          pending_count++
          pending_delimiters[pending_count] = heredoc_delimiter
          pending_owners[pending_count] = current
          continue
        }
        if (character == ">" || character == "<" || (character == "&" && next_character == ">")) {
          if (token ~ /^[0-9]+$/) { token = ""; has_token = 0 } else flush_token()
          k = i + 1
          while (substr(text, k, 1) ~ /[<>&|]/) k++
          i = skip_word(k) - 1
          continue
        }
        if (character == "(" && next_character == "(") {
          end_command()
          i = skip_parentheses(i) - 1
          continue
        }
        if (character == ";" || character == "&" || character == "|" || character == "(" || character == ")") {
          end_command()
          continue
        }
        token = token character
        has_token = 1
      }
      flush_token()
      for (c = 1; c <= current; c++) {
        for (k = 1; k <= nested_counts[c]; k++) enqueue_script(identifier, nested_texts[c, k])
        if (token_counts[c] > 0) analyze(identifier, commands[c])
      }
    }
    # Script con xử lý theo hàng đợi trong cùng tiến trình awk (không spawn
    # thêm tiến trình cho mỗi script con), cha luôn xử lý trước con.
    END {
      script_count = 1
      script_texts[1] = text
      script_depths[1] = 0
      directories[1] = ""
      for (identifier = 1; identifier <= script_count; identifier++) tokenize(identifier)
    }
  '
}

is_executed_git_command() {
  [ -n "$(git_invocations "$1" "$2")" ]
}

# Giải mã một token: \036 -> xuống dòng, bỏ dấu \035 của thân heredoc.
decode_shell_token() {
  local value="${1//$'\036'/$'\n'}"
  printf '%s' "${value#$'\035'}"
}

# In commit message từ đối số đã tách của một lệnh `git commit` (-m/--message
# lặp lại nối bằng dòng trống; -F -/--file=- lấy thân heredoc). Trả về 1 khi
# không xác định được (editor, -F file, -C/-c/--fixup, `$(...)` không heredoc).
git_commit_message() {
  local -a parts=()
  local heredoc_body="" read_stdin=0 index=0 argument value
  local -a arguments=("$@")
  for argument in "${arguments[@]}"; do
    case "$argument" in
      $'\035'*) heredoc_body="$(decode_shell_token "$argument")" ;;
    esac
  done
  while [ "$index" -lt "${#arguments[@]}" ]; do
    argument="${arguments[$index]}"
    value="${arguments[$((index + 1))]:-}"
    case "$argument" in
      --) break ;;
      $'\035'*) ;;
      --message=*) parts+=("$(decode_shell_token "${argument#--message=}")") ;;
      --message) parts+=("$(decode_shell_token "$value")"); index=$((index + 1)) ;;
      --file=-) read_stdin=1 ;;
      --file) [ "$value" = "-" ] && read_stdin=1; index=$((index + 1)) ;;
      --file=*|--reuse-message*|--reedit-message*|--fixup*|--squash*) return 1 ;;
      --*) ;;
      -*)
        if [[ "$argument" =~ ^-[A-Za-z]*m$ ]]; then
          parts+=("$(decode_shell_token "$value")"); index=$((index + 1))
        elif [[ "$argument" =~ ^-[A-Za-z]*m(.+)$ ]]; then
          parts+=("$(decode_shell_token "${BASH_REMATCH[1]}")")
        elif [[ "$argument" =~ ^-[A-Za-z]*F$ ]]; then
          [ "$value" = "-" ] || return 1
          read_stdin=1; index=$((index + 1))
        elif [ "$argument" = "-F-" ]; then
          read_stdin=1
        elif [[ "$argument" =~ ^-[A-Za-z]*[cC]$ ]]; then
          return 1
        fi
        ;;
    esac
    index=$((index + 1))
  done
  [ "$read_stdin" -eq 1 ] && [ -n "$heredoc_body" ] && parts+=("$heredoc_body")
  [ "${#parts[@]}" -eq 0 ] && return 1
  local message="" part
  for part in "${parts[@]}"; do
    case "$part" in *'$('*|*'`'*) return 1 ;; esac
    if [ -z "$message" ]; then message="$part"; else message="$message"$'\n\n'"$part"; fi
  done
  printf '%s' "$message"
}
