---
name: dependency-audit
description: Rà soát dependency (npm/yarn/pnpm, composer, pip/poetry, cargo, go mod...) tìm bản lỗi thời hoặc có lỗ hổng (CVE) đã biết bằng audit tool có sẵn của chính ecosystem (npm audit, composer audit, pip-audit, cargo audit, govulncheck), đề xuất upgrade tối thiểu giữ tương thích. Dùng trước khi thêm dependency mới, khi review PR có đổi package.json/composer.json/requirements.txt/go.mod, hoặc khi người dùng hỏi dependency có an toàn không. KHÔNG tự ý chạy upgrade/install — chỉ báo cáo và đề xuất lệnh, người dùng tự quyết chạy.
license: MIT
metadata:
  version: "1.1"
---

# 📦 Dependency Audit

Skill **read-only** cho dependency — cùng tinh thần [`rules/backend`](../../rules/backend.md#database-read-only-mặc-định) áp cho package manager: tự do audit, **không tự ý** `install`/`update`/`upgrade` khi chưa được yêu cầu rõ.

## Quy trình

1. Xác định ecosystem + lockfile thật trong project (`package-lock.json`/`yarn.lock`/`pnpm-lock.yaml`, `composer.lock`, `poetry.lock`/`requirements.txt`, `Cargo.lock`, `go.sum`) — monorepo audit riêng từng phần.
2. Chạy audit tool read-only tương ứng, không kèm `--fix`/`--force`: `npm|yarn|pnpm audit`, `composer audit`, `pip-audit`, `cargo audit`, `govulncheck ./...`. Thiếu tool trong `PATH` → nói rõ không audit được, không bịa kết quả ([`rules/search-priority`](../../rules/search-priority.md)).
3. Severity lấy đúng theo output thật của tool, không tự đặt mức khác.
4. Mỗi lỗ hổng ghi: package, version hiện tại, version fix tối thiểu, patch/minor/major theo SemVer — nhảy major thì cảnh báo khả năng breaking change.
5. **Chỉ đề xuất lệnh cụ thể** (`npm install pkg@x.y.z`...), không tự chạy — giống Explicit Authorization của [`rules/git`](../../rules/git.md) áp cho package manager; lockfile đổi sau upgrade cũng qua đúng quy trình commit, không tự commit kèm.
6. Ngoại lệ: người dùng yêu cầu rõ *cả hai* (audit **và** tự chạy upgrade) → được chạy đúng lệnh đã đề xuất. Không suy rộng từ "kiểm tra dependency" sang tự tiện cài/update.

## Khi áp dụng

- Trước khi thêm dependency mới; khi review PR đổi manifest/lockfile; khi người dùng hỏi trực tiếp dependency có an toàn không.
- Không dùng để tự ý `npm update`/`composer update` hàng loạt khi chỉ được yêu cầu kiểm tra.
