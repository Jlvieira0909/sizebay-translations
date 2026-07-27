/**
 * The whole point of this screen: you know the text as "the 'Añadir a la cesta'
 * button", not as `footer.add_to_cart`. So the query is matched against the key
 * path AND against the current text of every loaded language, ignoring accents,
 * case, markup and placeholders.
 */

const DIACRITICS = /[\u0300-\u036f]/g;
const MARKUP = /<[^>]*>/g;
const ENTITY = /&[a-z]+;|&#\d+;/gi;
const CURLY = /\{\{\s*([^{}]*?)\s*\}\}/g;
const NOISE = /[^\p{L}\p{N}\s._-]/gu;

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(MARKUP, ' ')
    .replace(ENTITY, ' ')
    .replace(CURLY, ' $1 ')
    .toLowerCase()
    .replace(NOISE, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Key paths read better as words: `footer.add_to_cart` → `footer add to cart`. */
export function normalizePath(path: string): string {
  return path.replace(/[._-]+/g, ' ').toLowerCase();
}

export interface SearchTarget {
  path: string;
  /** locale code -> current value (edited when edited, original otherwise) */
  values: Record<string, string>;
}

export interface SearchHit {
  path: string;
  score: number;
  /** Locales whose text matched, so the row can say where it came from. */
  matchedIn: string[];
}

export interface SearchIndexRow {
  path: string;
  pathHaystack: string;
  rawPath: string;
  values: { code: string; haystack: string; tokens: Set<string> }[];
}

export function buildIndex(targets: SearchTarget[]): SearchIndexRow[] {
  return targets.map((target) => ({
    path: target.path,
    rawPath: target.path.toLowerCase(),
    pathHaystack: normalizePath(target.path),
    values: Object.entries(target.values).map(([code, value]) => {
      const haystack = normalize(value);
      return { code, haystack, tokens: new Set(haystack.split(' ').filter(Boolean)) };
    }),
  }));
}

const MAX_HITS = 80;

export function search(index: SearchIndexRow[], query: string): SearchHit[] {
  const phrase = normalize(query);
  if (phrase.length < 2) return [];

  const tokens = phrase.split(' ').filter((token) => token.length > 1);
  const rawQuery = query.trim().toLowerCase();
  const looksLikePath = /[.]/.test(rawQuery) && !/\s/.test(rawQuery);
  const hits: SearchHit[] = [];

  for (const row of index) {
    let score = 0;
    const matchedIn: string[] = [];

    if (looksLikePath && row.rawPath.includes(rawQuery)) score += 220;
    if (row.pathHaystack.includes(phrase)) score += row.pathHaystack === phrase ? 200 : 120;

    for (const value of row.values) {
      if (!value.haystack) continue;
      let valueScore = 0;

      if (value.haystack === phrase) valueScore += 300;
      else if (value.haystack.includes(phrase)) valueScore += value.haystack.startsWith(phrase) ? 220 : 180;

      if (!valueScore && tokens.length > 1) {
        // A remembered or rewritten sentence rarely matches exactly. Reward overlap instead.
        const present = tokens.filter((token) => value.tokens.has(token)).length;
        const ratio = present / tokens.length;
        if (ratio >= 0.5) valueScore += Math.round(ratio * 120);
      }

      if (valueScore > 0) {
        matchedIn.push(value.code);
        score += valueScore;
      }
    }

    if (!score && tokens.length > 0) {
      // Last resort: all words appear somewhere in the row, in any order.
      const combined = `${row.pathHaystack} ${row.values.map((value) => value.haystack).join(' ')}`;
      if (tokens.every((token) => combined.includes(token))) score += 40;
    }

    if (score > 0) hits.push({ path: row.path, score, matchedIn });
  }

  hits.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  return hits.slice(0, MAX_HITS);
}
