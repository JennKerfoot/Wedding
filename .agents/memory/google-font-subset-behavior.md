---
name: Google font subset behavior
description: Device-specific Google Fonts WOFF2 responses can produce different glyph rasterization in desktop and mobile visual checks.
---

Google Fonts may return different WOFF2 subset binaries based on the browser user agent, even when the CSS family and weight request is identical. It can also return different source URLs and binaries for immediate repeats of the same request context. If a site self-hosts those fonts and must preserve existing desktop and mobile screenshots, vendor the relevant variants and select them with a stable responsive media condition rather than relying on one universal binary.

**Why:** The same wedding typography request returned different Instrument Serif and Outfit binaries to desktop and Pixel 7 browser contexts; using only one local set caused a deterministic mobile screenshot drift. Repeated Pixel 7 Outfit requests also alternated between static WOFF2 URLs and generated font-kit URLs with different hashes, so a single refresh response is not sufficient evidence for approval.

**How to apply:** When replacing or refreshing a Google Fonts dependency, inspect each supported visual/browser context, repeat identical requests, compare normalized face URLs and downloaded hashes, and refuse approval when samples disagree. Verify the full screenshot suite after localizing stable matching assets.