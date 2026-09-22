import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fontsDirectory = join(packageRoot, 'public', 'fonts');
const manifestPath = join(fontsDirectory, 'font-manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const errors = [];

function addError(message) {
  errors.push(message);
}

if (manifest.manifestVersion !== 1) {
  addError(`unsupported manifestVersion: ${String(manifest.manifestVersion)}`);
}

if (!manifest.source?.cssApi?.instrumentSerif || !manifest.source?.cssApi?.outfit) {
  addError('source.cssApi must include the Instrument Serif and Outfit CSS2 URLs');
}

if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
  addError('files must be a non-empty array');
}

const approvedFiles = Array.isArray(manifest.files) ? manifest.files : [];
const approvedNames = approvedFiles.map((asset) => asset.file);
const duplicateNames = approvedNames.filter((name, index) => approvedNames.indexOf(name) !== index);

for (const duplicateName of new Set(duplicateNames)) {
  addError(`duplicate manifest entry: ${duplicateName}`);
}

for (const asset of approvedFiles) {
  if (!asset.file || !/^[a-z0-9-]+\.woff2$/.test(asset.file)) {
    addError(`invalid font filename: ${String(asset.file)}`);
    continue;
  }

  if (!asset.family || !['normal', 'italic'].includes(asset.style)) {
    addError(`${asset.file} must declare family and normal/italic style`);
  }

  if (
    !Array.isArray(asset.weights) ||
    asset.weights.length === 0 ||
    asset.weights.some((weight) => !Number.isInteger(weight) || weight < 1 || weight > 1000)
  ) {
    addError(`${asset.file} must declare one or more integer font weights`);
  }

  if (!['desktop', 'mobile'].includes(asset.variant)) {
    addError(`${asset.file} must declare a desktop or mobile variant`);
  }

  if (!['latin', 'latin-ext'].includes(asset.subset)) {
    addError(`${asset.file} must declare a latin or latin-ext subset`);
  }

  if (!/^[a-f0-9]{64}$/.test(asset.sha256)) {
    addError(`${asset.file} must declare a lowercase SHA-256 hash`);
  }

  const assetPath = join(fontsDirectory, asset.file);
  if (!statExists(assetPath)) {
    addError(`missing approved font: ${asset.file}`);
    continue;
  }

  const actualHash = createHash('sha256').update(readFileSync(assetPath)).digest('hex');
  if (actualHash !== asset.sha256) {
    addError(`hash mismatch for ${asset.file}: expected ${asset.sha256}, got ${actualHash}`);
  }
}

const directoryEntries = readdirSync(fontsDirectory, { withFileTypes: true });
const actualAssets = directoryEntries
  .filter((entry) => entry.name !== 'font-manifest.json')
  .map((entry) => entry.name)
  .sort();
const expectedAssets = [...new Set(approvedNames)].sort();

for (const missing of expectedAssets.filter((name) => !actualAssets.includes(name))) {
  addError(`manifest asset is not present in the fonts directory: ${missing}`);
}
for (const unexpected of actualAssets.filter((name) => !expectedAssets.includes(name))) {
  addError(`unexpected file in the fonts directory: ${unexpected}`);
}

const cssPath = join(packageRoot, manifest.css || 'src/index.css');
if (!statExists(cssPath)) {
  addError(`CSS file from manifest does not exist: ${manifest.css}`);
} else {
  const css = readFileSync(cssPath, 'utf8');
  const cssAssets = [
    ...css.matchAll(/url\(\s*['"]?\/fonts\/([^'")\s]+)['"]?\s*\)/g),
  ]
    .map((match) => match[1])
    .sort();
  const cssAssetNames = [...new Set(cssAssets)];

  for (const missingFromCss of expectedAssets.filter((name) => !cssAssetNames.includes(name))) {
    addError(`manifest asset is not referenced by ${manifest.css}: ${missingFromCss}`);
  }
  for (const untrackedCssAsset of cssAssetNames.filter((name) => !expectedAssets.includes(name))) {
    addError(`${manifest.css} references an untracked font asset: ${untrackedCssAsset}`);
  }

  validateCssFontFaces(css, manifest.css, approvedFiles, addError);
}

if (errors.length > 0) {
  console.error('Font asset validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Font asset validation passed: ${approvedFiles.length} approved WOFF2 files`);
}

function statExists(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function validateCssFontFaces(css, cssPath, approvedFiles, reportError) {
  const mediaRanges = findMediaRanges(css);
  const declarations = [];
  const fontFacePattern = /@font-face\s*\{/g;

  for (const match of css.matchAll(fontFacePattern)) {
    const openingBrace = css.indexOf('{', match.index);
    const closingBrace = findMatchingBrace(css, openingBrace);
    const line = css.slice(0, match.index).split('\n').length;

    if (closingBrace === -1) {
      reportError(`${cssPath}:${line} has an unterminated @font-face declaration`);
      continue;
    }

    declarations.push({
      body: css.slice(openingBrace + 1, closingBrace),
      line,
      variant: responsiveVariantFor(match.index, mediaRanges),
    });
  }

  for (const declaration of declarations) {
    const properties = parseFontFaceProperties(declaration.body);
    const file = extractFontFile(properties.src);

    if (!file) {
      reportError(`${cssPath}:${declaration.line} @font-face must reference a /fonts/*.woff2 asset`);
      continue;
    }

    const asset = approvedFiles.find((candidate) => candidate.file === file);
    if (!asset) {
      continue;
    }

    compareFontProperty({
      declaration,
      cssPath,
      file,
      property: 'font-family',
      actual: properties.fontFamily,
      expected: asset.family,
      reportError,
    });
    compareFontProperty({
      declaration,
      cssPath,
      file,
      property: 'font-style',
      actual: properties.fontStyle,
      expected: asset.style,
      reportError,
    });

    const weight = parseCssWeight(properties.fontWeight);
    if (weight === null) {
      reportError(`${cssPath}:${declaration.line} @font-face for ${file} must declare an integer font-weight`);
    } else if (!Array.isArray(asset.weights) || !asset.weights.includes(weight)) {
      const expectedWeights = Array.isArray(asset.weights) ? asset.weights.join(', ') : 'the manifest weights';
      reportError(
        `${cssPath}:${declaration.line} @font-face for ${file} has font-weight ${weight}; ` +
          `expected one of [${expectedWeights}] from the manifest`,
      );
    }

    const subset = subsetFromUnicodeRange(properties.unicodeRange);
    if (!subset) {
      reportError(
        `${cssPath}:${declaration.line} @font-face for ${file} has an unrecognized unicode-range; ` +
          `expected the manifest ${asset.subset} subset`,
      );
    } else if (subset !== asset.subset) {
      reportError(
        `${cssPath}:${declaration.line} @font-face for ${file} has subset ${subset}; ` +
          `expected ${asset.subset} from the manifest`,
      );
    }

    if (declaration.variant !== asset.variant) {
      reportError(
        `${cssPath}:${declaration.line} @font-face for ${file} is in the ${declaration.variant} responsive variant; ` +
          `expected ${asset.variant} from the manifest`,
      );
    }
  }
}

function parseFontFaceProperties(body) {
  const uncommentedBody = body.replace(/\/\*[\s\S]*?\*\//g, '');

  return {
    fontFamily: readCssProperty(uncommentedBody, 'font-family'),
    fontStyle: readCssProperty(uncommentedBody, 'font-style'),
    fontWeight: readCssProperty(uncommentedBody, 'font-weight'),
    src: readCssProperty(uncommentedBody, 'src'),
    unicodeRange: readCssProperty(uncommentedBody, 'unicode-range'),
  };
}

function readCssProperty(body, property) {
  const propertyPattern = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, 'i');
  const match = body.match(propertyPattern);
  if (!match) {
    return null;
  }

  return match[1].trim().replace(/^(['"])(.*)\1$/, '$2');
}

function extractFontFile(src) {
  if (!src) {
    return null;
  }

  const match = src.match(/url\(\s*['"]?\/fonts\/([^'")\s]+)['"]?\s*\)/i);
  return match?.[1] ?? null;
}

function parseCssWeight(value) {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const weight = Number(value);
  return Number.isInteger(weight) && weight >= 1 && weight <= 1000 ? weight : null;
}

function subsetFromUnicodeRange(value) {
  if (!value) {
    return null;
  }

  const hasLatinExtMarker = /U\+0100-02BA\b/i.test(value);
  const hasLatinMarker = /U\+0000-00FF\b/i.test(value);

  if (hasLatinExtMarker === hasLatinMarker) {
    return null;
  }

  return hasLatinExtMarker ? 'latin-ext' : 'latin';
}

function compareFontProperty({ declaration, cssPath, file, property, actual, expected, reportError }) {
  if (actual === null) {
    reportError(`${cssPath}:${declaration.line} @font-face for ${file} is missing ${property}; expected ${expected}`);
  } else if (actual !== expected) {
    reportError(
      `${cssPath}:${declaration.line} @font-face for ${file} has ${property} ${JSON.stringify(actual)}; ` +
        `expected ${JSON.stringify(expected)} from the manifest`,
    );
  }
}

function findMediaRanges(css) {
  const ranges = [];
  const mediaPattern = /@media\b[^{]*\{/gi;

  for (const match of css.matchAll(mediaPattern)) {
    const openingBrace = css.indexOf('{', match.index);
    const closingBrace = findMatchingBrace(css, openingBrace);
    if (closingBrace !== -1) {
      const header = match[0].slice(0, match[0].lastIndexOf('{'));
      ranges.push({ header, openingBrace, closingBrace });
    }
  }

  return ranges;
}

function responsiveVariantFor(position, mediaRanges) {
  const enclosingMedia = mediaRanges.filter(
    ({ openingBrace, closingBrace }) => position > openingBrace && position < closingBrace,
  );

  if (enclosingMedia.length === 0) {
    return 'desktop';
  }

  if (
    enclosingMedia.every(({ header }) => /max-width\s*:\s*767px/i.test(header))
  ) {
    return 'mobile';
  }

  return 'unknown';
}

function findMatchingBrace(source, openingBrace) {
  if (openingBrace === -1) {
    return -1;
  }

  let depth = 0;
  let quote = null;
  let inComment = false;

  for (let index = openingBrace; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (inComment) {
      if (character === '*' && nextCharacter === '/') {
        inComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (character === '\\') {
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '/' && nextCharacter === '*') {
      inComment = true;
      index += 1;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '{') {
      depth += 1;
    } else if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}