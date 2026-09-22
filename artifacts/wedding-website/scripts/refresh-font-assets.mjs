import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const packageRoot = process.env.FONT_REFRESH_PACKAGE_ROOT
  ? resolve(process.env.FONT_REFRESH_PACKAGE_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fontsDirectory = join(packageRoot, 'public', 'fonts');
const manifestPath = join(fontsDirectory, 'font-manifest.json');

const argumentsList = process.argv.slice(2);
const applyChanges = argumentsList.includes('--apply');
const outputFlagIndex = argumentsList.indexOf('--output-dir');
const outputDir =
  outputFlagIndex === -1 ? null : argumentsList[outputFlagIndex + 1];
const samplesFlagIndex = argumentsList.indexOf('--samples');
const samplesValue =
  samplesFlagIndex === -1 ? '2' : argumentsList[samplesFlagIndex + 1];
const sampleCount = Number(samplesValue);

for (let index = 0; index < argumentsList.length; index += 1) {
  const argument = argumentsList[index];
  if (argument === '--') continue;
  if (argument === '--apply') continue;
  if (argument === '--output-dir') {
    index += 1;
    continue;
  }
  if (argument === '--samples') {
    index += 1;
    continue;
  }
  {
    fail(`Unknown argument: ${argument}`);
  }
}

if (outputFlagIndex !== -1 && (!outputDir || outputDir.startsWith('--'))) {
  fail('--output-dir requires a directory path');
}
if (
  samplesFlagIndex !== -1 &&
  (!samplesValue || samplesValue.startsWith('--') || !Number.isInteger(sampleCount))
) {
  fail('--samples requires an integer');
}
if (sampleCount < 2) {
  fail('--samples must be at least 2 so provider responses can be compared');
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const userAgents = manifest.source?.retrieval?.userAgents;
if (!userAgents?.desktop || !userAgents?.mobile) {
  fail('Manifest source.retrieval.userAgents must record desktop and mobile user agents');
}
const refreshDirectory = outputDir
  ? resolve(packageRoot, outputDir)
  : await mkdtemp(join(tmpdir(), 'wedding-font-refresh-'));
const cssDirectory = join(refreshDirectory, 'css');
const proposedFontsDirectory = join(refreshDirectory, 'fonts');
await mkdir(cssDirectory, { recursive: true });
await mkdir(proposedFontsDirectory, { recursive: true });

const sourceFamilies = [
  ['instrumentSerif', 'Instrument Serif'],
  ['outfit', 'Outfit'],
];
const proposedAssets = [];
const providerDisagreements = [];

for (const [sourceKey, family] of sourceFamilies) {
  const cssUrl = manifest.source?.cssApi?.[sourceKey];
  if (!cssUrl) fail(`Missing manifest source.cssApi.${sourceKey}`);

  for (const variant of ['desktop', 'mobile']) {
    const samples = [];
    for (let sample = 1; sample <= sampleCount; sample += 1) {
      const css = await fetchText(cssUrl, userAgents[variant]);
      const cssPath = join(
        cssDirectory,
        `${slugify(family)}-${variant}-sample-${sample}.css`,
      );
      await writeFile(cssPath, css);
      samples.push({
        sample,
        faces: parseFontFaces(css).filter((face) => face.family === family),
      });
    }

    const manifestAssets = manifest.files.filter(
      (asset) => asset.family === family && asset.variant === variant,
    );

    for (const asset of manifestAssets) {
      const responses = [];
      for (const sample of samples) {
        const candidateFaces = sample.faces.filter(
          (face) =>
            face.style === asset.style &&
            face.subset === asset.subset,
        );
        const matchingFaceGroups = groupFacesByUrl(candidateFaces).filter(
          (group) => sameNumbers(group.weights, asset.weights),
        );

        if (matchingFaceGroups.length !== 1) {
          fail(
            `Could not uniquely match ${asset.file} in sample ${sample.sample} of the ` +
              `${variant} ${family} CSS response ` +
              `(found ${matchingFaceGroups.length} matching source URLs)`,
          );
        }

        const face = matchingFaceGroups[0];
        const fontBytes = await fetchBytes(face.url, userAgents[variant]);
        responses.push({
          sample: sample.sample,
          sourceUrl: face.url,
          sha256: hash(fontBytes),
          bytes: fontBytes.byteLength,
          fontBytes,
        });
      }

      const [selectedResponse] = responses;
      const proposedPath = join(proposedFontsDirectory, asset.file);
      await writeFile(proposedPath, selectedResponse.fontBytes);

      const distinctResponses = uniqueResponseMetadata(responses);
      if (distinctResponses.length > 1) {
        providerDisagreements.push({
          file: asset.file,
          family,
          variant,
          style: asset.style,
          subset: asset.subset,
          weights: asset.weights,
          responses: responses.map(({ fontBytes, ...response }) => response),
        });
      }

      proposedAssets.push({
        file: asset.file,
        family,
        variant,
        subset: asset.subset,
        previousHash: asset.sha256,
        nextHash: selectedResponse.sha256,
        previousSourceUrl: asset.sourceUrls?.[variant] ?? null,
        nextSourceUrl: selectedResponse.sourceUrl,
        bytes: selectedResponse.bytes,
        samples: responses.map(({ fontBytes, ...response }) => response),
        changed:
          asset.sha256 !== selectedResponse.sha256 ||
          asset.sourceUrls?.[variant] !== selectedResponse.sourceUrl,
      });
    }
  }
}

const changedAssets = proposedAssets.filter((asset) => asset.changed);
const proposal = {
  generatedAt: new Date().toISOString(),
  applyRequested: applyChanges,
  sampleCount,
  providerStable: providerDisagreements.length === 0,
  providerDisagreements,
  source: manifest.source,
  cssDirectory,
  fontsDirectory: proposedFontsDirectory,
  assets: proposedAssets,
  changedFiles: changedAssets.map((asset) => asset.file),
};
await writeFile(
  join(refreshDirectory, 'proposal.json'),
  `${JSON.stringify(proposal, null, 2)}\n`,
);

console.log(`Font refresh proposal: ${refreshDirectory}`);
console.log(
  `Fetched ${sourceFamilies.length * 2 * sampleCount} CSS responses ` +
    `(${sampleCount} samples per recorded request context)`,
);
if (providerDisagreements.length > 0) {
  console.error(
    `Provider stability check found ${providerDisagreements.length} disagreement(s):`,
  );
  for (const disagreement of providerDisagreements) {
    console.error(
      `- ${disagreement.file}: ${disagreement.family}, ${disagreement.style}, ` +
        `${disagreement.subset}, ${disagreement.variant}, weights ${disagreement.weights.join(', ')}`,
    );
    for (const response of disagreement.responses) {
      console.error(
        `  sample ${response.sample}: ${response.sourceUrl} ` +
          `(sha256 ${response.sha256}, ${response.bytes} bytes)`,
      );
    }
  }
}
if (changedAssets.length === 0) {
  console.log('No approved font assets would change.');
} else {
  console.log(`Proposed asset changes (${changedAssets.length}):`);
  for (const asset of changedAssets) {
    console.log(
      `- ${asset.file}: ${asset.previousHash} -> ${asset.nextHash} (${asset.bytes} bytes)`,
    );
    if (asset.previousSourceUrl !== asset.nextSourceUrl) {
      console.log(`  source: ${asset.previousSourceUrl ?? '(none)'}`);
      console.log(`       -> ${asset.nextSourceUrl}`);
    }
  }
}

if (providerDisagreements.length > 0) {
  fail(
    applyChanges
      ? 'Refusing to apply inconsistent provider responses; review proposal.json'
      : 'Provider responses were inconsistent; review proposal.json',
  );
} else if (!applyChanges) {
  console.log('Dry run only. Pass --apply to replace assets and update the manifest.');
} else {
  for (const asset of proposedAssets) {
    await copyFile(
      join(proposedFontsDirectory, asset.file),
      join(fontsDirectory, asset.file),
    );
    const manifestAsset = manifest.files.find((entry) => entry.file === asset.file);
    manifestAsset.sha256 = asset.nextHash;
    manifestAsset.sourceUrls[asset.variant] = asset.nextSourceUrl;
  }

  for (const [, family] of sourceFamilies) {
    const familyAsset = proposedAssets.find((asset) => asset.family === family);
    const providerVersion = familyAsset
      ? providerVersionFromUrl(familyAsset.nextSourceUrl)
      : null;
    if (providerVersion) {
      manifest.source.versions[family] = providerVersion;
    }
  }

  manifest.approvedAt = new Date().toISOString().slice(0, 10);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Applied ${proposedAssets.length} assets and updated ${manifestPath}`);
}

function parseFontFaces(css) {
  const faces = [];
  const facePattern = /@font-face\s*{([^}]+)}/g;
  for (const match of css.matchAll(facePattern)) {
    const declarations = match[1];
    const family = declaration(declarations, 'font-family')?.replace(/^['"]|['"]$/g, '');
    const style = declaration(declarations, 'font-style');
    const weightValue = declaration(declarations, 'font-weight');
    const src = declaration(declarations, 'src');
    const unicodeRange = declaration(declarations, 'unicode-range');
    const url = src?.match(/url\(([^)]+)\)/)?.[1];
    if (!family || !style || !weightValue || !src || !unicodeRange || !url) {
      continue;
    }

    faces.push({
      family,
      style,
      weights: numbers(weightValue),
      subset: unicodeRange.includes('U+0100') ? 'latin-ext' : 'latin',
      url: url.replaceAll('"', '').replaceAll("'", ''),
    });
  }
  return faces;
}

function declaration(block, property) {
  return block.match(new RegExp(`${property}\\s*:\\s*([^;]+)`))?.[1].trim();
}

function numbers(value) {
  return [...value.matchAll(/\d+/g)].map((match) => Number(match[0]));
}

function sameNumbers(left, right) {
  return JSON.stringify([...new Set(left)].sort((a, b) => a - b)) ===
    JSON.stringify([...new Set(right)].sort((a, b) => a - b));
}

function groupFacesByUrl(faces) {
  const groups = new Map();
  for (const face of faces) {
    const group = groups.get(face.url) ?? { ...face, weights: [] };
    group.weights.push(...face.weights);
    groups.set(face.url, group);
  }
  return [...groups.values()];
}

function uniqueResponseMetadata(responses) {
  const unique = new Map();
  for (const response of responses) {
    const key = `${response.sourceUrl}\n${response.sha256}`;
    unique.set(key, {
      sourceUrl: response.sourceUrl,
      sha256: response.sha256,
    });
  }
  return [...unique.values()];
}

async function fetchText(url, userAgent) {
  const response = await fetch(url, {
    headers: {
      'user-agent': userAgent,
      accept: 'text/css',
    },
  });
  if (!response.ok) {
    fail(`CSS request failed (${response.status} ${response.statusText}): ${url}`);
  }
  return response.text();
}

async function fetchBytes(url, userAgent) {
  const response = await fetch(url, {
    headers: {
      'user-agent': userAgent,
      accept: 'font/woff2,application/octet-stream',
    },
  });
  if (!response.ok) {
    fail(`Font request failed (${response.status} ${response.statusText}): ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function slugify(value) {
  return value.toLowerCase().replaceAll(' ', '-');
}

function providerVersionFromUrl(url) {
  const pathVersion = url.match(/\/(v\d+)\//)?.[1];
  if (pathVersion) return pathVersion;
  const queryVersion = new URL(url).searchParams.get('v');
  return /^v\d+$/.test(queryVersion ?? '') ? queryVersion : null;
}

function fail(message) {
  console.error(`Font refresh failed: ${message}`);
  process.exit(1);
}