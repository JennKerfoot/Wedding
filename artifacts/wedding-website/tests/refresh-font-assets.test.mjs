import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import test from 'node:test';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const refreshScript = join(packageRoot, 'scripts', 'refresh-font-assets.mjs');
const desktopUserAgent = 'Fixture Chromium desktop';
const mobileUserAgent = 'Fixture Chromium Pixel 7 Mobile';

const assetDefinitions = [
  ['instrument-serif-italic-ext.woff2', 'Instrument Serif', 'italic', [400], 'desktop', 'latin-ext'],
  ['instrument-serif-italic.woff2', 'Instrument Serif', 'italic', [400], 'desktop', 'latin'],
  ['instrument-serif-regular-ext.woff2', 'Instrument Serif', 'normal', [400], 'desktop', 'latin-ext'],
  ['instrument-serif-regular.woff2', 'Instrument Serif', 'normal', [400], 'desktop', 'latin'],
  ['instrument-serif-italic-mobile-ext.woff2', 'Instrument Serif', 'italic', [400], 'mobile', 'latin-ext'],
  ['instrument-serif-italic-mobile.woff2', 'Instrument Serif', 'italic', [400], 'mobile', 'latin'],
  ['instrument-serif-regular-mobile-ext.woff2', 'Instrument Serif', 'normal', [400], 'mobile', 'latin-ext'],
  ['instrument-serif-regular-mobile.woff2', 'Instrument Serif', 'normal', [400], 'mobile', 'latin'],
  ['outfit-ext.woff2', 'Outfit', 'normal', [300, 400, 500, 600], 'desktop', 'latin-ext'],
  ['outfit-latin.woff2', 'Outfit', 'normal', [300, 400, 500, 600], 'desktop', 'latin'],
  ['outfit-mobile-ext.woff2', 'Outfit', 'normal', [300, 400, 500, 600], 'mobile', 'latin-ext'],
  ['outfit-mobile.woff2', 'Outfit', 'normal', [300, 400, 500, 600], 'mobile', 'latin'],
];

test('dry run downloads a complete desktop/mobile proposal without changing approved files', async (t) => {
  const fixture = await createFixture(t);
  const before = await snapshotDirectory(fixture.fontsDirectory);
  const outputDirectory = join(fixture.root, 'proposal');

  const result = await runRefresh(fixture.root, ['--output-dir', outputDirectory]);

  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /Dry run only/);
  assert.deepEqual(await snapshotDirectory(fixture.fontsDirectory), before);

  const proposal = JSON.parse(await readFile(join(outputDirectory, 'proposal.json'), 'utf8'));
  assert.equal(proposal.applyRequested, false);
  assert.equal(proposal.assets.length, assetDefinitions.length);
  assert.deepEqual(
    new Set(proposal.assets.map(({ variant }) => variant)),
    new Set(['desktop', 'mobile']),
  );
});

test('apply updates bytes, hashes, source URLs, provider versions, and variant split', async (t) => {
  const fixture = await createFixture(t);
  const result = await runRefresh(fixture.root, [
    '--apply',
    '--output-dir',
    join(fixture.root, 'proposal'),
  ]);

  assert.equal(result.code, 0, result.stderr);
  const manifest = JSON.parse(await readFile(fixture.manifestPath, 'utf8'));
  assert.equal(manifest.source.versions['Instrument Serif'], 'v21');
  assert.equal(manifest.source.versions.Outfit, 'v31');

  for (const asset of manifest.files) {
    const expectedBytes = fixture.fontBytes(asset);
    const actualBytes = await readFile(join(fixture.fontsDirectory, asset.file));
    assert.deepEqual(actualBytes, expectedBytes, `${asset.file} bytes`);
    assert.equal(asset.sha256, sha256(expectedBytes), `${asset.file} hash`);
    assert.equal(
      asset.sourceUrls[asset.variant],
      fixture.fontUrl(asset),
      `${asset.file} source URL`,
    );
    assert.deepEqual(
      Object.keys(asset.sourceUrls),
      [asset.variant],
      `${asset.file} keeps only its ${asset.variant} source`,
    );
  }

  const desktop = manifest.files.find(({ file }) => file === 'outfit-latin.woff2');
  const mobile = manifest.files.find(({ file }) => file === 'outfit-mobile.woff2');
  assert.notEqual(desktop.sha256, mobile.sha256);
  assert.notEqual(desktop.sourceUrls.desktop, mobile.sourceUrls.mobile);
});

for (const failure of [
  {
    scenario: 'duplicate',
    expected: /Could not uniquely match instrument-serif-italic-ext\.woff2.*found 2 matching source URLs/,
  },
  {
    scenario: 'missing',
    expected: /Could not uniquely match instrument-serif-italic-ext\.woff2.*found 0 matching source URLs/,
  },
  {
    scenario: 'mismatched',
    expected: /Could not uniquely match instrument-serif-italic-ext\.woff2.*found 0 matching source URLs/,
  },
]) {
  test(`${failure.scenario} font-face responses fail clearly`, async (t) => {
    const fixture = await createFixture(t, failure.scenario);
    const before = await snapshotDirectory(fixture.fontsDirectory);

    const result = await runRefresh(fixture.root, [
      '--output-dir',
      join(fixture.root, 'proposal'),
    ]);

    assert.equal(result.code, 1);
    assert.match(result.stderr, failure.expected);
    assert.deepEqual(await snapshotDirectory(fixture.fontsDirectory), before);
  });
}

async function createFixture(t, scenario = 'valid') {
  const root = await mkdtemp(join(tmpdir(), 'font-refresh-test-'));
  const fontsDirectory = join(root, 'public', 'fonts');
  const manifestPath = join(fontsDirectory, 'font-manifest.json');
  await mkdir(fontsDirectory, { recursive: true });

  let origin;
  const server = createServer((request, response) => {
    const url = new URL(request.url, origin);
    const variant = request.headers['user-agent']?.includes('Pixel 7')
      ? 'mobile'
      : 'desktop';

    if (url.pathname.startsWith('/css/')) {
      const family = url.pathname.endsWith('instrument-serif')
        ? 'Instrument Serif'
        : 'Outfit';
      response.writeHead(200, { 'content-type': 'text/css' });
      response.end(cssFixture({ family, variant, scenario, origin }));
      return;
    }

    const asset = assetDefinitions
      .map(toAsset)
      .find((candidate) => fontPath(candidate) === url.pathname);
    if (!asset) {
      response.writeHead(404).end('missing fixture');
      return;
    }
    response.writeHead(200, { 'content-type': 'font/woff2' });
    response.end(fontBytes(asset));
  });
  await new Promise((resolvePromise) => server.listen(0, '127.0.0.1', resolvePromise));
  origin = `http://127.0.0.1:${server.address().port}`;
  t.after(() => new Promise((resolvePromise) => server.close(resolvePromise)));

  const files = assetDefinitions.map(toAsset).map((asset) => ({
    ...asset,
    sha256: sha256(Buffer.from(`approved:${asset.file}`)),
    sourceUrls: {
      [asset.variant]: `https://approved.invalid/${asset.file}`,
    },
  }));
  for (const asset of files) {
    await writeFile(join(fontsDirectory, asset.file), Buffer.from(`approved:${asset.file}`));
  }

  const manifest = {
    manifestVersion: 1,
    approvedAt: '2026-01-01',
    source: {
      provider: 'Google Fonts',
      cssApi: {
        instrumentSerif: `${origin}/css/instrument-serif`,
        outfit: `${origin}/css/outfit`,
      },
      versions: {
        'Instrument Serif': 'v1',
        Outfit: 'v1',
      },
      retrieval: {
        userAgents: {
          desktop: desktopUserAgent,
          mobile: mobileUserAgent,
        },
      },
    },
    files,
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  return {
    root,
    fontsDirectory,
    manifestPath,
    fontBytes,
    fontUrl: (asset) => `${origin}${fontPath(asset)}`,
  };
}

function cssFixture({ family, variant, scenario, origin }) {
  const familyAssets = assetDefinitions
    .map(toAsset)
    .filter((asset) => asset.family === family && asset.variant === variant);
  const faces = [];

  for (const asset of familyAssets) {
    if (
      family === 'Instrument Serif' &&
      variant === 'desktop' &&
      asset.style === 'italic' &&
      asset.subset === 'latin-ext'
    ) {
      if (scenario === 'missing') continue;
      if (scenario === 'mismatched') {
        faces.push(fontFace({ ...asset, weights: [500] }, `${origin}${fontPath(asset)}`));
        continue;
      }
      if (scenario === 'duplicate') {
        faces.push(fontFace(asset, `${origin}/s/instrumentserif/v21/duplicate.woff2`));
      }
    }
    for (const weight of asset.weights) {
      faces.push(
        fontFace({ ...asset, weights: [weight] }, `${origin}${fontPath(asset)}`),
      );
    }
  }

  return `${faces.join('\n\n')}\n`;
}

function fontFace(asset, url) {
  const unicodeRange =
    asset.subset === 'latin-ext' ? 'U+0100-02BA, U+1E00-1E9F' : 'U+0000-00FF';
  const weight = asset.weights[0];
  return `/* ${asset.subset} */
@font-face {
  font-family: '${asset.family}';
  font-style: ${asset.style};
  font-weight: ${weight};
  src: url(${url}) format('woff2');
  unicode-range: ${unicodeRange};
}`;
}

function toAsset([file, family, style, weights, variant, subset]) {
  return { file, family, style, weights, variant, subset };
}

function fontPath(asset) {
  const family = asset.family === 'Instrument Serif' ? 'instrumentserif' : 'outfit';
  const version = asset.family === 'Instrument Serif' ? 'v21' : 'v31';
  return `/s/${family}/${version}/${asset.file}`;
}

function fontBytes(asset) {
  return Buffer.from(`fixture:${asset.variant}:${asset.file}`);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function snapshotDirectory(directory) {
  const entries = (await readdir(directory)).sort();
  return Object.fromEntries(
    await Promise.all(
      entries.map(async (entry) => [entry, sha256(await readFile(join(directory, entry)))]),
    ),
  );
}

async function runRefresh(root, argumentsList) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [refreshScript, ...argumentsList], {
      env: {
        ...process.env,
        FONT_REFRESH_PACKAGE_ROOT: root,
      },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.setEncoding('utf8').on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => resolvePromise({ code, stdout, stderr }));
  });
}