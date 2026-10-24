# 🪝 Hooks

Hook phụ trợ cho các subagent trong [`agents/`](../agents) — tự động hóa các bước nên làm nhưng dễ bị bỏ quên.

## rtk — giảm token tiêu thụ cho lệnh Bash phổ biến

Trước mỗi lệnh `Bash`, hook này gọi CLI [`rtk`](https://github.com/rtk-ai/rtk) để viết lại các lệnh dev phổ biến (đọc file, grep, git...) sang dạng tiết kiệm token hơn — không phải script tự viết trong repo này.

- **Lệnh**: `command -v rtk >/dev/null 2>&1 || exit 0; rtk hook claude`
- **Loại hook**: `PreToolUse`, matcher `Bash`
- **Khác biệt với các hook còn lại**: đây là **tool bên ngoài**, không đi kèm framework — máy chưa cài `rtk` thì hook tự bỏ qua (exit 0, không báo lỗi). Cài theo [hướng dẫn chính thức](https://github.com/rtk-ai/rtk/blob/master/INSTALL.md), rồi chạy `rtk init -g` (hoặc `rtk init` trong 1 project) để đăng ký hook.
- **Kiểm tra mức tiết kiệm**: `rtk gain`.

## format-on-edit — tự động format bằng Prettier

Sau mỗi lần Claude Code (hoặc subagent) **Edit/Write** một file, hook này tự động chạy `prettier --write` trên đúng file vừa sửa — tương ứng quy tắc [`rules/delivery.md`](../rules/delivery.md#chất-lượng-và-bằng-chứng) (format thống nhất, không tranh cãi khoảng trắng trong review).

- **Script**: [`scripts/format-on-edit.sh`](./scripts/format-on-edit.sh)
- **Loại hook**: `PostToolUse`, matcher `Edit|Write`
- **Phạm vi file**: các định dạng Prettier hỗ trợ (`.js .jsx .ts .tsx .json .css .scss .less .html .vue .md .yaml .yml ...`). File không thuộc danh sách này bị bỏ qua, không lỗi.
- **An toàn**: luôn `exit 0` — nếu project không có Prettier (không có trong `PATH` và `npx` không resolve được), hook bỏ qua êm thay vì chặn agent.
- **Phụ thuộc**: cần có `jq` trong `PATH` để parse JSON input của hook (`brew install jq` / `apt install jq`).

### Cài đặt vào project khác

1. Copy thư mục này vào `.claude/hooks/` của project đích:
   ```bash
   cp -r .claude/hooks /path/to/project/.claude/hooks
   ```
2. Merge key `hooks` của [`.claude/settings.json`](../settings.json) vào `.claude/settings.json` của project đích (installer `lumina-agent` tự merge). Nếu project đã có `hooks` khác, gộp mảng thay vì ghi đè.
3. Đảm bảo project có Prettier (local `devDependencies` hoặc global) — nếu không có, hook sẽ không làm gì (không báo lỗi).

### Dùng formatter khác (Black, gofmt, dotnet format, PHP-CS-Fixer...)

`format-on-edit.sh` hiện chỉ xử lý các file Prettier hỗ trợ. Với project đa ngôn ngữ, thêm nhánh `case` tương ứng trong script, theo mẫu `automator.py` của `tester-agent` (tự phát hiện loại project rồi gọi đúng formatter).

## audit-log — ghi audit trail cho mọi tool call

Trước mỗi lần Claude Code (hoặc subagent) gọi **bất kỳ tool nào** (Edit, Write, Bash, Grep...), hook này ghi một dòng JSON vào log — phục vụ truy vết "ai/khi nào/làm gì", liên hệ [`rules/backend.md`](../rules/backend.md#an-toàn-dữ-liệu).

- **Script**: [`scripts/audit-log.sh`](./scripts/audit-log.sh)
- **Loại hook**: `PreToolUse`, matcher `.*` (mọi tool)
- **File log**: `.agents/storage/logs/logs.jsonl` (JSON Lines, append-only) — cả thư mục `.agents/storage/` đã nằm trong `.gitignore`, không commit nhầm.
- **Xoay vòng**: helper [`_log-rotate.sh`](./scripts/_log-rotate.sh) (source, không đăng ký trong settings) đổi `logs.jsonl` thành `logs-<UTC yyyyMMdd-HHmmss>[-N].jsonl` khi ≥ `LUMINA_LOG_MAX_BYTES` (mặc định 1 MiB), giữ `LUMINA_LOG_KEEP` file xoay mới nhất (mặc định 5), chỉ xoá file khớp mẫu tên đó. Best-effort, luôn `exit 0`. File xoay trước bản che secret có thể còn secret chưa che — cần thì xoá tay `logs-*.jsonl` cũ.
- **Nội dung mỗi dòng**: `ts` (UTC), `session_id`, `tool`, `cwd`, `input` (tóm tắt `file_path`/`command` ≤200 ký tự/`pattern`/`skill`; secret phổ biến che thành `***` — heuristic, không bảo đảm; **không** ghi nội dung file Write/Edit), thêm `agent_id` khi chạy trong subagent. [`turn-log`](#turn-log--một-dòng-tóm-tắt-mỗi-lượt) ghi thêm dòng `type: "turn"` vào cùng file.
- **An toàn**: luôn `exit 0`; input JSON hỏng, thiếu `jq` hoặc `tool_name` rỗng thì bỏ qua êm. Thư mục log lấy từ `CLAUDE_PROJECT_DIR`, fallback `cwd` trong payload rồi `pwd`; field `cwd` trong dòng log giữ nguyên giá trị gốc để truy vết.
- **Phụ thuộc**: cần `jq`.

### Xem log

```bash
# Theo dõi real-time, mỗi dòng in đẹp
tail -f .agents/storage/logs/logs.jsonl | jq .

# Đọc toàn bộ log hiện có dưới dạng 1 mảng JSON dễ đọc (ví dụ mở trong editor)
jq -s '.' .agents/storage/logs/logs.jsonl

# Gồm cả các file đã xoay vòng (cũ → mới)
cat .agents/storage/logs/logs-*.jsonl .agents/storage/logs/logs.jsonl | jq -s '.'
```

## commit-msg-guard — chặn commit message sai format

Trước mỗi lần chạy `git commit` (qua tool Bash), hook này trích message sắp dùng và validate bằng chính script `validate-commit-message.sh` của skill `git-workflow`, chặn (deny) nếu sai Conventional Commits — enforce [`rules/git.md`](../rules/git.md) tự động, không phụ thuộc Claude tự giác.

- **Script**: [`scripts/commit-msg-guard.sh`](./scripts/commit-msg-guard.sh)
- **Loại hook**: `PreToolUse`, matcher `Bash`
- **Nhận diện commit**: helper [`_shell-command.sh`](./scripts/_shell-command.sh) tách lệnh Bash thành lệnh đơn, bỏ nháy và thân heredoc, chỉ nhận `git commit` thực thi (kể cả sau tiền tố gán biến, wrapper như `sudo`/`env`/`timeout`, global option git, `bash -c`/`eval`/`$(...)` tối đa 4 tầng). `cd <dir>` tĩnh đổi thư mục chạy git; dir động bị bỏ qua. Chữ `git commit` trong heredoc/chuỗi bị bỏ qua.
- **Cách trích message**: chỉ từ đối số của chính lệnh `git commit` — `-m`/`--message` (lặp lại thì nối bằng dòng trống; `-m "$(cat <<'EOF' ... EOF)"` lấy thân heredoc) hoặc `-F -` kèm heredoc; không lấy heredoc/`-m` của lệnh khác (`cat <<EOF`, `git tag -m`). Mỗi lệnh `git commit` trong chuỗi được kiểm riêng.
- **An toàn**: best-effort — không trích được message (commit mở editor, dùng `-F`, thiếu `jq`/validator) thì không chặn, để git tự xử lý.
- **Phụ thuộc**: cần `jq` và `skills/git-workflow/scripts/validate-commit-message.sh`.

## bugfix-test-reminder — nhắc kèm regression test khi commit fix

Trước mỗi lần `git commit` có type Conventional Commit `fix` (`fix:`, `fix(scope):`, `fix!:`), nếu danh sách file sẽ commit không có file test nào, hook này nhắc qua `additionalContext`: theo [`rules/bug-fix.md`](../rules/bug-fix.md) cần regression test tái hiện lỗi; không tự động hóa được thì ghi cách kiểm tra trước/sau trong báo cáo. Tách khỏi `commit-msg-guard` vì hook đó chặn (deny) theo format message, còn hook này chỉ nhắc theo nội dung staged.

- **Script**: [`scripts/bugfix-test-reminder.sh`](./scripts/bugfix-test-reminder.sh)
- **Loại hook**: `PreToolUse`, matcher `Bash`
- **Nhận diện commit và trích message**: giống `commit-msg-guard` (cùng helper `_shell-command.sh`, kể cả `-am`); chỉ xét lệnh `git commit` đầu tiên có subcommand tĩnh, đọc staged trong `<dir>` khi dùng `git -C <dir>`. Coi là sửa bug khi type `fix` hoặc message có `Fixes|Closes|Resolves #<số>`.
- **File được xét**: `git diff --cached --name-only`; thêm file tracked đã sửa khi `-a`/`--all`; thêm file mà `git add` trong cùng lệnh sẽ stage (pathspec resolve thật bằng `git ls-files --modified --others --exclude-standard`, `-A`/`-u` tính mọi file đã sửa và untracked). File test: tên chứa `.test.`/`.spec.`/`_test.`/bắt đầu `test_`, hoặc nằm trong `tests/`/`test/`/`__tests__/`.
- **An toàn**: chỉ nhắc, không deny/ask; không phải commit fix, không trích được message (editor, `-F`), thiếu `jq`/`git`, không ở repo git, hoặc không vào được thư mục `cd`/`-C` → im lặng; luôn `exit 0`. Im lặng khi không vào được thư mục là cố ý: hook chỉ cố vấn, không phải guard bảo vệ.
- **Phụ thuộc**: cần `jq`, `git`.

## secret-scan — chặn hỏi xác nhận khi nghi ngờ lộ secret

Trước mỗi lần `git add`/`git commit`, hook này quét path sắp add (thư mục, glob, `.`, `-A`/`-u` được liệt kê thành file qua `git ls-files`) hoặc diff sắp commit (staged; thêm thay đổi tracked khi `commit -a`/pathspec) để tìm pattern giống secret (private key, AWS key, `api_key=...`, gán `*_KEY/*TOKEN/*SECRET/*PASSWORD=` không nháy, token `ghp_`/`github_pat_`/`xox?-`/`sk_live_`/`AIza`/JWT) và tên file `.env` — liên hệ [`rules/backend.md`](../rules/backend.md#an-toàn-dữ-liệu).

- **Script**: [`scripts/secret-scan.sh`](./scripts/secret-scan.sh)
- **Loại hook**: `PreToolUse`, matcher `Bash`
- **Nhận diện lệnh**: như `commit-msg-guard` (helper [`_shell-command.sh`](./scripts/_shell-command.sh)); `git -C <dir>` chạy git trong `<dir>`. Không vào được `<dir>` thì guard hỏi (ask) kèm lý do thay vì bỏ qua.
- **Hành vi khi phát hiện**: `permissionDecision: "ask"` (không `"deny"`) — heuristic regex có thể false positive, nên hỏi lại người dùng thay vì chặn cứng.
- **Phụ thuộc**: cần `jq`.

## protected-branch-guard — cảnh báo trước khi push rủi ro cao

Trước mỗi lần `git push`, hook này cảnh báo (ask) nếu push thẳng vào `main`/`master` (đích refspec như `HEAD:main`, `x:refs/heads/main`; không có refspec thì theo nhánh hiện tại), xoá `main`/`master` (`:main`, `--delete`/`-d`), `--mirror`/`--all`, refspec glob/`:`, dùng `--force`/`--force-with-lease`/refspec `+`, hoặc `--no-verify`/`--no-gpg-sign` — lớp phòng vệ thứ hai cho Git Safety Protocol.

- **Script**: [`scripts/protected-branch-guard.sh`](./scripts/protected-branch-guard.sh)
- **Loại hook**: `PreToolUse`, matcher `Bash`
- **Nhận diện lệnh**: như `commit-msg-guard` (helper [`_shell-command.sh`](./scripts/_shell-command.sh)); `git -C <dir>` chạy git trong `<dir>`. Không vào được `<dir>` thì guard hỏi (ask) kèm lý do thay vì bỏ qua.
- **Hành vi khi phát hiện**: `permissionDecision: "ask"` — có tình huống hợp lệ cần push thẳng main/force push mà người dùng đã đồng ý, nên hỏi lại chứ không chặn cứng.
- **Phụ thuộc**: cần `jq`, `git`.

## format-before-push — format lại trước khi push

Trước mỗi lần `git push`, hook này chạy `prettier --write` **một lần** trên các file đã thay đổi so với remote tracking branch (`@{upstream}...HEAD`) — lượt quét cuối trước khi đẩy lên, bổ sung cho `format-on-edit` (chỉ format đúng file vừa Edit/Write, không quét lại toàn bộ diff). Liên hệ skill [`git-workflow`](../skills/git-workflow/SKILL.md) mục "Trước khi git push" và [`rules/delivery.md`](../rules/delivery.md#chất-lượng-và-bằng-chứng).

- **Script**: [`scripts/format-before-push.sh`](./scripts/format-before-push.sh)
- **Loại hook**: `PreToolUse`, matcher `Bash`
- **Nhận diện lệnh**: như `commit-msg-guard` (helper [`_shell-command.sh`](./scripts/_shell-command.sh)); `git -C <dir>` chạy git trong `<dir>`. Không vào được `<dir>` thì bỏ qua êm, vì đây chỉ là bước format cố vấn, không phải guard.
- **Không tự commit**: chỉ `prettier --write` lên working tree. Format sinh ra thay đổi → `permissionDecision: "ask"` cảnh báo các file đó CHƯA được commit (push hiện tại vẫn đẩy bản cũ) — người dùng tự quyết commit thêm hay bỏ qua, không tự ý commit giùm.
- **An toàn**: luôn `exit 0` khi không cần cảnh báo; thiếu `jq`/`git`, không phải lệnh `git push`, không có remote tracking branch, thiếu Prettier, hoặc diff không có file nào cần format → bỏ qua êm.
- **Phụ thuộc**: cần `jq`, `git`; Prettier (tuỳ chọn — thiếu thì bỏ qua, giống `format-on-edit`).

## lint-on-edit — static analysis sau khi Edit/Write

Sau mỗi lần Edit/Write, hook này chạy linter/type-checker tương ứng loại file (`tsc` cho `.ts/.tsx`, `eslint` cho `.js/.jsx`, `ruff`/`flake8` cho `.py`, `phpstan` cho `.php`) và trả lỗi lại cho Claude qua `additionalContext` — liên hệ [`rules/delivery.md`](../rules/delivery.md#chất-lượng-và-bằng-chứng). Thuần cố vấn, không block vì tool đã chạy xong.

- **Script**: [`scripts/lint-on-edit.sh`](./scripts/lint-on-edit.sh)
- **Loại hook**: `PostToolUse`, matcher `Edit|Write`
- **An toàn**: không có linter tương ứng, file không thuộc loại hỗ trợ, hoặc output chỉ có tóm tắt 0 lỗi (`Found 0 errors`, `no errors`, `0 problems`...) → bỏ qua êm.
- **Phụ thuộc**: cần `jq`; linter tương ứng ngôn ngữ (tuỳ chọn, thiếu thì bỏ qua).

## test-reminder — chạy test tương ứng hoặc nhắc viết test sau khi sửa file nguồn

Sau mỗi lần Edit/Write một file nguồn, hook này tìm file test tương ứng theo convention đặt tên phổ biến (`foo.test.ts`, `foo.spec.ts`, `__tests__/foo.test.ts`, `test_foo.py`, `foo_test.py`, `tests/test_foo.py`) rồi báo qua `additionalContext` — liên hệ [`rules/delivery.md`](../rules/delivery.md#chất-lượng-và-bằng-chứng):

- **Có test**: tự chạy test đó và báo kết quả (regression test ngay sau khi sửa).
- **Chưa có test**: nhắc cân nhắc viết test bằng skill [`testing`](../skills/testing/references/unit-testing.md).

- **Script**: [`scripts/test-reminder.sh`](./scripts/test-reminder.sh) — một process mỗi Edit/Write, dùng chung logic tìm test cho cả hai nhánh.
- **Loại hook**: `PostToolUse`, matcher `Edit|Write`
- **Phạm vi**: chỉ JS/TS (`jest`/`vitest`) và Python (`pytest`) — hai stack phổ biến nhất, không cố cover mọi ngôn ngữ (xem [`rules/coding.md`](../rules/coding.md#kiss-yagni-và-phạm-vi)). Bỏ qua file test. Nhánh nhắc còn bỏ qua file trong `node_modules/vendor/dist/build/migrations/__tests__/tests`, `*.d.ts` và file config/entry point (`index.*`, `main.*`, `config.*`, `settings.*`).
- **An toàn**: thiếu test runner hoặc test không in gì → bỏ qua êm; nhánh nhắc chỉ advisory, không chặn gì; luôn `exit 0`.
- **Phụ thuộc**: cần `jq`; test runner tương ứng (tuỳ chọn).

## dependency-audit-reminder — tự audit dependency sau khi cài

Sau lệnh cài/thêm dependency (`npm install`, `yarn add`, `pnpm add`, `composer require`, `pip install`...) qua Bash, hook chạy lệnh audit **read-only** của chính package manager (`npm audit`, `composer audit`, `pip-audit`...) và báo kết quả qua `additionalContext`, trỏ tới skill [`dependency-audit`](../skills/dependency-audit/SKILL.md). Audit tự do, không tự upgrade.

- **Script**: [`scripts/dependency-audit-reminder.sh`](./scripts/dependency-audit-reminder.sh)
- **Loại hook**: `PostToolUse`, matcher `Bash`
- **Nhận diện lệnh**: helper [`_shell-command.sh`](./scripts/_shell-command.sh) (`command_invocations`) — chỉ nhận package manager là lệnh thực thi thật (`npm install|i|add`, `yarn add|install`, `pnpm add|install|i`, `composer require|update`, `pip|pip3 install`, `python -m pip install`); chữ trong heredoc, chuỗi, commit message, `echo`/`grep` bị bỏ qua. Lệnh cài đầu tiên quyết định audit; audit chạy ở cwd của hook.
- **Chỉ chạy lệnh audit** (không `--fix`/`--force`, không tự install/update gì thêm); bỏ qua êm nếu tool báo không có lỗ hổng.
- **An toàn**: luôn `exit 0`; thiếu `jq`, không khớp lệnh cài dependency nào, hoặc thiếu audit tool tương ứng → bỏ qua êm.
- **Phụ thuộc**: cần `jq`; audit tool tương ứng ecosystem (tuỳ chọn, thiếu thì bỏ qua).

## ci-workflow-lint — lint file workflow CI sau khi sửa

Sau mỗi lần Edit/Write một file workflow CI (`.github/workflows/*.yml`, `.gitlab-ci.yml`, `azure-pipelines.yml`), hook này chạy linter YAML tương ứng (`actionlint` cho GitHub Actions, `yamllint` fallback) và báo lỗi lại qua `additionalContext`, trỏ tới skill [`ci-pipeline`](../skills/ci-pipeline/SKILL.md) — liên hệ [`rules/delivery.md`](../rules/delivery.md#chất-lượng-và-bằng-chứng). Thuần cố vấn, không block.

- **Script**: [`scripts/ci-workflow-lint.sh`](./scripts/ci-workflow-lint.sh)
- **Loại hook**: `PostToolUse`, matcher `Edit|Write`
- **An toàn**: file không phải workflow CI, hoặc thiếu `actionlint`/`yamllint` → bỏ qua êm.
- **Phụ thuộc**: cần `jq`; `actionlint` hoặc `yamllint` (tuỳ chọn, thiếu thì bỏ qua).

## remind-cleanup — nhắc dọn file tạm khi context gần đầy

Khi kết thúc một turn mà context đã dùng **≥ 80%**, hook liệt kê file `Write` trong session (từ `logs.jsonl`, lọc `session_id`, trong dự án, còn trên đĩa) có tên tạm (bắt đầu `tmp`/`scratch`/`debug`/`draft`/`sandbox`/`test-output`, hoặc đuôi `.tmp`/`.bak`/`.orig`), trừ thư mục cấu hình/tài liệu (`.agents/rules/`, `.agents/skills/`, `.agents/agents/`, `.claude/`, `.codex/`, `docs/`). Có thì nhắc qua `additionalContext` kèm % context (vd `Context đã dùng 82% (164k/200k)`) để Claude tự quyết dùng skill [`cleanup-temp-files`](../skills/cleanup-temp-files/SKILL.md). Mỗi file chỉ nhắc một lần mỗi session (state ở `.agents/storage/state/<session_id>.cleanup-reminded`).

- **Script**: [`scripts/remind-cleanup.sh`](./scripts/remind-cleanup.sh) — gọi `skills/cleanup-temp-files/scripts/find-session-scratch-files.sh`
- **Đo context**: [`scripts/remind-cleanup-context.mjs`](./scripts/remind-cleanup-context.mjs) đọc `transcript_path`; context đang dùng là `message.usage` của message assistant cuối có usage: `input_tokens + cache_read_input_tokens + cache_creation_input_tokens`; bỏ qua dòng JSON lỗi. Giới hạn: `CLAUDE_CONTEXT_LIMIT` nếu là số nguyên dương; không thì suy từ transcript (có message vượt 200000 → 1000000, ngược lại 200000); ngưỡng cố định 80%.
- **Loại hook**: `Stop`
- **Chỉ nhắc, không tự xóa**: dùng `hookSpecificOutput.additionalContext`, không dùng `decision`/`reason` (sẽ chặn Claude dừng lại).
- **An toàn**: luôn `exit 0`; dưới ngưỡng, thiếu transcript/không đọc được usage, không có ứng viên, thiếu `jq`/`node`, hoặc thiếu script tìm file thì im lặng, không báo gì.
- **Phụ thuộc**: cần `jq` và `node`; dựa vào log của hook `audit-log` nên phải bật hook đó cùng lúc.

## report-reminder — nhắc dùng skill `report` nếu chưa báo cáo thay đổi

Khi kết thúc một turn, hook tìm trong `logs.jsonl` (và file xoay mới nhất) các `Edit`/`Write` của phiên chính, trong dự án, xảy ra **sau** lần gọi skill `report` gần nhất (hoặc từ đầu session) — có thì nhắc qua `additionalContext`. Bỏ entry có `agent_id` (subagent do phiên chính gộp vào báo cáo tổng). Enforce [`rules/delivery.md`](../rules/delivery.md#báo-cáo-bắt-buộc).

- **Script**: [`scripts/report-reminder.sh`](./scripts/report-reminder.sh)
- **Loại hook**: `Stop`
- **Chỉ nhắc, không tự gọi skill giùm**: dùng `hookSpecificOutput.additionalContext`, không dùng `decision`/`reason` (sẽ chặn Claude dừng lại).
- **An toàn**: luôn `exit 0`; không có Edit/Write nào chưa báo cáo, thiếu `jq`, hoặc thiếu log thì im lặng, không báo gì.
- **Phụ thuộc**: cần `jq`; dựa vào log của hook `audit-log` (field `input.skill`, `agent_id`) nên phải bật hook đó cùng lúc.
- **Token và lãng phí**: do hook [`report-usage`](#report-usage--token-thật-và-issue-lãng-phí-khi-gọi-skill-report) cung cấp, không còn nằm ở hook này.

## report-usage — token thật và issue lãng phí khi gọi skill `report`

Khi skill `report` được gọi, hook đọc `transcript_path` bằng [`task-usage.mjs`](../skills/report/scripts/task-usage.mjs) và đưa vào context số token thật (input, output, cache đọc, cache tạo) cùng các vi phạm tiêu chí lãng phí kèm bằng chứng, để báo cáo luôn ghi `Token:` và chỉ ghi `Issue lãng phí:` khi có vi phạm (không vi phạm thì hook không in dòng `Issue lãng phí:`).

- **Script**: [`scripts/report-usage.sh`](./scripts/report-usage.sh)
- **Loại hook**: `PostToolUse`, matcher `Skill`; chỉ xử lý skill `report` (không phải `workflow-report`).
- **Ngưỡng**: [`waste-criteria.json`](../skills/report/assets/waste-criteria.json) — mặc định đọc lại cùng file ≥ 3 lần, lặp cùng lệnh ≥ 3 lần, một kết quả tool > 20.000 ký tự, ≥ 3 lần gọi subagent, cache tạo mới > cache đọc khi ≥ 50.000 token.
- **Cửa sổ đo**: từ lần gọi `report` trước (mốc lưu ở `.agents/storage/state/<session_id>.json`); lần đầu là cả phiên.
- **Định dạng**: `📈 Token: input 18 | output 4.4k | cache đọc 912k | cache tạo 13.4k | tổng 930k (từ mốc trước).` — `tổng` = input + output + cache đọc + cache tạo; số rút gọn bằng [`compact-number.mjs`](./scripts/compact-number.mjs) (< 1000 giữ nguyên; k/M, dưới 100 giữ 1 chữ số thập phân, từ 100 làm tròn); nhãn `cả phiên` hoặc `từ mốc trước`. `<session_id>.emitted.json` lưu số thô kèm `total`.
- **An toàn**: luôn `exit 0`, không chặn; thiếu `jq`/`node`/script hoặc không đọc được transcript thì im lặng, không ghi N/A hay ước lượng.
- **Phạm vi**: chỉ Claude Code (Codex không có hook này nên bỏ hai dòng đó khỏi báo cáo).
- **Độ trễ**: transcript lúc hook chạy chưa gồm các message của lượt hiện tại nên số liệu tính đến lúc gọi skill; lượt đầu của phiên headless im lặng. Đo trên phiên tương tác dài: lệch so với số cuối lượt khoảng 0,7–2,6%.

## report-usage-check — đối chiếu dòng Token trong báo cáo với số hook đã chèn

Chặn việc điền số Token không có nguồn: hook `report-usage` ghi số đã chèn vào `.agents/storage/state/<session_id>.emitted.json`, hook này so dòng `Token:` trong tin nhắn cuối với số đó.

- **Script**: [`scripts/report-usage-check.sh`](./scripts/report-usage-check.sh) (logic ở [`report-usage-check.mjs`](./scripts/report-usage-check.mjs))
- **Loại hook**: `Stop`; đọc `last_assistant_message` của payload, không có thì lấy tin nhắn cuối từ transcript.
- **Cách so**: tách 4 số sau `input`, `output`, `cache đọc`, `cache tạo`; chấp nhận số thô hoặc số rút gọn `4.4k`/`1.2M` bằng đúng chuỗi [`compact-number.mjs`](./scripts/compact-number.mjs) tạo từ số hook; `tổng` tuỳ chọn, có thì phải khớp `total`. Lệch hoặc chưa có số hook thì cảnh báo một lần mỗi kiểu lệch (`<session_id>.checked`) qua `additionalContext`, không chặn.
- **Im lặng khi**: không có dòng Token, số khớp, `stop_hook_active` là true, thiếu `node`/`jq` hoặc không parse được.
- **Giới hạn**: giả định lời văn của template (`input … output … cache đọc … cache tạo …`); viết khác thì hook im lặng, không báo sai.

## turn-log — một dòng tóm tắt mỗi lượt

Khi Claude Code kết thúc một lượt, hook đọc `transcript_path` và ghi **một** dòng `type: "turn"` vào `.agents/storage/logs/logs.jsonl` (cùng file `audit-log`, xoay vòng bằng cùng helper [`_log-rotate.sh`](./scripts/_log-rotate.sh) — `turn-log.mjs` `stat` file trước và chỉ chạy `bash _log-rotate.sh <log_dir>` khi đã chạm `LUMINA_LOG_MAX_BYTES`; các dòng từng tool call giữ nguyên):

```json
{"ts":"2026-10-22T03:00:00Z","type":"turn","session_id":"…","request":"Sửa hook Stop","tools":{"Bash":2,"Edit":2,"Write":1,"Agent":1},"files":["/repo/a.js","/repo/b.js"],"tokens":{"input":17,"output":31,"cacheRead":413,"cacheCreate":49,"total":510},"subagentTokens":{"input":4,"output":9,"cacheRead":300,"cacheCreate":10,"total":323}}
```

- **Script**: [`scripts/turn-log.sh`](./scripts/turn-log.sh) (logic ở [`turn-log.mjs`](./scripts/turn-log.mjs); đo token bằng `measure` của [`task-usage.mjs`](../skills/report/scripts/task-usage.mjs))
- **Loại hook**: `Stop`; không in gì ra stdout, không chặn.
- **Lượt hiện tại**: các dòng sau prompt thật cuối cùng của người dùng — `type: "user"` của phiên chính, không `isMeta`/`isCompactSummary`, `origin.kind` là `human` (hoặc không có), không chứa `tool_result`, không bắt đầu bằng `<task-notification>`, `<local-command-`, `<command-name>`, `<bash-input>`/`<bash-stdout>`/`<bash-stderr>` hoặc `[Request interrupted by user`.
- **Field**: `request` (prompt gộp khoảng trắng, che secret rõ ràng, cắt 200 ký tự; slash command ghi `/<lệnh> <đối số>`), `tools` (số lần gọi theo tên tool, khử trùng theo `tool_use` id), `files` (`file_path`/`notebook_path` của `Edit`/`Write`/`NotebookEdit`, duy nhất), `tokens` (tổng `message.usage` của phiên chính trong lượt, `total` = input + output + cacheRead + cacheCreate). Không ghi nội dung file hay output tool.
- **Subagent**: `subagentTokens` (cùng dạng `tokens`) cộng từ transcript riêng `<transcript>/subagents/agent-<agentId>.jsonl` của các subagent đã xong trong lượt (không dùng `totalTokens` trên tool result vì đó chỉ là context của request cuối). Subagent nền còn chạy lúc Stop đếm vào `subagentsPending`, không cộng token. Thiếu dữ liệu thì bỏ field.
- **Chống trùng**: lưu dòng/uuid prompt đầu lượt đã ghi ở `.agents/storage/state/<session_id>.turn.json`; Stop chạy lại cho cùng lượt (kể cả `stop_hook_active`) thì bỏ qua.
- **An toàn**: luôn `exit 0`; thiếu `node`, `task-usage.mjs`, transcript, prompt hoặc payload hỏng thì im lặng, không ghi gì. Thư mục log lấy từ `CLAUDE_PROJECT_DIR`, fallback `cwd` trong payload rồi thư mục hiện tại.
- **Giới hạn**: lượt tiếp tục sau Stop mà không có prompt mới (ví dụ phản hồi `<task-notification>`) không ghi thêm dòng; Edit/Write và tool của subagent không tính vào `tools`/`files`; subagent nền xong ở lượt sau và subagent lồng không được cộng. Nhận diện prompt dựa trên hình dạng transcript hiện tại của Claude Code.
- **Lọc log**: `jq -c 'select(.type == "turn")' .agents/storage/logs/logs.jsonl`

## notify-done — phát âm thanh khi làm xong task

Khi Claude Code kết thúc một turn (trả lời xong, không còn việc gì đang chạy), hook này phát một âm thanh thông báo ngắn để biết task đã xong mà không cần nhìn màn hình liên tục.

- **Script**: [`scripts/notify-done.sh`](./scripts/notify-done.sh)
- **Loại hook**: `Stop` (không cần `matcher` — hook này không gắn với tool cụ thể)
- **Âm thanh theo hệ điều hành**: `afplay` (macOS, dùng `Glass.aiff`) → `paplay`/`aplay` (Linux) → `powershell.exe [console]::beep` (Windows/WSL). Không có công cụ nào khả dụng thì bỏ qua êm.
- **An toàn**: luôn `exit 0`, chạy ngầm (`&`) nên không làm chậm việc Claude Code dừng lại.

## condense-planner-input — lưới an toàn chặn prompt quá dài khi gọi planner

Trước mỗi lần gọi Agent tool với `subagent_type: planner`, hook cắt gọn `prompt` nếu quá dài (vd dán nguyên tài liệu `architect`): giữ phần đầu + cuối, cắt phần giữa. **Chỉ là lưới an toàn cuối**; việc chọn đúng phần liên quan là trách nhiệm của bước gọi `planner` (xem [`workflow-plan`](../skills/workflow-plan/SKILL.md)).

- **Script**: [`scripts/condense-planner-input.sh`](./scripts/condense-planner-input.sh)
- **Loại hook**: `PreToolUse`, matcher `Agent`
- **Cơ chế**: dùng `hookSpecificOutput.updatedInput` để thay `tool_input.prompt` trước khi tool chạy — giữ nguyên các field khác (`subagent_type`, `description`...).
- **Ngưỡng**: cắt khi `prompt` > 20000 ký tự, giữ 13000 ký tự đầu + 6000 ký tự cuối, chèn dòng đánh dấu phần đã cắt.
- **An toàn**: `prompt` dưới ngưỡng, không phải tool `Agent`, không phải `subagent_type: planner`, hoặc thiếu `jq` → không sửa gì.
- **Phụ thuộc**: cần `jq`.

## agent-role-reminder — báo tên agent đang gọi + nhắc khi có vẻ over-delegate

Mỗi lần gọi Agent tool, hook này luôn báo rõ tên `subagent_type` đang được dùng. Riêng với các vai trò "nặng" (`analyst`, `planner`, `architect`, `reviewer`, `qa-tester`, `researcher`) kèm `prompt` quá ngắn — tín hiệu cơ học cho khả năng đang over-delegate một task nhỏ — hook chuyển sang hỏi xác nhận thay vì chỉ báo tin. Liên hệ [Execution discipline](../../AGENTS.md#execution-discipline)/[Agent coordination](../../AGENTS.md#agent-coordination).

- **Script**: [`scripts/agent-role-reminder.sh`](./scripts/agent-role-reminder.sh)
- **Loại hook**: `PreToolUse`, matcher `Agent`
- **Cơ chế**: `permissionDecision: "allow"` + `permissionDecisionReason` báo tên agent (không chặn) cho mọi lần gọi; đổi sang `"ask"` khi `subagent_type` thuộc nhóm "nặng" **và** `prompt` < 150 ký tự — người dùng xác nhận tiếp tục hay không.
- **Giới hạn**: chỉ xét độ dài `prompt`, không hiểu ngữ nghĩa task — task nhỏ về chữ nhưng thật sự cần vai trò đó (ví dụ review 1 file rủi ro cao) vẫn bị hỏi, xác nhận để tiếp tục là bình thường.
- **An toàn**: thiếu `jq` hoặc không phải tool `Agent` → không làm gì.
- **Phụ thuộc**: cần `jq`.

## ensure-final-newline — newline cuối file text

- **Script**: [`scripts/ensure-final-newline.mjs`](./scripts/ensure-final-newline.mjs), không cần Prettier hoặc package mới.
- **Trigger condition**: Claude `PostToolUse`, matcher `Edit|Write`; chỉ thêm newline thiếu vào file text vừa sửa trong project, giữ LF/CRLF và nội dung hiện có. Không sửa binary, symlink, file rỗng hoặc file ngoài project.
- **Kiểm tra**: `node .agents/hooks/scripts/ensure-final-newline.mjs --check <file...>`; lỗi thiếu newline trả exit 1, không sửa file. `--write <file...>` sửa các path chỉ định; không quét/sửa toàn repo.
- **Các runtime khác**: Codex/Antigravity chạy checker theo quality-assurance; hook Claude không tự chạy ở đó. `.editorconfig` bật `insert_final_newline` cho editor hỗ trợ.
- **Giới hạn**: check danh sách file trong task; không cam kết file chưa kiểm tra đã đạt. Fixture cố ý thiếu newline phải loại khỏi danh sách với lý do.

## copy-browser-screenshot — đưa ảnh chụp trình duyệt từ thư mục tạm vào project

Tool Claude in Chrome lưu ảnh chụp ở thư mục tạm hệ thống mà OS có thể dọn. Hook lấy project từ `cwd` của payload (Git root nếu có) rồi copy ảnh vào project. `LUMINA_TASK_SLUG` hợp lệ → `.agents/storage/evidence/<task-slug>/`; không thì `.agents/storage/evidence/browser/<yyyyMMdd>/` (staging inbox), phải chuyển vào thư mục task trước khi dẫn trong báo cáo — liên hệ [`rules/frontend.md`](../rules/frontend.md).

- **Script**: [`scripts/copy-browser-screenshot.sh`](./scripts/copy-browser-screenshot.sh)
- **Loại hook**: `PostToolUse`, matcher `mcp__claude-in-chrome__.*`
- **Nhận diện ảnh**: quét mọi chuỗi trong `tool_response` theo regex file `.png`/`.jpg`/`.jpeg`/`.webp` (không phụ thuộc tên field); chỉ nhận file thường (bỏ symlink) có thư mục thật nằm dưới `$TMPDIR`, `/tmp`, `/private/tmp`, `/var/folders`, `/private/var/folders` và không nằm sẵn trong project.
- **Copy, không move**: giữ tên file; trùng tên thì thêm hậu tố `-1`, `-2`..., không ghi đè.
- **Project đang hoạt động**: ưu tiên `cwd` hợp lệ trong payload và resolve Git root; chỉ fallback `CLAUDE_PROJECT_DIR`, rồi thư mục chạy hook, khi payload không có `cwd` hợp lệ. Vì vậy session mở từ repo khác không kéo ảnh ra khỏi repo của thao tác hiện tại.
- **Task slug tùy chọn**: đặt `LUMINA_TASK_SLUG` theo mẫu `^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$` để copy thẳng vào thư mục task. Giá trị thiếu hoặc không hợp lệ không được dùng làm path; ảnh giữ ở staging inbox và `additionalContext` nhắc chuyển ảnh trước khi báo cáo.
- **An toàn**: luôn `exit 0`, không chặn tool; thiếu `jq`, không có ảnh hợp lệ hoặc copy lỗi thì im lặng.
- **Phụ thuộc**: cần `jq`. Chỉ Claude Code (Codex không có tool này).
- **Giới hạn**: chưa kiểm với `tool_response` thật của Chrome; ảnh chỉ trả về dạng base64 (không có đường dẫn file) thì không copy được.

## write-path-guard — chặn ghi secret và plan ngoài repo

Trước mỗi `Write`/`Edit`, hook `deny` khi ghi file `.env`/`.env.*` (trừ `.env.example|sample|template|dist`) hoặc nội dung chứa header private key — enforce [CONTRACT](../../CONTRACT.md) #6; và khi đường dẫn nằm ngoài project mà khớp `*/.claude/plans/*`, `*/.codex/*`, `*/.gemini/*` hoặc `*/plans/*` (plan chỉ lưu ở `docs/plans/`, xem [`rules/docs`](../rules/docs.md#implementation-plan-contract)).

- **Script**: [`scripts/write-path-guard.sh`](./scripts/write-path-guard.sh) (dùng helper [`_resolve-path.sh`](./scripts/_resolve-path.sh))
- **Loại hook**: `PreToolUse`, matcher `Write|Edit`
- **Chuẩn hoá path**: mở `~`, gộp `.`/`..`, realpath thư mục tổ tiên gần nhất còn tồn tại (đi qua symlink). Đường dẫn trong project luôn qua bước kiểm path ngoài project; memory (`~/.claude/projects/*/memory/`), backup, scratchpad, evidence vẫn ghi được.
- **An toàn**: thông báo không in nội dung ghi; thiếu `jq` hoặc không chuẩn hoá được path → không chặn.
- **Giới hạn**: chỉ xét `content`/`new_string`; `..` được gộp theo chữ trước khi resolve symlink; Bash ghi file (`echo > .env`) không bị chặn.

## main-session-code-guard — phiên chính sửa code thì hỏi

`ask` khi payload không có `agent_id` (phiên chính; subagent có field này — xem `audit-log`) mà file là code. Không hỏi với config/docs (`*.md|json|toml|yml|yaml`, mọi path dưới `.agents/ .claude/ .codex/ docs/ .github/`) và file ngoài project — [CONTRACT](../../CONTRACT.md) #3.

- **Script**: [`scripts/main-session-code-guard.sh`](./scripts/main-session-code-guard.sh)
- **Loại hook**: `PreToolUse`, matcher `Edit|Write`
- **Giới hạn**: file không đuôi/dotfile (`.gitignore`...) tính là code nên bị hỏi; thiếu `jq` → không hỏi.

## db-write-guard — hỏi trước lệnh ghi database

`ask` (không `deny`) khi lệnh Bash thực thi SQL ghi qua `psql|mysql|mariadb|sqlite3|mongosh|redis-cli` (INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE/CREATE/FLUSHALL/FLUSHDB, kể cả SQL trong heredoc) hoặc migrate/seed (`artisan migrate|db:seed`, `prisma migrate|db push|db seed`, `rails db:migrate|db:seed`, `knex migrate|seed`, `alembic upgrade`, `sequelize db:migrate|db:seed`, `typeorm migration:run`) — [CONTRACT](../../CONTRACT.md) #2.

- **Script**: [`scripts/db-write-guard.sh`](./scripts/db-write-guard.sh), tách lệnh bằng `command_invocations` của [`_shell-command.sh`](./scripts/_shell-command.sh)
- **Loại hook**: `PreToolUse`, matcher `Bash`
- **Giới hạn**: không đọc file `psql -f x.sql`, `npm run migrate`, alias/script; không phân biệt DB thật với sandbox.

## deps-check — cảnh báo thiếu jq/node

Khi bắt đầu phiên, nếu thiếu `jq` hoặc `node` trong `PATH`, hook in `additionalContext` báo các guard bị vô hiệu (chúng fail-open); đủ cả hai thì im lặng.

- **Script**: [`scripts/deps-check.sh`](./scripts/deps-check.sh)
- **Loại hook**: `SessionStart`
- **An toàn**: luôn `exit 0`; dựng JSON bằng `printf` vì `jq` có thể chính là thứ thiếu.

## Quyền hỏi cho commit/push

`.claude/settings.json` có `permissions.ask` = `Bash(git commit:*)`, `Bash(git push:*)`: Claude Code luôn hỏi người dùng trước `git commit`/`git push` — [CONTRACT](../../CONTRACT.md) #1. Hook `commit-msg-guard`/`protected-branch-guard` vẫn chạy như cũ.

## Giới hạn chung (best-effort)

Mọi guard cần `jq`: thiếu `jq` thì fail-open (cho qua, `deps-check` chỉ cảnh báo). Các hook dò lệnh git (`commit-msg-guard`, `bugfix-test-reminder`, `secret-scan`, `protected-branch-guard`, `format-before-push`) phân tích tĩnh chuỗi lệnh Bash bằng [`scripts/_shell-command.sh`](./scripts/_shell-command.sh), không chạy shell thật. Các dạng sau vẫn không quét được:

- Alias git (`git ci`, alias trong `~/.gitconfig`) và hàm/alias shell bọc git.
- Script file gọi git (`bash deploy.sh`, `make release`, `npm run release`), hook git, chương trình khác tự gọi git.
- Lệnh dựng từ biến hoặc kết quả chạy (`$CMD push`, `cd "$dir"`, `git -C "$dir"` với dir động); subcommand động được kiểm như subcommand đang xét nhưng message/đối số động không đọc được.
- `$(...)` trong thân heredoc không nháy delimiter, `bash -s`/`sh < file`, `env -S`, `xargs sh -c` có script từ stdin; script con lồng sâu hơn 4 tầng.
- Hook chạy git ở cwd của phiên (hoặc thư mục `cd`/`-C` tĩnh), không theo `--git-dir`/`--work-tree`.

## _dedupe-guard — tránh hook chạy hai lần

Khi cài global, hook được đăng ký ở cả `~/.claude/settings.json` (đường dẫn tuyệt đối) và `.claude/settings.json` của project (`"$CLAUDE_PROJECT_DIR"`). Hai chuỗi lệnh khác nhau nên Claude Code chạy cả hai trên mỗi event, làm lặp log và kết quả.

- **File**: [`scripts/_dedupe-guard.sh`](./scripts/_dedupe-guard.sh), được `source` ở đầu mọi hook `.sh`; `ensure-final-newline.mjs` có đoạn kiểm tra tương đương ở chế độ hook.
- **Cơ chế**: bản chạy từ thư mục khác `<project>/.claude/hooks/scripts` thoát ngay (`exit 0`, không đọc stdin, không in gì) nếu project đã có cùng script; project khác không có script thì bản user-level chạy bình thường. So sánh bằng đường dẫn vật lý (`pwd -P`), nên đi qua symlink `.agents/hooks` vẫn tính là bản project.
- **Kiểm chứng**: một lần gọi skill ghi 2 dòng `audit-log` trước khi có guard, 1 dòng sau khi có guard (đo trên phiên Claude thật).
- Không đăng ký trong settings vì chỉ được `source`.

## Đã bật sẵn trong chính repo này

Thư mục thật là `.claude/hooks/`; `.agents/hooks` là symlink tới `../.claude/hooks`. `.claude/settings.json` gọi script qua `"$CLAUDE_PROJECT_DIR"/.agents/hooks/scripts/...` (chạy được khi cwd ngoài git repo), `.codex/hooks.json` qua `$(git rev-parse --show-toplevel)/.agents/hooks/scripts/...`. `settings.json` trỏ cả 25 hook tự viết (danh sách ở các mục trên); `.codex/hooks.json` trỏ 17, thiếu 8 hook chỉ dành cho Claude Code (`copy-browser-screenshot`, `report-usage`, `report-usage-check`, `turn-log`, `write-path-guard`, `main-session-code-guard`, `db-write-guard`, `deps-check`). Dùng ngay trong repo này. `rtk hook claude` gọi tool ngoài, chỉ chạy khi máy có [`rtk`](https://github.com/rtk-ai/rtk). Sang project khác: dùng installer `lumina-agent` hoặc merge key `hooks` của `.claude/settings.json`.
