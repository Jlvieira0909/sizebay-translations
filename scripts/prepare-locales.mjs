#!/usr/bin/env node
/**
 * Installs the standard fitting room texts so the app can start without anyone
 * uploading a file.
 *
 *   node scripts/prepare-locales.mjs ~/sizebay/locales
 *
 * Reads every .json in that folder (one level of subfolders included), checks it
 * parses, works out the language from the file name, copies it into
 * public/locales/<code>.json and writes public/locales/manifest.json.
 *
 * Safe to re-run: it overwrites what it recognises and leaves everything else
 * alone. Nothing in the source folder is modified.
 */

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';

/** Same registry the app uses — see lib/locales.ts. Codes are case sensitive. */
const CODES = [
  'br', 'pt', 'es', 'mx', 'esAR', 'esCT', 'en', 'uk', 'fr', 'de', 'it', 'nl', 'gr',
  'sv', 'no', 'dk', 'fi', 'pl', 'cz', 'sk', 'sl', 'hu', 'ro', 'bg', 'hr', 'sr',
  'ru', 'ukr', 'lt', 'lv', 'et', 'ar', 'he', 'tr', 'cn', 'zh', 'jp', 'ko', 'th',
  'vn', 'id',
];

const BY_CODE = new Map(CODES.map((code) => [code, code]));
const BY_LOWER = new Map(CODES.map((code) => [code.toLowerCase(), code]));

function detectCode(fileName) {
  const stem = basename(fileName, extname(fileName));

  if (BY_CODE.has(stem)) return BY_CODE.get(stem);
  if (BY_LOWER.has(stem.toLowerCase())) return BY_LOWER.get(stem.toLowerCase());

  const hyphen = stem.match(/^([a-z]{2})[-_]([a-z]{2})$/i);
  if (hyphen) {
    const region = BY_LOWER.get(hyphen[2].toLowerCase());
    if (region && region !== 'uk') return region;
    const language = BY_LOWER.get(hyphen[1].toLowerCase());
    if (language) return language;
  }

  for (const part of stem.split(/[._\-\s]+/).filter(Boolean).reverse()) {
    if (BY_CODE.has(part)) return BY_CODE.get(part);
    if (BY_LOWER.has(part.toLowerCase())) return BY_LOWER.get(part.toLowerCase());
  }

  return null;
}

function countLeaves(value) {
  if (Array.isArray(value)) return value.reduce((total, item) => total + countLeaves(item), 0);
  if (value && typeof value === 'object') {
    return Object.values(value).reduce((total, item) => total + countLeaves(item), 0);
  }
  return 1;
}

async function collect(dir, depth = 0) {
  const found = [];
  let items;
  try {
    items = await readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const item of items) {
    const path = join(dir, item.name);
    if (item.isDirectory() && depth < 1) found.push(...(await collect(path, depth + 1)));
    else if (item.isFile() && /\.json$/i.test(item.name)) found.push(path);
  }
  return found;
}

const source = process.argv[2];
if (!source) {
  console.error('Usage: node scripts/prepare-locales.mjs <folder with the .json files>');
  process.exit(1);
}

const sourceDir = resolve(source);
const targetDir = resolve(process.cwd(), 'public/locales');
const files = await collect(sourceDir);

if (files.length === 0) {
  console.error(`No .json files found in ${sourceDir}`);
  process.exit(1);
}

await mkdir(targetDir, { recursive: true });

const locales = [];
const skipped = [];
const claimed = new Map();

for (const path of files.sort()) {
  const name = basename(path);
  if (name === 'manifest.json') continue;

  const code = detectCode(name);
  if (!code) {
    skipped.push([name, 'no language code in the file name']);
    continue;
  }

  const text = await readFile(path, 'utf8');
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    skipped.push([name, `invalid JSON — ${error.message}`]);
    continue;
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    skipped.push([name, 'the root must be a JSON object']);
    continue;
  }

  if (claimed.has(code)) {
    skipped.push([name, `${code} already taken by ${claimed.get(code)}`]);
    continue;
  }
  claimed.set(code, name);

  await writeFile(join(targetDir, `${code}.json`), text, 'utf8');
  locales.push({ code, file: `${code}.json`, keys: countLeaves(data) });
}

locales.sort((a, b) => CODES.indexOf(a.code) - CODES.indexOf(b.code));

await writeFile(
  join(targetDir, 'manifest.json'),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), locales }, null, 2)}\n`,
  'utf8',
);

const keyCounts = new Set(locales.map((locale) => locale.keys));

console.log(`\npublic/locales — ${locales.length} language${locales.length === 1 ? '' : 's'} installed\n`);
for (const locale of locales) {
  console.log(`  ${locale.code.padEnd(6)} ${String(locale.keys).padStart(5)} texts   ${locale.file}`);
}

if (keyCounts.size > 1) {
  console.log(
    `\n  note: the files do not all have the same number of texts (${[...keyCounts]
      .sort((a, b) => a - b)
      .join(', ')}).`,
  );
  console.log('  That is fine — missing keys show up in the editor with a dashed border.');
}

if (skipped.length) {
  console.log(`\nSkipped ${skipped.length}:`);
  for (const [name, reason] of skipped) console.log(`  ${name} — ${reason}`);
  console.log('\nRename those to the language code (br.json, esAR.json) and run this again.');
}

console.log('');
