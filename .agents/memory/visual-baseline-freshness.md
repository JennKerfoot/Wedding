---
name: Visual baseline freshness
description: Prevents screenshot baselines from capturing stale local application builds.
---

Visual regression baselines must be generated and checked against a fresh production build, not a reused local server.

**Why:** Reusing a server on the Playwright port can silently capture an older application state, producing baselines that do not represent the current source.

**How to apply:** Use CI mode for release checks and snapshot updates so Playwright starts its own server; keep the release build's visual gate on the same path.

The release gate installs Chromium only; Playwright device presets for WebKit require an additional browser dependency. Use a Chromium preset with an explicit viewport for new release-gate projects unless browser installation expands.

**Why:** A tablet device preset can silently select WebKit and make otherwise valid visual checks fail in the release environment.

**How to apply:** Prefer `Desktop Chrome` plus explicit tablet dimensions for tablet baselines in this project.