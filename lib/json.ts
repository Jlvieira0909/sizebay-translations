import type { Entry, JsonObject, JsonValue } from "./types";

export function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function flatten(
  input: JsonValue,
  prefix = "",
  out: Record<string, string> = {}
): Record<string, string> {
  if (isPlainObject(input)) {
    for (const [key, value] of Object.entries(input)) {
      flatten(value, prefix ? `${prefix}.${key}` : key, out);
    }
  } else if (Array.isArray(input)) {
    input.forEach((value, index) =>
      flatten(value, prefix ? `${prefix}.${index}` : String(index), out)
    );
  } else if (prefix) {
    out[prefix] = input === null ? "" : String(input);
  }
  return out;
}

export function toEntry(path: string): Entry {
  const segments = path.split(".");
  return {
    path,
    section: segments[0] ?? path,
    leaf: segments[segments.length - 1] ?? path,
    middle: segments.slice(1, -1),
  };
}

export function getAtPath(
  root: JsonValue,
  path: string
): JsonValue | undefined {
  let current: JsonValue | undefined = root;
  for (const segment of path.split(".")) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      current = Number.isInteger(index) ? current[index] : undefined;
    } else if (isPlainObject(current)) {
      current = current[segment];
    } else {
      return undefined;
    }
    if (current === undefined) return undefined;
  }
  return current;
}

export function setAtPath(
  root: JsonObject,
  path: string,
  value: JsonValue
): void {
  const segments = path.split(".");
  let current: JsonObject | JsonValue[] = root;

  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!isPlainObject(current[index]) && !Array.isArray(current[index]))
        current[index] = {};
      current = current[index] as JsonObject | JsonValue[];
    } else {
      const next = current[segment];
      if (!isPlainObject(next) && !Array.isArray(next)) current[segment] = {};
      current = current[segment] as JsonObject | JsonValue[];
    }
  }

  const last = segments[segments.length - 1];
  if (Array.isArray(current)) {
    const index = Number(last);
    if (Number.isInteger(index)) current[index] = value;
  } else {
    current[last] = value;
  }
}

function coerceLike(original: JsonValue | undefined, next: string): JsonValue {
  if (typeof original === "number") {
    const parsed = Number(next);
    return next.trim() !== "" && Number.isFinite(parsed) ? parsed : next;
  }
  if (typeof original === "boolean") {
    if (next === "true") return true;
    if (next === "false") return false;
    return next;
  }
  return next;
}

export function applyEdits(
  base: JsonObject,
  edits: Record<string, string> | undefined
): JsonObject {
  const next = clone(base);
  if (!edits) return next;
  for (const [path, value] of Object.entries(edits)) {
    setAtPath(next, path, coerceLike(getAtPath(base, path), value));
  }
  return next;
}

export function serialize(data: JsonObject): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

const PLACEHOLDER = /\{\{\s*([^{}]+?)\s*\}\}/g;
const TAG = /<\s*([a-z][a-z0-9]*)\b/gi;

export function placeholders(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(PLACEHOLDER)) found.add(match[1].trim());
  return [...found].sort();
}

export function tags(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(TAG)) found.add(match[1].toLowerCase());
  return [...found].sort();
}

export function hasMarkup(text: string): boolean {
  return /<\s*[a-z][a-z0-9]*\b/i.test(text);
}

export interface ValueIssue {
  kind: "missing-placeholder" | "extra-placeholder" | "missing-tag" | "empty";
  tokens: string[];
}

export function inspectValue(original: string, next: string): ValueIssue[] {
  const issues: ValueIssue[] = [];
  if (original.trim() !== "" && next.trim() === "") {
    issues.push({ kind: "empty", tokens: [] });
    return issues;
  }

  const before = placeholders(original);
  const after = placeholders(next);
  const missing = before.filter((token) => !after.includes(token));
  const extra = after.filter((token) => !before.includes(token));
  if (missing.length)
    issues.push({ kind: "missing-placeholder", tokens: missing });
  if (extra.length) issues.push({ kind: "extra-placeholder", tokens: extra });

  const beforeTags = tags(original);
  const afterTags = tags(next);
  const missingTags = beforeTags.filter((tag) => !afterTags.includes(tag));
  if (missingTags.length)
    issues.push({ kind: "missing-tag", tokens: missingTags });

  return issues;
}
