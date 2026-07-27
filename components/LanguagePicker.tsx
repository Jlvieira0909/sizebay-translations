"use client";

import { useMemo, useState } from "react";
import { LOCALES, LOCALE_GROUPS, localeMeta } from "@/lib/locales";
import { normalize } from "@/lib/search";
import { useTranslator } from "@/lib/store";
import type { LocaleGroup, LocaleMeta } from "@/lib/types";
import { AlertIcon, CheckIcon } from "./Icons";

const SHORTCUTS: { label: string; codes: string[] }[] = [
  { label: "BR + EN + ES", codes: ["br", "en", "es"] },
  { label: "All Spanish", codes: ["es", "mx", "esAR", "esCT"] },
  { label: "Western Europe", codes: ["en", "fr", "de", "it", "nl", "pt"] },
];

interface LanguagePickerProps {
  available?: Set<string> | null;
}

export function LanguagePicker({ available = null }: LanguagePickerProps) {
  const { state, dispatch, loadedCodes } = useTranslator();
  const [query, setQuery] = useState("");

  const unlisted = useMemo(
    () =>
      loadedCodes
        .filter((code) => !LOCALES.some((locale) => locale.code === code))
        .map(localeMeta),
    [loadedCodes]
  );

  const grouped = useMemo(() => {
    const needle = normalize(query);
    const pool = [...LOCALES, ...unlisted];
    const matches = needle
      ? pool.filter((locale) =>
          [locale.code, locale.name, locale.native].some((field) =>
            normalize(field).includes(needle)
          )
        )
      : pool;

    return LOCALE_GROUPS.map((group) => ({
      group,
      items: matches.filter((locale) => locale.group === group),
    })).filter((bucket) => bucket.items.length > 0);
  }, [query, unlisted]);

  const selectedCount = state.selected.length;

  return (
    <div className="sb-picker">
      <div className="sb-picker__bar">
        <input
          type="search"
          className="sb-input sb-picker__search"
          placeholder="Filter by language or code"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Filter languages"
        />
        <div className="sb-picker__shortcuts">
          {SHORTCUTS.map((shortcut) => (
            <button
              key={shortcut.label}
              type="button"
              className="sb-ghost"
              onClick={() =>
                dispatch({ type: "select-locales", codes: shortcut.codes })
              }
            >
              {shortcut.label}
            </button>
          ))}
          <button
            type="button"
            className="sb-ghost"
            onClick={() => dispatch({ type: "clear-locales" })}
            disabled={selectedCount === 0}
          >
            Clear
          </button>
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="sb-empty">
          No language matches “{query}”. The registry follows the codes in{" "}
          <code>languages.all_langs</code>, so try <code>br</code> instead of{" "}
          <code>pt-BR</code>.
        </p>
      ) : (
        <div className="sb-picker__groups">
          {grouped.map(({ group, items }) => (
            <section key={group} className="sb-picker__group">
              <h3 className="sb-eyebrow">
                {group}
                <span className="sb-eyebrow__count">{items.length}</span>
              </h3>
              <ul className="sb-picker__list">
                {items.map((locale) => (
                  <LanguageChip
                    key={locale.code}
                    locale={locale}
                    selected={state.selected.includes(locale.code)}
                    loaded={Boolean(state.loaded[locale.code])}
                    unavailable={
                      Boolean(available) && !available?.has(locale.code)
                    }
                    onToggle={() =>
                      dispatch({ type: "toggle-locale", code: locale.code })
                    }
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function LanguageChip({
  locale,
  selected,
  loaded,
  unavailable,
  onToggle,
}: {
  locale: LocaleMeta;
  selected: boolean;
  loaded: boolean;
  unavailable: boolean;
  onToggle: () => void;
}) {
  const blocked = unavailable && !loaded && !selected;
  return (
    <li>
      <button
        type="button"
        className="sb-chip"
        data-selected={selected || undefined}
        data-unavailable={blocked || undefined}
        aria-pressed={selected}
        disabled={blocked}
        onClick={onToggle}
        title={blocked ? "No standard text for this language yet" : locale.note}
      >
        <span className="sb-chip__code">{locale.code}</span>
        <span className="sb-chip__text">
          <span className="sb-chip__name">{locale.name}</span>
          <span
            className="sb-chip__native"
            lang={locale.code}
            dir={locale.rtl ? "rtl" : undefined}
          >
            {locale.native}
          </span>
        </span>
        <span className="sb-chip__state">
          {loaded ? <CheckIcon size={14} /> : null}
          {locale.note ? (
            <AlertIcon size={13} className="sb-chip__warn" />
          ) : null}
        </span>
      </button>
    </li>
  );
}

export function LanguagePickerSummary() {
  const { state, loadedCodes, awaitingCodes } = useTranslator();
  const standard = state.source === "standard";
  if (state.selected.length === 0)
    return <p className="sb-hint">Nothing selected yet.</p>;

  return (
    <p className="sb-hint" aria-live="polite">
      <strong>{state.selected.length}</strong> selected
      {loadedCodes.length > 0 ? <> · {loadedCodes.length} ready</> : null}
      {awaitingCodes.length > 0 ? (
        <>
          {standard ? " · loading " : " · waiting for "}
          {awaitingCodes.slice(0, 4).map((code, index) => (
            <span key={code}>
              {index > 0 ? ", " : ""}
              <code>{standard ? code : `${code}.json`}</code>
            </span>
          ))}
          {awaitingCodes.length > 4
            ? ` and ${awaitingCodes.length - 4} more`
            : null}
        </>
      ) : null}
    </p>
  );
}
