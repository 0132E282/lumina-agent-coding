# Pipeline automating assets, CSS and media

When the user asks to clone from a URL and needs local assets, use the pipeline below. It is a helper for building the clone; final acceptance is still comparing the real UI. Apply the [Fidelity constraints](../SKILL.md#fidelity-constraints) section in SKILL.md.

### Step 0 — Source inventory (before coding)

Before downloading assets or writing code, create a read-only inventory with [`scripts/inspect-source.py`](../scripts/inspect-source.py) — downloads no assets, only lists observed routes, stylesheets, scripts, images, fonts and links:

```bash
python3 .agents/skills/clone-website/scripts/inspect-source.py \
  https://example.com/page \
  --output clone-source.json
```

When the source is a URL and the user asks to clone, the subagent must run this inventory step itself before Step 1; do not wait for the user to remind you.

### Step 1 — Extract and download assets

Run [`scripts/extract-assets.py`](../scripts/extract-assets.py) with the clone's own output:

```bash
python3 .agents/skills/clone-website/scripts/extract-assets.py \
  https://example.com/page \
  --output .agents/storage/assets
```

The script creates `.agents/storage/assets/temp/{images,videos,fonts,other}` and `mapping.json` (keeps `originUrl`, `localPath`, `kind`, `status`, size, content type, skip/fail reason). Scans HTML, inline `url()` and `url()` in downloaded CSS; defaults to same-origin, 30s timeout, 50 MiB/file. `--allow-external` only when the external host is allowed; `.m3u8` is always recorded as `skipped`, never downloaded.

URL assigned for cloning -> downloading same-origin resources is within scope, no need to ask again; stop/report a blocker only when hitting authentication/CAPTCHA/paywall or needing an external host/stream not yet allowed (see [Fidelity constraints](../SKILL.md#fidelity-constraints)).

### Step 2 — Process CSS

For each inventoried stylesheet, run [`scripts/process-css.py`](../scripts/process-css.py):

```bash
python3 .agents/skills/clone-website/scripts/process-css.py \
  --input .agents/storage/assets/temp/other/site.css \
  --mapping .agents/storage/assets/mapping.json \
  --output src/layout/site.processed.css
```

The script only replaces URLs with status `downloaded`, keeps selectors/CSS order intact and adds a final newline. Never use the mapping to fake failed/skipped assets. Keep the processed CSS file in the clone's layout/asset structure; do not overwrite the source CSS.

### Step 3 — Inject layout and media

After CSS is processed, run [`scripts/inject-layout.py`](../scripts/inject-layout.py) with its own layout output:

```bash
python3 .agents/skills/clone-website/scripts/inject-layout.py \
  --input public/clone-layout.source.html \
  --css src/layout/site.processed.css \
  --mapping .agents/storage/assets/mapping.json \
  --output public/clone-layout.html
```

The script injects a single stylesheet into `<head>` (idempotent), rewrites `src`/`poster` of `img`, `video`, `audio`, `source`, `track` when the mapping is verified, and does not change the source layout. `iframe`, streams, cross-origin media or DOM attributes the script does not recognize must be checked manually and recorded in the handoff.

### Step 4 — Verify structure after coding

Once the clone HTML exists, check the structure inventory with [`scripts/compare-html.py`](../scripts/compare-html.py). This is only a structural check (matching tags/sections/text length); pixel fidelity must still be compared at the same viewport with screenshots/a suitable tool:

```bash
python3 .agents/skills/clone-website/scripts/compare-html.py \
  source.html \
  cloned.html
```

### Default storage structure

```text
.agents/storage/assets/
├── temp/{images,videos,fonts,other}/
├── mapping.json
└── processed/
```

`temp/` and `mapping.json` are temporary resources (already in `.agents/storage/`'s `.gitignore`), never committed. Assets actually used in the clone go in `public/`/the project's asset dir, not `.agents/storage/`. For design docs: copy [`assets/pixel-perfect-spec.md`](../assets/pixel-perfect-spec.md) into `docs/design/`, replace `TBD` with measured values, update the docs registry per repo rules.
