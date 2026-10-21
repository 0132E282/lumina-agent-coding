# 🪝 Hooks

Hook phụ trợ cho các subagent trong [`agents/`](../agents) — tự động hóa các bước nên làm nhưng dễ bị bỏ quên.

## rtk — giảm token tiêu thụ cho lệnh Bash phổ biến

Trước mỗi lệnh `Bash`, hook này gọi CLI [`rtk`](https://github.com/rtk-ai/rtk) để viết lại các lệnh dev phổ biến (đọc file, grep, git...) sang dạng tiết kiệm token hơn — không phải script tự viết trong repo này.

- **Lệnh**: `rtk hook claude`
- **Loại hook**: `PreToolUse`, matcher `Bash`
- **Khác biệt với các hook còn lại**: đây là **tool bên ngoài**, không đi kèm framework — máy chưa cài `rtk` thì lệnh sẽ báo "command not found" ở mỗi lần chạy Bash (không chặn, chỉ ồn log). Cài theo [hướng dẫn chính thức](https://github.com/rtk-ai/rtk/blob/master/INSTALL.md), rồi chạy `rtk init -g` (hoặc `rtk init` trong 1 project) để đăng ký hook — khi copy project này sang máy khác, tự cân nhắc giữ hay bỏ dòng `rtk hook claude` trong `settings.json`/`settings.snippet.json` tuỳ máy đó có cài `rtk` hay không.
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
2. Merge nội dung [`settings.snippet.json`](./settings.snippet.json) vào `.claude/settings.json` của project đích (key `hooks`). Nếu project đã có `hooks` khác, gộp mảng thay vì ghi đè.
3. Đảm bảo project có Prettier (local `devDependencies` hoặc global) — nếu không có, hook sẽ không làm gì (không báo lỗi).

### Dùng formatter khác (Black, gofmt, dotnet format, PHP-CS-Fixer...)

`format-on-edit.sh` hiện chỉ xử lý các file Prettier hỗ trợ. Với project đa ngôn ngữ, thêm nhánh `case` tương ứng trong script, theo mẫu `automator.py` của `tester-agent` (tự phát hiện loại project rồi gọi đúng formatter).

## audit-log — ghi audit trail cho mọi tool call

Trước mỗi lần Claude Code (hoặc subagent) gọi **bất kỳ tool nào** (Edit, Write, Bash, Grep...), hook này ghi một dòng JSON vào log — phục vụ truy vết "ai/khi nào/làm gì", liên hệ [`rules/backend.md`](../rules/backend.md#an-toàn-dữ-liệu).

- **Script**: [`scripts/audit-log.sh`](./scripts/audit-log.sh)
- **Loại hook**: `PreToolUse`, matcher `.*` (mọi tool)
- **File log**: `.agents/storage/logs/logs.jsonl` (JSON Lines, append-only) — cả thư mục `.agents/storage/` đã nằm trong `.gitignore`, không commit nhầm.
- **Nội dung mỗi dòng**: `ts` (UTC ISO8601), `session_id`, `tool`, `cwd`, `input` (tóm tắt — chỉ `file_path`/`command` (≤200 ký tự)/`pattern`/`skill` (tên skill khi tool là `Skill`) tùy loại tool, **không** ghi nguyên nội dung file Write/Edit để tránh log phình to và rò rỉ dữ liệu nhạy cảm).
- **An toàn**: luôn `exit 0`; input JSON hỏng, thiếu `jq`, hoặc `tool_name` rỗng đều bị bỏ qua êm, không ghi dòng rác. Thư mục ghi log lấy từ `CLAUDE_PROJECT_DIR` (luôn là project root, bất kể agent đã `cd` sang thư mục con), fallback sang `cwd` trong payload rồi `pwd` nếu biến đó không có — tránh ghi log lạc vào thư mục con khi session đổi cwd. Field `cwd` trong mỗi dòng log vẫn giữ nguyên giá trị gốc từ payload để phục vụ truy vết.
- **Phụ thuộc**: cần `jq`.

### Xem log

```bash
# Theo dõi real-time, mỗi dòng in đẹp
tail -f .agents/storage/logs/logs.jsonl | jq .

# Đọc toàn bộ log hiện có dưới dạng 1 mảng JSON dễ đọc (ví dụ mở trong editor)
jq -s '.' .agents/storage/logs/logs.jsonl
```

## commit-msg-guard — chặn commit message sai format

Trước mỗi lần chạy `git commit` (qua tool Bash), hook này trích message sắp dùng và validate bằng chính script `validate-commit-message.sh` của skill `git-workflow`, chặn (deny) nếu sai Conventional Commits — enforce [`rules/git.md`](../rules/git.md) tự động, không phụ thuộc Claude tự giác.

- **Script**: [`scripts/commit-msg-guard.sh`](./scripts/commit-msg-guard.sh)
- **Loại hook**: `PreToolUse`, matcher `Bash`
- **Cách trích message**: ưu tiên heredoc (`git commit -m "$(cat <<'EOF' ... EOF)"` — cách Claude Code luôn dùng), fallback sang `-m "..."` đơn giản.
- **An toàn**: best-effort — không trích được message (commit mở editor, dùng `-F`, thiếu `jq`/validator) thì không chặn, để git tự xử lý.
- **Phụ thuộc**: cần `jq` và `skills/git-workflow/scripts/validate-commit-message.sh`.

## secret-scan — chặn hỏi xác nhận khi nghi ngờ lộ secret

Trước mỗi lần `git add`/`git commit`, hook này quét path sắp add hoặc diff đã staged để tìm pattern giống secret (private key, AWS key, `api_key=...`, file `.env`) — liên hệ [`rules/backend.md`](../rules/backend.md#an-toàn-dữ-liệu).

- **Script**: [`scripts/secret-scan.sh`](./scripts/secret-scan.sh)
- **Loại hook**: `PreToolUse`, matcher `Bash`
- **Hành vi khi phát hiện**: `permissionDecision: "ask"` (không `"deny"`) — heuristic regex có thể false positive, nên hỏi lại người dùng thay vì chặn cứng.
- **Phụ thuộc**: cần `jq`.

## protected-branch-guard — cảnh báo trước khi push rủi ro cao

Trước mỗi lần `git push`, hook này cảnh báo (ask) nếu push thẳng vào `main`/`master`, dùng `--force`/`--force-with-lease`, hoặc `--no-verify`/`--no-gpg-sign` — lớp phòng vệ thứ hai cho Git Safety Protocol.

- **Script**: [`scripts/protected-branch-guard.sh`](./scripts/protected-branch-guard.sh)
- **Loại hook**: `PreToolUse`, matcher `Bash`
- **Hành vi khi phát hiện**: `permissionDecision: "ask"` — có tình huống hợp lệ cần push thẳng main/force push mà người dùng đã đồng ý, nên hỏi lại chứ không chặn cứng.
- **Phụ thuộc**: cần `jq`, `git`.

## format-before-push — format lại trước khi push

Trước mỗi lần `git push`, hook này chạy `prettier --write` **một lần** trên các file đã thay đổi so với remote tracking branch (`@{upstream}...HEAD`) — lượt quét cuối trước khi đẩy lên, bổ sung cho `format-on-edit` (chỉ format đúng file vừa Edit/Write, không quét lại toàn bộ diff). Liên hệ skill [`git-workflow`](../skills/git-workflow/SKILL.md) mục "Trước khi git push" và [`rules/delivery.md`](../rules/delivery.md#chất-lượng-và-bằng-chứng).

- **Script**: [`scripts/format-before-push.sh`](./scripts/format-before-push.sh)
- **Loại hook**: `PreToolUse`, matcher `Bash`
- **Không tự commit**: chỉ `prettier --write` lên working tree. Format sinh ra thay đổi → `permissionDecision: "ask"` cảnh báo các file đó CHƯA được commit (push hiện tại vẫn đẩy bản cũ) — người dùng tự quyết commit thêm hay bỏ qua, không tự ý commit giùm.
- **An toàn**: luôn `exit 0` khi không cần cảnh báo; thiếu `jq`/`git`, không phải lệnh `git push`, không có remote tracking branch, thiếu Prettier, hoặc diff không có file nào cần format → bỏ qua êm.
- **Phụ thuộc**: cần `jq`, `git`; Prettier (tuỳ chọn — thiếu thì bỏ qua, giống `format-on-edit`).

## lint-on-edit — static analysis sau khi Edit/Write

Sau mỗi lần Edit/Write, hook này chạy linter/type-checker tương ứng loại file (`tsc` cho `.ts/.tsx`, `eslint` cho `.js/.jsx`, `ruff`/`flake8` cho `.py`, `phpstan` cho `.php`) và trả lỗi lại cho Claude qua `additionalContext` — liên hệ [`rules/delivery.md`](../rules/delivery.md#chất-lượng-và-bằng-chứng). Thuần cố vấn, không block vì tool đã chạy xong.

- **Script**: [`scripts/lint-on-edit.sh`](./scripts/lint-on-edit.sh)
- **Loại hook**: `PostToolUse`, matcher `Edit|Write`
- **An toàn**: không có linter tương ứng, hoặc file không thuộc loại hỗ trợ → bỏ qua êm.
- **Phụ thuộc**: cần `jq`; linter tương ứng ngôn ngữ (tuỳ chọn, thiếu thì bỏ qua).

## test-reminder — tự chạy test tương ứng sau khi sửa file nguồn

Sau mỗi lần Edit/Write một file nguồn, hook này tìm file test tương ứng theo convention đặt tên phổ biến (`foo.test.ts`, `foo.spec.ts`, `test_foo.py`, `foo_test.py`...) và tự chạy, báo kết quả qua `additionalContext` — liên hệ [`rules/delivery.md`](../rules/delivery.md#chất-lượng-và-bằng-chứng) (regression test ngay sau khi sửa).

- **Script**: [`scripts/test-reminder.sh`](./scripts/test-reminder.sh)
- **Loại hook**: `PostToolUse`, matcher `Edit|Write`
- **Phạm vi**: chỉ JS/TS (`jest`/`vitest`) và Python (`pytest`) — hai stack phổ biến nhất, không cố cover mọi ngôn ngữ (xem [`rules/coding.md`](../rules/coding.md#kiss-yagni-và-phạm-vi)).
- **An toàn**: không tìm thấy test tương ứng, hoặc thiếu test runner → bỏ qua êm.

## missing-test-reminder — nhắc viết test khi chưa có test tương ứng

Sau mỗi lần Edit/Write một file nguồn (JS/TS, Python), nếu **không** tìm thấy file test tương ứng theo convention đặt tên (ngược lại với `test-reminder` — hook đó xử lý trường hợp **có** tìm thấy), hook này nhắc cân nhắc viết test qua `additionalContext`, trỏ tới skill [`testing`](../skills/testing/references/unit-testing.md) — liên hệ [`rules/delivery.md`](../rules/delivery.md#chất-lượng-và-bằng-chứng).

- **Script**: [`scripts/missing-test-reminder.sh`](./scripts/missing-test-reminder.sh)
- **Loại hook**: `PostToolUse`, matcher `Edit|Write`
- **Phạm vi**: cùng JS/TS và Python như `test-reminder`; bỏ qua file trong `node_modules/vendor/dist/build/migrations/tests`, file test, và file config/entry point (`index.*`, `main.*`, `config.*`, `settings.*`) — không mang business logic cần test riêng.
- **An toàn**: chỉ nhắc (advisory) qua `additionalContext`, không chặn gì; luôn `exit 0`.
- **Phụ thuộc**: cần `jq`.

## dependency-audit-reminder — tự audit dependency sau khi cài

Sau mỗi lần chạy lệnh cài/thêm dependency (`npm install`, `yarn add`, `pnpm add`, `composer require`, `pip install`...) qua tool Bash, hook này tự chạy lệnh audit **read-only** tương ứng của chính package manager (`npm audit`, `composer audit`, `pip-audit`...) và báo kết quả lại cho Claude qua `additionalContext`, trỏ tới skill [`dependency-audit`](../skills/dependency-audit/SKILL.md) — liên hệ [`rules/backend.md`](../rules/backend.md#database-read-only-mặc-định) (tinh thần tương tự áp cho package manager: audit tự do, không tự upgrade).

- **Script**: [`scripts/dependency-audit-reminder.sh`](./scripts/dependency-audit-reminder.sh)
- **Loại hook**: `PostToolUse`, matcher `Bash`
- **Chỉ chạy lệnh audit** (không `--fix`/`--force`, không tự install/update gì thêm); bỏ qua êm nếu tool báo không có lỗ hổng.
- **An toàn**: luôn `exit 0`; thiếu `jq`, không khớp lệnh cài dependency nào, hoặc thiếu audit tool tương ứng → bỏ qua êm.
- **Phụ thuộc**: cần `jq`; audit tool tương ứng ecosystem (tuỳ chọn, thiếu thì bỏ qua).

## ci-workflow-lint — lint file workflow CI sau khi sửa

Sau mỗi lần Edit/Write một file workflow CI (`.github/workflows/*.yml`, `.gitlab-ci.yml`, `azure-pipelines.yml`), hook này chạy linter YAML tương ứng (`actionlint` cho GitHub Actions, `yamllint` fallback) và báo lỗi lại qua `additionalContext`, trỏ tới skill [`ci-pipeline`](../skills/ci-pipeline/SKILL.md) — liên hệ [`rules/delivery.md`](../rules/delivery.md#chất-lượng-và-bằng-chứng). Thuần cố vấn, không block.

- **Script**: [`scripts/ci-workflow-lint.sh`](./scripts/ci-workflow-lint.sh)
- **Loại hook**: `PostToolUse`, matcher `Edit|Write`
- **An toàn**: file không phải workflow CI, hoặc thiếu `actionlint`/`yamllint` → bỏ qua êm.
- **Phụ thuộc**: cần `jq`; `actionlint` hoặc `yamllint` (tuỳ chọn, thiếu thì bỏ qua).

## remind-cleanup — nhắc dọn file tạm cuối session

Khi Claude Code kết thúc một turn, hook này tìm file đã `Write` trong session hiện tại (qua `.agents/storage/logs/logs.jsonl`), giới hạn trong phạm vi dự án (so khớp `cwd`), còn tồn trên đĩa và khớp pattern tên file tạm (`tmp`/`scratch`/`debug`/`draft`/`sandbox`/`test-output`/`.bak`/`.orig`) — nếu có, nhắc qua `additionalContext` để Claude thấy và tự quyết có dùng skill `cleanup-temp-files` để dọn file tạm không; `/cleanup` chỉ làm gọn context. Liên hệ skill [`cleanup-temp-files`](../skills/cleanup-temp-files/SKILL.md).

- **Script**: [`scripts/remind-cleanup.sh`](./scripts/remind-cleanup.sh) — gọi `skills/cleanup-temp-files/scripts/find-session-scratch-files.sh`
- **Loại hook**: `Stop`
- **Chỉ nhắc, không tự xóa**: dùng `hookSpecificOutput.additionalContext`, không dùng `decision`/`reason` (sẽ chặn Claude dừng lại).
- **An toàn**: luôn `exit 0`; không có ứng viên, thiếu `jq`, hoặc thiếu script tìm file thì im lặng, không báo gì.
- **Phụ thuộc**: cần `jq`; dựa vào log của hook `audit-log` nên phải bật hook đó cùng lúc.

## report-reminder — nhắc dùng skill `report` nếu chưa báo cáo thay đổi

Khi Claude Code kết thúc một turn, hook này tìm trong `.agents/storage/logs/logs.jsonl` các lần `Edit`/`Write` của session hiện tại (giới hạn `cwd` đúng dự án) xảy ra **sau** lần gọi skill `report` gần nhất (hoặc từ đầu session nếu chưa gọi lần nào) — có thì nhắc qua `additionalContext`. Đây là lớp enforce cơ chế cho [`rules/delivery.md`](../rules/delivery.md#báo-cáo-bắt-buộc), thay vì chỉ dựa vào Claude tự giác nhớ gọi skill `report`.

- **Script**: [`scripts/report-reminder.sh`](./scripts/report-reminder.sh)
- **Loại hook**: `Stop`
- **Chỉ nhắc, không tự gọi skill giùm**: dùng `hookSpecificOutput.additionalContext`, không dùng `decision`/`reason` (sẽ chặn Claude dừng lại).
- **An toàn**: luôn `exit 0`; không có Edit/Write nào chưa báo cáo, thiếu `jq`, hoặc thiếu log thì im lặng, không báo gì.
- **Phụ thuộc**: cần `jq`; dựa vào log của hook `audit-log` (field `input.skill`) nên phải bật hook đó cùng lúc.
- **Token và lãng phí**: khi nhắc, hook còn đọc `transcript_path` bằng [`task-usage.mjs`](../skills/report/scripts/task-usage.mjs) và đưa vào context số token thật (input, output, cache đọc, cache tạo) cùng các vi phạm tiêu chí lãng phí kèm bằng chứng, để báo cáo ghi `Token:` và `Issue lãng phí:`. Ngưỡng ở [`waste-criteria.json`](../skills/report/assets/waste-criteria.json) (mặc định: đọc lại cùng file ≥ 3 lần, lặp cùng lệnh ≥ 3 lần, một kết quả tool > 20.000 ký tự, ≥ 3 lần gọi subagent, cache tạo mới > cache đọc khi ≥ 50.000 token). Cửa sổ đo tính từ mốc lần nhắc trước, lưu ở `.agents/storage/state/<session_id>.json`; lần đầu là cả phiên. Không đọc được transcript thì im lặng về token, không ghi N/A hay ước lượng.

## notify-done — phát âm thanh khi làm xong task

Khi Claude Code kết thúc một turn (trả lời xong, không còn việc gì đang chạy), hook này phát một âm thanh thông báo ngắn để biết task đã xong mà không cần nhìn màn hình liên tục.

- **Script**: [`scripts/notify-done.sh`](./scripts/notify-done.sh)
- **Loại hook**: `Stop` (không cần `matcher` — hook này không gắn với tool cụ thể)
- **Âm thanh theo hệ điều hành**: `afplay` (macOS, dùng `Glass.aiff`) → `paplay`/`aplay` (Linux) → `powershell.exe [console]::beep` (Windows/WSL). Không có công cụ nào khả dụng thì bỏ qua êm.
- **An toàn**: luôn `exit 0`, chạy ngầm (`&`) nên không làm chậm việc Claude Code dừng lại.

## condense-planner-input — lưới an toàn chặn prompt quá dài khi gọi planner-agent

Trước mỗi lần gọi Agent tool với `subagent_type: planner-agent`, hook này kiểm tra độ dài `prompt` — nếu vượt ngưỡng rất lớn (ví dụ dán nhầm nguyên văn cả tài liệu `system-design-agent` dài), tự cắt gọn (giữ phần đầu + phần cuối, cắt phần giữa) trước khi `planner-agent` nhận. **Đây chỉ là lưới an toàn cuối, không phải cơ chế rút gọn context chính** — bash không hiểu ngữ nghĩa nên không biết phần nào thật sự cần giữ; việc chọn lọc đúng phần liên quan là trách nhiệm của bước gọi `planner-agent` (xem [`workflow-plan`](../skills/workflow-plan/SKILL.md)).

- **Script**: [`scripts/condense-planner-input.sh`](./scripts/condense-planner-input.sh)
- **Loại hook**: `PreToolUse`, matcher `Agent`
- **Cơ chế**: dùng `hookSpecificOutput.updatedInput` để thay `tool_input.prompt` trước khi tool chạy — giữ nguyên các field khác (`subagent_type`, `description`...).
- **Ngưỡng**: cắt khi `prompt` > 20000 ký tự, giữ 13000 ký tự đầu + 6000 ký tự cuối, chèn dòng đánh dấu phần đã cắt.
- **An toàn**: `prompt` dưới ngưỡng, không phải tool `Agent`, không phải `subagent_type: planner-agent`, hoặc thiếu `jq` → không sửa gì.
- **Phụ thuộc**: cần `jq`.

## agent-role-reminder — báo tên agent đang gọi + nhắc khi có vẻ over-delegate

Mỗi lần gọi Agent tool, hook này luôn báo rõ tên `subagent_type` đang được dùng. Riêng với các vai trò "nặng" (`requirement-analysis-agent`, `planner-agent`, `system-design-agent`, `reviewer-agent`, `qa-tester-agent`, `researcher-agent`) kèm `prompt` quá ngắn — tín hiệu cơ học cho khả năng đang over-delegate một task nhỏ — hook chuyển sang hỏi xác nhận thay vì chỉ báo tin. Liên hệ [Execution discipline](../../AGENTS.md#execution-discipline)/[Điều phối giữa agent](../../AGENTS.md#điều-phối-giữa-agent).

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

## Đã bật sẵn trong chính repo này

`hook/` nằm trong `.claude/hooks/` của repo này, và `.claude/settings.json` đã trỏ cả 17 hook tự viết (`audit-log`, `commit-msg-guard`, `secret-scan`, `protected-branch-guard`, `format-before-push`, `condense-planner-input`, `agent-role-reminder`, `format-on-edit`, `ensure-final-newline`, `lint-on-edit`, `test-reminder`, `missing-test-reminder`, `dependency-audit-reminder`, `ci-workflow-lint`, `remind-cleanup`, `report-reminder`, `notify-done`) tới đúng path `.claude/hooks/scripts/...` — không cần cài thêm gì để dùng ngay trong repo này. Riêng hook `rtk hook claude` gọi tool ngoài, chỉ chạy được nếu máy đã cài [`rtk`](https://github.com/rtk-ai/rtk) (xem mục riêng ở trên). [`settings.snippet.json`](./settings.snippet.json) có nội dung tương đương, dùng khi copy sang project khác theo hướng dẫn ở trên.
