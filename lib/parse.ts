import { flatten, isPlainObject } from "./json";
import { detectLocaleCode } from "./locales";
import type {
  FileError,
  JsonObject,
  LoadedLocale,
  LocaleOrigin,
} from "./types";

export function isFileError(
  value: LoadedLocale | FileError
): value is FileError {
  return "message" in value;
}

export function parseLocaleText(
  text: string,
  fileName: string,
  code: string,
  origin: LocaleOrigin
): LoadedLocale | FileError {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Invalid JSON.";
    return { fileName, message: `Not valid JSON — ${detail}` };
  }

  if (!isPlainObject(parsed)) {
    return { fileName, message: "The root of the file must be a JSON object." };
  }

  const data = parsed as JsonObject;
  const flat = flatten(data);
  return {
    code,
    fileName,
    origin,
    data,
    flat,
    keyCount: Object.keys(flat).length,
  };
}

export async function parseLocaleFile(
  file: File,
  fallbackCode?: string
): Promise<LoadedLocale | FileError> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    return {
      fileName: file.name,
      message: "The file could not be read. Try selecting it again.",
    };
  }

  const provisional =
    (file.name.split(/[\\/]/).pop() ?? file.name)
      .replace(/\.json$/i, "")
      .slice(0, 12) || "file";
  const code = detectLocaleCode(file.name) ?? fallbackCode ?? provisional;

  return parseLocaleText(text, file.name, code, "upload");
}
