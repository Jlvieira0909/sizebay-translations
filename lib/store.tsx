"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import type { Dispatch, ReactNode } from "react";
import { toEntry } from "./json";
import { localeRank } from "./locales";
import type {
  ChangeRecord,
  EditMap,
  Entry,
  FileError,
  LoadedLocale,
} from "./types";

export interface SectionSummary {
  name: string;
  count: number;
  changed: number;
}

export type SourceMode = "choose" | "standard" | "upload";

interface State {
  step: "setup" | "editor";
  source: SourceMode;
  selected: string[];
  loaded: Record<string, LoadedLocale>;
  edits: EditMap;
  errors: FileError[];
}

type Action =
  | { type: "set-source"; source: SourceMode }
  | { type: "toggle-locale"; code: string }
  | { type: "select-locales"; codes: string[] }
  | { type: "clear-locales" }
  | { type: "pin-locale"; code: string }
  | { type: "add-file"; file: LoadedLocale }
  | { type: "remove-file"; code: string }
  | { type: "reassign-file"; from: string; to: string }
  | { type: "add-error"; error: FileError }
  | { type: "clear-errors" }
  | { type: "set-step"; step: State["step"] }
  | {
      type: "set-value";
      code: string;
      path: string;
      value: string;
      original: string;
    }
  | { type: "revert-value"; code: string; path: string }
  | { type: "revert-path"; path: string }
  | { type: "revert-locale"; code: string }
  | { type: "revert-all" };

const initialState: State = {
  step: "setup",
  source: "choose",
  selected: [],
  loaded: {},
  edits: {},
  errors: [],
};

function withoutKey<T extends Record<string, unknown>>(
  source: T,
  key: string
): T {
  const next = { ...source };
  delete next[key];
  return next;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "set-source":
      return { ...state, source: action.source, errors: [] };

    case "toggle-locale": {
      const selected = state.selected.includes(action.code)
        ? state.selected.filter((code) => code !== action.code)
        : [...state.selected, action.code];
      return { ...state, selected };
    }

    case "select-locales": {
      const merged = [...state.selected];
      for (const code of action.codes)
        if (!merged.includes(code)) merged.push(code);
      return { ...state, selected: merged };
    }

    case "clear-locales":
      return { ...state, selected: [] };

    case "pin-locale":
      return {
        ...state,
        selected: [
          action.code,
          ...state.selected.filter((code) => code !== action.code),
        ],
      };

    case "add-file": {
      const selected = state.selected.includes(action.file.code)
        ? state.selected
        : [...state.selected, action.file.code];
      return {
        ...state,
        selected,
        loaded: { ...state.loaded, [action.file.code]: action.file },
        errors: state.errors.filter(
          (error) => error.fileName !== action.file.fileName
        ),
      };
    }

    case "remove-file":
      return {
        ...state,
        loaded: withoutKey(state.loaded, action.code),
        edits: withoutKey(state.edits, action.code),
      };

    case "reassign-file": {
      const file = state.loaded[action.from];
      if (!file || action.from === action.to) return state;
      const loaded = withoutKey(state.loaded, action.from);
      loaded[action.to] = { ...file, code: action.to };
      const selected = state.selected.map((code) =>
        code === action.from ? action.to : code
      );
      const edits = withoutKey(state.edits, action.from);
      if (state.edits[action.from]) edits[action.to] = state.edits[action.from];
      return { ...state, loaded, selected: [...new Set(selected)], edits };
    }

    case "add-error":
      return {
        ...state,
        errors: [
          ...state.errors.filter(
            (error) => error.fileName !== action.error.fileName
          ),
          action.error,
        ],
      };

    case "clear-errors":
      return { ...state, errors: [] };

    case "set-step":
      return { ...state, step: action.step };

    case "set-value": {
      const localeEdits = { ...(state.edits[action.code] ?? {}) };
      if (action.value === action.original) delete localeEdits[action.path];
      else localeEdits[action.path] = action.value;

      const edits = { ...state.edits };
      if (Object.keys(localeEdits).length === 0) delete edits[action.code];
      else edits[action.code] = localeEdits;

      return { ...state, edits };
    }

    case "revert-value": {
      const localeEdits = state.edits[action.code];
      if (!localeEdits || !(action.path in localeEdits)) return state;
      const next = withoutKey(localeEdits, action.path);
      const edits = { ...state.edits };
      if (Object.keys(next).length === 0) delete edits[action.code];
      else edits[action.code] = next;
      return { ...state, edits };
    }

    case "revert-path": {
      const edits: EditMap = {};
      for (const [code, paths] of Object.entries(state.edits)) {
        const next = withoutKey(paths, action.path);
        if (Object.keys(next).length) edits[code] = next;
      }
      return { ...state, edits };
    }

    case "revert-locale":
      return { ...state, edits: withoutKey(state.edits, action.code) };

    case "revert-all":
      return { ...state, edits: {} };

    default:
      return state;
  }
}

interface TranslatorContextValue {
  state: State;
  dispatch: Dispatch<Action>;
  activeLocales: string[];
  loadedCodes: string[];
  awaitingCodes: string[];
  entries: Entry[];
  sections: SectionSummary[];
  changeCount: number;
  changedLocales: string[];
  changes: ChangeRecord[];
  originalOf: (code: string, path: string) => string | undefined;
  valueOf: (code: string, path: string) => string;
  isChanged: (code: string, path: string) => boolean;
}

const TranslatorContext = createContext<TranslatorContextValue | null>(null);

export function TranslatorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const activeLocales = useMemo(
    () => state.selected.filter((code) => Boolean(state.loaded[code])),
    [state.selected, state.loaded]
  );

  const loadedCodes = useMemo(
    () =>
      Object.keys(state.loaded).sort((a, b) => localeRank(a) - localeRank(b)),
    [state.loaded]
  );

  const awaitingCodes = useMemo(
    () => state.selected.filter((code) => !state.loaded[code]),
    [state.selected, state.loaded]
  );

  const entries = useMemo(() => {
    const seen = new Set<string>();
    const list: Entry[] = [];
    for (const code of activeLocales) {
      const file = state.loaded[code];
      if (!file) continue;
      for (const path of Object.keys(file.flat)) {
        if (seen.has(path)) continue;
        seen.add(path);
        list.push(toEntry(path));
      }
    }
    return list;
  }, [activeLocales, state.loaded]);

  const changes = useMemo(() => {
    const list: ChangeRecord[] = [];
    for (const code of Object.keys(state.edits)) {
      const file = state.loaded[code];
      for (const [path, after] of Object.entries(state.edits[code] ?? {})) {
        list.push({
          locale: code,
          path,
          before: file?.flat[path] ?? "",
          after,
        });
      }
    }
    return list.sort(
      (a, b) =>
        a.path.localeCompare(b.path) ||
        localeRank(a.locale) - localeRank(b.locale)
    );
  }, [state.edits, state.loaded]);

  const sections = useMemo(() => {
    const map = new Map<string, SectionSummary>();
    for (const entry of entries) {
      const current = map.get(entry.section) ?? {
        name: entry.section,
        count: 0,
        changed: 0,
      };
      current.count += 1;
      map.set(entry.section, current);
    }
    for (const change of changes) {
      const section = change.path.split(".")[0];
      const current = map.get(section);
      if (current) current.changed += 1;
    }
    return [...map.values()];
  }, [entries, changes]);

  const value = useMemo<TranslatorContextValue>(() => {
    const originalOf = (code: string, path: string) =>
      state.loaded[code]?.flat[path];
    const valueOf = (code: string, path: string) =>
      state.edits[code]?.[path] ?? originalOf(code, path) ?? "";
    const isChanged = (code: string, path: string) =>
      state.edits[code]?.[path] !== undefined;

    return {
      state,
      dispatch,
      activeLocales,
      loadedCodes,
      awaitingCodes,
      entries,
      sections,
      changeCount: changes.length,
      changedLocales: [...new Set(changes.map((change) => change.locale))].sort(
        (a, b) => localeRank(a) - localeRank(b)
      ),
      changes,
      originalOf,
      valueOf,
      isChanged,
    };
  }, [
    state,
    activeLocales,
    loadedCodes,
    awaitingCodes,
    entries,
    sections,
    changes,
  ]);

  useEffect(() => {
    if (changes.length === 0) return undefined;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changes.length]);

  return (
    <TranslatorContext.Provider value={value}>
      {children}
    </TranslatorContext.Provider>
  );
}

export function useTranslator(): TranslatorContextValue {
  const context = useContext(TranslatorContext);
  if (!context)
    throw new Error("useTranslator must be used inside <TranslatorProvider>.");
  return context;
}
