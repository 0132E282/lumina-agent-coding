---
name: ci-pipeline
description: "Soạn/review pipeline CI (GitHub Actions, GitLab CI...) để lint + test + build chạy trước merge: job fail-fast, cache, trigger hợp lý, secret qua biến CI. Dùng khi thêm hoặc sửa workflow CI, hoặc review PR đổi .github/workflows. Chỉ soạn file cấu hình, không trigger deploy hay chạy workflow thật."
license: MIT
metadata:
  version: "1.2"
---

# ⚙️ CI Pipeline

Soạn/review **file cấu hình CI** (không chạy workflow thật, không deploy) — đảm bảo mọi thay đổi code qua lint + test + build trước khi merge, nối tiếp [`rules/delivery`](../../rules/delivery.md#chất-lượng-và-bằng-chứng) ở tầng tự động hóa.

## Quy trình

1. Xác định platform từ file có sẵn trong repo (`.github/workflows/*.yml`, `.gitlab-ci.yml`, `azure-pipelines.yml`) — chưa có CI và chưa chỉ định platform → hỏi lại trước khi chọn.
2. Xác định stack thật từ manifest (`package.json`, `composer.json`, `requirements.txt`, `go.mod`) để chọn đúng setup action + cache dependency.
3. Thứ tự job chuẩn, **fail fast** ([`rules/coding`](../../rules/coding.md#nguyên-tắc-code)): `install → lint → test → build` — lint/test fail thì dừng ngay, không chạy tiếp build.
4. Trigger: `pull_request` chạy full suite; `push` branch chính tách job riêng (build/deploy) khỏi lint/test ([`rules/coding`](../../rules/coding.md#nguyên-tắc-code)).
5. Secret luôn qua biến CI (`secrets.*`, CI/CD Variables) — không hardcode vào YAML, không log ra output ([`rules/backend`](../../rules/backend.md#an-toàn-dữ-liệu)).
6. Quyền tối thiểu: khai báo `permissions:` ở workflow/job (mặc định `contents: read`), chỉ cấp thêm cho đúng job cần; không dựa vào quyền mặc định của token.
7. Không chạy code PR không tin cậy kèm secret hoặc quyền ghi: tránh `pull_request_target`/`workflow_run` checkout và chạy code PR từ fork; nếu bắt buộc dùng thì không checkout head của PR hoặc tách sang job không có secret.
8. Pin action bên thứ ba theo commit SHA đầy đủ, ghi tag ở comment bên cạnh; không dùng `@main`/`@master`.
9. Khi review workflow có sẵn: thiếu lint/test, thiếu cache, matrix version không khớp runtime thật, step chạy trên self-hosted runner không rõ nguồn gốc, thiếu `permissions`, action pin theo tag/nhánh, `pull_request_target` chạy code PR.

## Không tự ý

- Thêm job deploy production, chạy migration thật, hoặc đổi secret/env của repo thật — thay đổi hạ tầng chia sẻ cần xác nhận người dùng trước.
- Trigger chạy workflow thật (`gh workflow run`, push remote) khi chỉ được yêu cầu soạn/review file cấu hình.

## Khi áp dụng

- Thêm/sửa workflow CI, review PR đổi `.github/workflows`/`.gitlab-ci.yml`, hoặc thiết lập pipeline lint/test/build cơ bản cho repo chưa có CI.
- Không dùng để tự chạy deploy hoặc đổi secret thật trên CI platform.
