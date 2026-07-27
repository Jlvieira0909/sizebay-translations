import { flatten, isPlainObject } from './json';
import { detectLocaleCode } from './locales';
import type { FileError, JsonObject, LoadedLocale, LocaleOrigin } from './types';

export function isFileError(value: LoadedLocale | FileError): value is FileError {
  return 'message' in value;
}

/** Validates one file's text and flattens it once. Used by every load path. */
export function parseLocaleText(
  text: string,
  fileName: string,
  code: string,
  origin: LocaleOrigin,
): LoadedLocale | FileError {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Invalid JSON.';
    return { fileName, message: `Not valid JSON — ${detail}` };
  }

  if (!isPlainObject(parsed)) {
    return { fileName, message: 'The root of the file must be a JSON object.' };
  }

  const data = parsed as JsonObject;
  const flat = flatten(data);
  return { code, fileName, origin, data, flat, keyCount: Object.keys(flat).length };
}

/** Reads a file the user picked or dropped. */
export async function parseLocaleFile(file: File, fallbackCode?: string): Promise<LoadedLocale | FileError> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    return { fileName: file.name, message: 'The file could not be read. Try selecting it again.' };
  }

  // An unrecognised name still loads, under a provisional code the user can reassign.
  const provisional = (file.name.split(/[\\/]/).pop() ?? file.name).replace(/\.json$/i, '').slice(0, 12) || 'file';
  const code = detectLocaleCode(file.name) ?? fallbackCode ?? provisional;

  return parseLocaleText(text, file.name, code, 'upload');
}
