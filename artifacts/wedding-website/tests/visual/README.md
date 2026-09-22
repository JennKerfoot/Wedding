# Wedding visual checks

The production build runs this suite automatically through the package
`prebuild` script. A visual regression therefore fails the build before the
guest-facing website can be published.

## Run locally

From `artifacts/wedding-website`:

```sh
pnpm run test:visual
```

Playwright writes failed screenshots, diffs, error context, and traces to
`test-results/`. The release build runs `test:visual:release`, which stages that
output and, when the gate fails, retains the complete run at
`release-diagnostics/visual-gate/test-results/`. The release runner should
upload `release-diagnostics/visual-gate/` as its failure artifact before
cleaning the workspace. The repository release workflow in
`.github/workflows/release.yml` does this after a failed wedding build, then
links the published artifact URL in the release logs. It also contains a
`manifest.json` with the gate or build result.

The wrapper clears the retained directory before every run. A successful
release removes both the staging directory and any previous diagnostics, so
stale failures are not published with a successful build. Release systems that
use a different artifact location can set `VISUAL_DIAGNOSTICS_DIR`; the
relative path is resolved from this package.

## Updating an intentional design change

Only update snapshots when the visual change is intentional and has been
reviewed:

1. Run the visual suite without updating snapshots and inspect the failure
   screenshots and traces.
2. Make or review the corresponding design change.
3. Run `pnpm run test:visual:update` to regenerate the affected baselines from a fresh build.
4. Review every changed file under `tests/visual/__screenshots__/` and commit
   the baselines with the design change.
5. Run `pnpm run test:visual` again before publishing.

Never use snapshot updates to bypass an unexplained failure.
