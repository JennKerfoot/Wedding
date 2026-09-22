import { fileURLToPath } from 'node:url';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const configuredDiagnosticsDir =
  process.env.VISUAL_DIAGNOSTICS_DIR ?? 'release-diagnostics/visual-gate';
const diagnosticsDir = resolve(projectDir, configuredDiagnosticsDir);
const stagingDir = `${diagnosticsDir}.staging`;

await rm(diagnosticsDir, { recursive: true, force: true });
await rm(stagingDir, { recursive: true, force: true });
await mkdir(dirname(diagnosticsDir), { recursive: true });

const result = await runVisualTests();

if (result.code === 0) {
  await rm(diagnosticsDir, { recursive: true, force: true });
  await rm(stagingDir, { recursive: true, force: true });
  process.exit(0);
}

await rm(diagnosticsDir, { recursive: true, force: true });
await rename(stagingDir, diagnosticsDir).catch(async (error) => {
  if (error.code !== 'ENOENT') throw error;
  await mkdir(diagnosticsDir, { recursive: true });
});

await writeFile(
  resolve(diagnosticsDir, 'manifest.json'),
  `${JSON.stringify(
    {
      status: 'failed',
      command: 'pnpm run test:visual',
      exitCode: result.code,
      signal: result.signal,
      artifactDirectory: 'test-results',
    },
    null,
    2,
  )}\n`,
);

console.error(
  `Visual gate failed. Diagnostics retained at ${configuredDiagnosticsDir}/test-results`,
);
process.exit(result.code ?? 1);

function runVisualTests() {
  return new Promise((resolveResult) => {
    const child = spawn('pnpm', ['run', 'test:visual'], {
      cwd: projectDir,
      env: {
        ...process.env,
        CI: process.env.CI ?? '1',
        PLAYWRIGHT_OUTPUT_DIR: resolve(stagingDir, 'test-results'),
      },
      stdio: 'inherit',
    });

    child.once('error', (error) => {
      console.error(`Unable to start the visual gate: ${error.message}`);
      resolveResult({ code: null, signal: null });
    });
    child.once('close', (code, signal) => resolveResult({ code, signal }));
  });
}