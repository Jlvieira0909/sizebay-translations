export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export type LocaleGroup =
  | "Portuguese & Spanish"
  | "Western Europe"
  | "Nordics"
  | "Central & Eastern Europe"
  | "Middle East"
  | "Asia & Pacific"
  | "Unlisted";

export interface LocaleMeta {
  code: string;
  name: string;
  native: string;
  group: LocaleGroup;
  rtl?: boolean;
  note?: string;
}

export type LocaleOrigin = "standard" | "upload";

export interface LoadedLocale {
  code: string;
  fileName: string;
  origin: LocaleOrigin;
  data: JsonObject;
  flat: Record<string, string>;
  keyCount: number;
}

export interface FileError {
  fileName: string;
  message: string;
}

export interface Entry {
  path: string;
  section: string;
  leaf: string;
  middle: string[];
}

export type EditMap = Record<string, Record<string, string>>;

export interface ChangeRecord {
  locale: string;
  path: string;
  before: string;
  after: string;
}
