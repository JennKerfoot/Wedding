import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { promisify } from "node:util";
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const projectDir = join(dirname(fileURLToPath(import.meta.url)), "../..");
const wrapperPath = join(projectDir, "scripts/run-visual-gate.mjs");

test("retains the failed visual run manifest and diagnostics", async () => {
  await withVisualGateFixture(
    "fail",
    async ({ diagnosticsDir, stagingDir, env }) => {
      await mkdir(join(diagnosticsDir, "test-results"), { recursive: true });
      await writeFile(
        join(diagnosticsDir, "test-results", "stale.txt"),
        "stale",
      );
      await mkdir(stagingDir, { recursive: true });
      await writeFile(join(stagingDir, "stale.txt"), "stale");

      const result = await runWrapper(env);

      assert.equal(result.code, 1);
      assert.equal(result.signal, null);
      assert.deepEqual(
        JSON.parse(
          await readFile(join(diagnosticsDir, "manifest.json"), "utf8"),
        ),
        {
          status: "failed",
          command: "pnpm run test:visual",
          exitCode: 1,
          signal: null,
          artifactDirectory: "test-results",
        },
      );
      assert.equal(
        await readFile(
          join(diagnosticsDir, "test-results", "failed-screenshot.png"),
          "utf8",
        ),
        "screenshot diagnostic",
      );
      assert.equal(
        await readFile(
          join(diagnosticsDir, "test-results", "trace.zip"),
          "utf8",
        ),
        "trace diagnostic",
      );
      assert.equal(
        await readFile(
          join(diagnosticsDir, "test-results", "error-context.md"),
          "utf8",
        ),
        "error context diagnostic",
      );
      await assert.rejects(() =>
        readFile(join(diagnosticsDir, "test-results", "stale.txt")),
      );
      await assert.rejects(() => readFile(join(stagingDir, "stale.txt")));
    },
  );
});

test("removes previous diagnostics and staging output after a successful visual run", async () => {
  await withVisualGateFixture(
    "success",
    async ({ diagnosticsDir, stagingDir, env }) => {
      await mkdir(join(diagnosticsDir, "test-results"), { recursive: true });
      await writeFile(join(diagnosticsDir, "manifest.json"), "old manifest");
      await writeFile(
        join(diagnosticsDir, "test-results", "old-screenshot.png"),
        "old screenshot",
      );
      await mkdir(stagingDir, { recursive: true });
      await writeFile(join(stagingDir, "old-trace.zip"), "old trace");

      const result = await runWrapper(env);

      assert.equal(result.code, 0);
      assert.equal(result.signal, null);
      await assert.rejects(() =>
        readFile(join(diagnosticsDir, "manifest.json")),
      );
      await assert.rejects(() =>
        readFile(join(diagnosticsDir, "test-results", "old-screenshot.png")),
      );
      await assert.rejects(() =>
        readFile(join(stagingDir, "successful-staging-file.txt")),
      );
      await assert.rejects(() => readFile(join(stagingDir, "old-trace.zip")));
    },
  );
});

async function withVisualGateFixture(mode, callback) {
  const fixtureDir = await mkdtemp(join(tmpdir(), "wedding-visual-gate-"));
  const binDir = join(fixtureDir, "bin");
  const diagnosticsDir = join(fixtureDir, "diagnostics");
  const stagingDir = `${diagnosticsDir}.staging`;

  await mkdir(binDir, { recursive: true });
  await writeFile(
    join(binDir, "pnpm"),
    `#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

if (process.argv[2] !== "run" || process.argv[3] !== "test:visual") {
  process.exit(2);
}


const outputDir = process.env.PLAYWRIGHT_OUTPUT_DIR;
mkdirSync(outputDir, { recursive: true });
writeFileSync(join(outputDir, "successful-staging-file.txt"), "fresh staging output");

if (process.env.VISUAL_GATE_FIXTURE_MODE === "fail") {
  writeFileSync(join(outputDir, "failed-screenshot.png"), "screenshot diagnostic");
  writeFileSync(join(outputDir, "trace.zip"), "trace diagnostic");
  writeFileSync(join(outputDir, "error-context.md"), "error context diagnostic");
  process.exit(1);
}
`,
    { mode: 0o755 },
  );

  try {
    await callback({
      diagnosticsDir,
      stagingDir,
      env: {
        ...process.env,
        PATH: `${binDir}${delimiter}${process.env.PATH ?? ""}`,
        VISUAL_DIAGNOSTICS_DIR: diagnosticsDir,
        VISUAL_GATE_FIXTURE_MODE: mode,
      },
    });
  } finally {
    await rm(fixtureDir, { recursive: true, force: true });
  }
}

async function runWrapper(env) {
  try {
    await execFileAsync(process.execPath, [wrapperPath], {
      cwd: projectDir,
      env,
    });
    return { code: 0, signal: null };
  } catch (error) {
    return {
      code: error.code ?? null,
      signal: error.signal ?? null,
      stdout: error.stdout,
      stderr: error.stderr,
    };
  }
}