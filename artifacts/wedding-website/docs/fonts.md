# Approved wedding-site fonts

The self-hosted font binaries are an approved visual asset set. Run
`pnpm run validate:fonts` from `artifacts/wedding-website` before a release.
The validator checks the manifest hashes, the exact contents of `public/fonts/`,
and the font files referenced by `src/index.css`.

## Current source record

- Provider: Google Fonts CSS2 API
- Instrument Serif request:
  `https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap`
- Outfit request:
  `https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap`
- Approved provider versions: Instrument Serif `v5`, Outfit `v15`
- Approved on: 2026-09-22
- Retrieval contexts: Linux desktop Chromium and Pixel 7 mobile Chromium
- Exact retrieval user-agent strings are recorded in `font-manifest.json`

Google Fonts can return different WOFF2 binaries for desktop and mobile user
agents. Do not replace the desktop files with mobile responses, or vice versa.
The manifest records the exact gstatic source URL, family, style, weights,
subset, variant, and SHA-256 hash for every approved local file.

## Intentional refresh workflow

Run the refresh utility from `artifacts/wedding-website`:

```bash
pnpm run refresh:fonts
```

The default command is a dry run. It fetches every recorded CSS2 request twice
with the desktop and Pixel 7 mobile user agents, saves each CSS sample and the
proposed WOFF2 files into a temporary directory, and prints every proposed hash
or source URL change. Use `--samples N` (where `N` is at least 2) for more
repetitions. It never changes `public/fonts/` or the manifest. The temporary
directory also contains `proposal.json` for review.

Each repeated response is normalized by family, style, subset, and weights.
The refresh then compares the selected gstatic URL and downloaded SHA-256 hash
for every matching face. If any samples disagree, the report lists each
response under `providerDisagreements` and the command exits unsuccessfully.
Apply mode is blocked before any approved font file or manifest entry changes.

After reviewing the proposal, explicitly apply it:

```bash
pnpm run refresh:fonts:apply
```

The apply command preserves the desktop/mobile split and existing filenames,
updates the matching gstatic URLs, provider versions, hashes, and `approvedAt`,
then leaves the normal release checks unchanged. It does not rewrite CSS or
change the manifest's recorded CSS2 requests. The normal `validate:fonts` and
release commands continue to use only local files and do not contact Google.

After applying a refresh, run:

```bash
pnpm run validate:fonts
pnpm run test:visual:release
```

An asset refresh is not complete until the manifest and visual baselines are
updated together. If the CSS response changes the available subsets, weights,
or styles, update the `@font-face` declarations and their manifest entries in
the same change.

## Release validation

Changes under the wedding website are validated by the protected `Wedding website release validation` check before merging. GitHub accepts only the check produced by the GitHub Actions app.
