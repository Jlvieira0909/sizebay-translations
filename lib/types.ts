export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export type LocaleGroup =
  | 'Portuguese & Spanish'
  | 'Western Europe'
  | 'Nordics'
  | 'Central & Eastern Europe'
  | 'Middle East'
  | 'Asia & Pacific'
  | 'Unlisted';

export interface LocaleMeta {
  /** The exact code Sizebay uses for the file / `lang` param. Case sensitive. */
  code: string;
  /** Language name in English. */
  name: string;
  /** How the language calls itself, for when the text is only recognisable in it. */
  native: string;
  group: LocaleGroup;
  rtl?: boolean;
  /** Shown in the picker when the code is easy to confuse or non-standard. */
  note?: string;
}

export type LocaleOrigin = 'standard' | 'upload';

export interface LoadedLocale {
  code: string;
  fileName: string;
  /** Whether it came from public/locales or from a file the user chose. */
  origin: LocaleOrigin;
  /** Parsed file, never mutated. Edits live separately. */
  data: JsonObject;
  /** Flattened once at load: `path -> text`. */
  flat: Record<string, string>;
  keyCount: number;
}

export interface FileError {
  fileName: string;
  message: string;
}

export interface Entry {
  /** Full dotted path, e.g. `footer.add_to_cart`. */
  path: string;
  /** First segment, used for the section rail. */
  section: string;
  /** Last segment, used as the visible label. */
  leaf: string;
  /** Middle segments, e.g. `shoe_accessory › no_recommendation`. */
  middle: string[];
}

/** locale code -> path -> new value */
export type EditMap = Record<string, Record<string, string>>;

export interface ChangeRecord {
  locale: string;
  path: string;
  before: string;
  after: string;
}
