import type { LocaleGroup, LocaleMeta } from './types';

/**
 * Every code below comes from `languages.all_langs` inside the fitting room
 * translation files — that map is the widget's own registry, so it is the
 * source of truth for file names and for the `lang` parameter.
 *
 * Several codes are NOT ISO 639-1 (`br`, `cz`, `dk`, `gr`, `jp`, `vn`, `cn`,
 * `uk`). Keep them exactly as they are: renaming a file breaks the lookup.
 */
export const LOCALES: LocaleMeta[] = [
  // Portuguese & Spanish
  { code: 'br', name: 'Portuguese (Brazil)', native: 'Português', group: 'Portuguese & Spanish', note: 'Brazil is `br`, not `pt-BR`.' },
  { code: 'pt', name: 'Portuguese (Portugal)', native: 'Português', group: 'Portuguese & Spanish' },
  { code: 'es', name: 'Spanish', native: 'Español', group: 'Portuguese & Spanish' },
  { code: 'mx', name: 'Spanish (Mexico)', native: 'Español', group: 'Portuguese & Spanish' },
  { code: 'esAR', name: 'Spanish (Argentina)', native: 'Español', group: 'Portuguese & Spanish', note: 'Camel case matters: `esAR`.' },
  { code: 'esCT', name: 'Spanish (Castilian)', native: 'Español', group: 'Portuguese & Spanish', note: 'Camel case matters: `esCT`.' },

  // Western Europe
  { code: 'en', name: 'English', native: 'English', group: 'Western Europe' },
  { code: 'uk', name: 'English (UK)', native: 'English', group: 'Western Europe', note: '`uk` is British English. Ukrainian is `ukr`.' },
  { code: 'fr', name: 'French', native: 'Français', group: 'Western Europe' },
  { code: 'de', name: 'German', native: 'Deutsch', group: 'Western Europe' },
  { code: 'it', name: 'Italian', native: 'Italiano', group: 'Western Europe' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands', group: 'Western Europe' },
  { code: 'gr', name: 'Greek', native: 'Ελληνικά', group: 'Western Europe', note: 'Greek is `gr`, not `el`.' },

  // Nordics
  { code: 'sv', name: 'Swedish', native: 'Svenska', group: 'Nordics' },
  { code: 'no', name: 'Norwegian', native: 'Norsk', group: 'Nordics' },
  { code: 'dk', name: 'Danish', native: 'Dansk', group: 'Nordics', note: 'Danish is `dk`, not `da`.' },
  { code: 'fi', name: 'Finnish', native: 'Suomi', group: 'Nordics' },

  // Central & Eastern Europe
  { code: 'pl', name: 'Polish', native: 'Polski', group: 'Central & Eastern Europe' },
  { code: 'cz', name: 'Czech', native: 'Čeština', group: 'Central & Eastern Europe', note: 'Czech is `cz`, not `cs`.' },
  { code: 'sk', name: 'Slovak', native: 'Slovenčina', group: 'Central & Eastern Europe' },
  { code: 'sl', name: 'Slovenian', native: 'Slovenščina', group: 'Central & Eastern Europe' },
  { code: 'hu', name: 'Hungarian', native: 'Magyar', group: 'Central & Eastern Europe' },
  { code: 'ro', name: 'Romanian', native: 'Română', group: 'Central & Eastern Europe' },
  { code: 'bg', name: 'Bulgarian', native: 'Български', group: 'Central & Eastern Europe' },
  { code: 'hr', name: 'Croatian', native: 'Hrvatski', group: 'Central & Eastern Europe' },
  { code: 'sr', name: 'Serbian', native: 'Српски', group: 'Central & Eastern Europe' },
  { code: 'ru', name: 'Russian', native: 'Русский', group: 'Central & Eastern Europe' },
  { code: 'ukr', name: 'Ukrainian', native: 'Українська', group: 'Central & Eastern Europe', note: 'Ukrainian is `ukr`. `uk` is English.' },
  { code: 'lt', name: 'Lithuanian', native: 'Lietuvių', group: 'Central & Eastern Europe' },
  { code: 'lv', name: 'Latvian', native: 'Latviešu', group: 'Central & Eastern Europe' },
  { code: 'et', name: 'Estonian', native: 'Eesti', group: 'Central & Eastern Europe' },

  // Middle East
  { code: 'ar', name: 'Arabic', native: 'العربية', group: 'Middle East', rtl: true, note: 'Right to left.' },
  { code: 'he', name: 'Hebrew', native: 'עברית', group: 'Middle East', rtl: true, note: 'Right to left.' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', group: 'Middle East' },

  // Asia & Pacific
  { code: 'cn', name: 'Chinese', native: '中文', group: 'Asia & Pacific', note: 'Both `cn` and `zh` exist. Check which one the store loads.' },
  { code: 'zh', name: 'Chinese', native: '中文', group: 'Asia & Pacific', note: 'Both `cn` and `zh` exist. Check which one the store loads.' },
  { code: 'jp', name: 'Japanese', native: '日本語', group: 'Asia & Pacific', note: 'Japanese is `jp`, not `ja`.' },
  { code: 'ko', name: 'Korean', native: '한국어', group: 'Asia & Pacific' },
  { code: 'th', name: 'Thai', native: 'ไทย', group: 'Asia & Pacific' },
  { code: 'vn', name: 'Vietnamese', native: 'Tiếng Việt', group: 'Asia & Pacific', note: 'Vietnamese is `vn`, not `vi`.' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', group: 'Asia & Pacific' },
];

export const LOCALE_GROUPS: LocaleGroup[] = [
  'Portuguese & Spanish',
  'Western Europe',
  'Nordics',
  'Central & Eastern Europe',
  'Middle East',
  'Asia & Pacific',
  'Unlisted',
];

const BY_CODE = new Map(LOCALES.map((l) => [l.code, l]));
const BY_LOWER = new Map(LOCALES.map((l) => [l.code.toLowerCase(), l]));

/** Falls back to a placeholder entry so an unknown file never blocks the flow. */
export function localeMeta(code: string): LocaleMeta {
  return (
    BY_CODE.get(code) ??
    BY_LOWER.get(code.toLowerCase()) ?? {
      code,
      name: 'Unlisted code',
      native: code,
      group: 'Unlisted' as LocaleGroup,
      note: 'Not in the registry. Confirm the code before sending the file.',
    }
  );
}

export function isKnownLocale(code: string): boolean {
  return BY_CODE.has(code) || BY_LOWER.has(code.toLowerCase());
}

/** Registry order, used to keep columns and lists stable. */
export function localeRank(code: string): number {
  const index = LOCALES.findIndex((l) => l.code === code);
  return index === -1 ? LOCALES.length : index;
}

/**
 * Guesses the locale from a file name: `br.json`, `pt-BR.json`,
 * `translations.esAR.json`, `locales/vfr_de.json` all resolve.
 * Returns null when nothing is certain — the UI then asks.
 */
export function detectLocaleCode(fileName: string): string | null {
  const base = fileName.split(/[\\/]/).pop() ?? fileName;
  const stem = base.replace(/\.json$/i, '');

  const exact = BY_CODE.get(stem);
  if (exact) return exact.code;

  const lower = BY_LOWER.get(stem.toLowerCase());
  if (lower) return lower.code;

  // pt-BR, pt_br, en-US …
  const hyphen = stem.match(/^([a-z]{2})[-_]([a-z]{2})$/i);
  if (hyphen) {
    const region = BY_LOWER.get(hyphen[2].toLowerCase());
    if (region && region.code !== 'uk') return region.code;
    const language = BY_LOWER.get(hyphen[1].toLowerCase());
    if (language) return language.code;
  }

  // translations.esAR / vfr_de / messages-en
  const parts = stem.split(/[._\-\s]+/).filter(Boolean);
  for (const part of parts.reverse()) {
    const hit = BY_CODE.get(part) ?? BY_LOWER.get(part.toLowerCase());
    if (hit) return hit.code;
  }

  return null;
}
