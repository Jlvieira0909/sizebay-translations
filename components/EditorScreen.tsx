'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { downloadMany } from '@/lib/files';
import { applyEdits, hasMarkup, placeholders, serialize } from '@/lib/json';
import { localeMeta } from '@/lib/locales';
import { buildIndex, normalize, search } from '@/lib/search';
import { useTranslator } from '@/lib/store';
import type { Entry, LoadedLocale } from '@/lib/types';
import { ChangesDrawer } from './ChangesDrawer';
import { EntryCard } from './EntryCard';
import { ListIcon, PinIcon } from './Icons';
import { SectionRail } from './SectionRail';
import { SearchBar, type EntryFilter } from './SearchBar';

const PAGE_SIZE = 60;

export function EditorScreen() {
  const {
    state,
    dispatch,
    activeLocales,
    loadedCodes,
    entries,
    changeCount,
    changedLocales,
    valueOf,
    originalOf,
    isChanged,
  } = useTranslator();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<EntryFilter>('all');
  const [section, setSection] = useState('*');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [drawer, setDrawer] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(query);
  const searching = deferredQuery.trim().length > 1;

  const index = useMemo(
    () =>
      buildIndex(
        entries.map((entry) => ({
          path: entry.path,
          values: Object.fromEntries(activeLocales.map((code) => [code, state.loaded[code]?.flat[entry.path] ?? ''])),
        })),
      ),
    [entries, activeLocales, state.loaded],
  );

  /** Index holds the files as they arrived; edited text is matched separately so it stays cheap. */
  const hits = useMemo(() => {
    if (!searching) return null;
    const found = search(index, deferredQuery);
    const seen = new Set(found.map((hit) => hit.path));
    const needle = normalize(deferredQuery);

    for (const [code, paths] of Object.entries(state.edits)) {
      if (!activeLocales.includes(code)) continue;
      for (const [path, value] of Object.entries(paths)) {
        if (seen.has(path) || !normalize(value).includes(needle)) continue;
        seen.add(path);
        found.push({ path, score: 150, matchedIn: [code] });
      }
    }

    return found.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  }, [searching, index, deferredQuery, state.edits, activeLocales]);

  const matchedByPath = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const hit of hits ?? []) map.set(hit.path, hit.matchedIn);
    return map;
  }, [hits]);

  const railHits = useMemo(() => {
    if (!hits) return null;
    const counts: Record<string, number> = {};
    for (const hit of hits) {
      const key = hit.path.split('.')[0];
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [hits]);

  const editedPaths = useMemo(() => {
    const set = new Set<string>();
    for (const code of activeLocales) for (const path of Object.keys(state.edits[code] ?? {})) set.add(path);
    return set;
  }, [state.edits, activeLocales]);

  const matches = useMemo(() => {
    const byPath = new Map(entries.map((entry) => [entry.path, entry]));
    let list: Entry[] = hits
      ? hits.map((hit) => byPath.get(hit.path)).filter((entry): entry is Entry => entry !== undefined)
      : entries;

    if (section !== '*') list = list.filter((entry) => entry.section === section);

    if (filter === 'edited') list = list.filter((entry) => editedPaths.has(entry.path));
    if (filter === 'empty') {
      list = list.filter((entry) => activeLocales.some((code) => valueOf(code, entry.path).trim() === ''));
    }
    if (filter === 'vars') {
      list = list.filter((entry) => activeLocales.some((code) => placeholders(valueOf(code, entry.path)).length > 0));
    }
    if (filter === 'html') {
      list = list.filter((entry) => activeLocales.some((code) => hasMarkup(valueOf(code, entry.path))));
    }

    return list;
  }, [hits, entries, section, filter, editedPaths, activeLocales, valueOf]);

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [deferredQuery, section, filter, activeLocales.length]);

  const handleQuery = useCallback(
    (value: string) => {
      // A new search looks across every section, so drop any section narrowing.
      if (query.trim() === '' && value.trim() !== '') setSection('*');
      setQuery(value);
    },
    [query],
  );

  const onChange = useCallback(
    (code: string, path: string, value: string, original: string) =>
      dispatch({ type: 'set-value', code, path, value, original }),
    [dispatch],
  );

  const onRevertValue = useCallback(
    (code: string, path: string) => dispatch({ type: 'revert-value', code, path }),
    [dispatch],
  );

  const onRevertRow = useCallback((path: string) => dispatch({ type: 'revert-path', path }), [dispatch]);

  async function save(codes: string[]) {
    const files = codes
      .map((code) => state.loaded[code])
      .filter((file): file is LoadedLocale => Boolean(file))
      .map((file) => ({
        name: file.fileName,
        text: serialize(applyEdits(file.data, state.edits[file.code])),
      }));
    if (files.length === 0) return;
    await downloadMany(files);
    setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    window.setTimeout(() => setSavedAt(null), 6000);
  }

  const shown = matches.slice(0, limit);

  return (
    <div className="sb-editor" data-drawer={drawer || undefined}>
      <header className="sb-bar">
        <div className="sb-bar__brand">
          <span className="sb-wordmark">Sizebay Translator</span>
          <span className="sb-bar__ticks" aria-hidden="true" />
        </div>

        <div className="sb-bar__langs">
          {state.selected.map((code, position) => {
            const loaded = Boolean(state.loaded[code]);
            const meta = localeMeta(code);
            return (
              <span key={code} className="sb-lang" data-on={loaded || undefined}>
                <button
                  type="button"
                  className="sb-lang__toggle"
                  disabled={loaded && activeLocales.length === 1}
                  onClick={() => dispatch({ type: 'toggle-locale', code })}
                  title={
                    loaded && activeLocales.length === 1
                      ? 'The last visible language stays on'
                      : loaded
                        ? `Hide ${meta.name}`
                        : `${meta.name} — no file loaded`
                  }
                >
                  {code}
                </button>
                {loaded && position > 0 ? (
                  <button
                    type="button"
                    className="sb-lang__pin"
                    onClick={() => dispatch({ type: 'pin-locale', code })}
                    aria-label={`Show ${meta.name} first`}
                    title="Show first, as the reference"
                  >
                    <PinIcon size={12} />
                  </button>
                ) : null}
              </span>
            );
          })}
          {loadedCodes
            .filter((code) => !state.selected.includes(code))
            .map((code) => (
              <button
                key={code}
                type="button"
                className="sb-lang sb-lang--off"
                onClick={() => dispatch({ type: 'toggle-locale', code })}
                title={`Show ${localeMeta(code).name}`}
              >
                + {code}
              </button>
            ))}
        </div>

        <div className="sb-bar__actions">
          <button type="button" className="sb-button sb-button--quiet" onClick={() => setDrawer(true)}>
            <ListIcon size={15} /> Changes
            {changeCount > 0 ? <span className="sb-badge">{changeCount}</span> : null}
          </button>
          <button
            type="button"
            className="sb-button sb-button--quiet"
            onClick={() => dispatch({ type: 'set-step', step: 'setup' })}
          >
            Languages &amp; files
          </button>
        </div>
      </header>

      <SearchBar
        query={query}
        onQuery={handleQuery}
        filter={filter}
        onFilter={setFilter}
        resultCount={matches.length}
        totalCount={entries.length}
        editedCount={editedPaths.size}
      />

      <div className="sb-workspace">
        <SectionRail active={section} onSelect={setSection} hits={railHits} />

        <main className="sb-list" aria-live="polite">
          {shown.length === 0 ? (
            <EmptyState query={query} filter={filter} onReset={() => { setQuery(''); setFilter('all'); }} />
          ) : (
            shown.map((entry) => (
              <EntryCard
                key={entry.path}
                entry={entry}
                locales={activeLocales}
                matchedIn={matchedByPath.get(entry.path) ?? []}
                valueOf={valueOf}
                originalOf={originalOf}
                isChanged={isChanged}
                onChange={onChange}
                onRevertValue={onRevertValue}
                onRevertRow={onRevertRow}
              />
            ))
          )}

          {matches.length > shown.length ? (
            <button type="button" className="sb-button sb-button--quiet sb-more" onClick={() => setLimit(limit + PAGE_SIZE)}>
              Show {Math.min(PAGE_SIZE, matches.length - shown.length)} more of {matches.length - shown.length}
            </button>
          ) : null}
        </main>
      </div>

      {changeCount > 0 || savedAt ? (
        <footer className="sb-savebar">
          <p className="sb-savebar__status">
            {savedAt ? (
              <>
                Downloaded at {savedAt} · {changeCount} {changeCount === 1 ? 'change' : 'changes'} still open
              </>
            ) : (
              <>
                <strong>{changeCount}</strong> {changeCount === 1 ? 'change' : 'changes'} in{' '}
                <strong>{changedLocales.length}</strong> {changedLocales.length === 1 ? 'file' : 'files'}
                {' · '}
                {changedLocales.map((code) => state.loaded[code]?.fileName ?? code).join(', ')}
              </>
            )}
          </p>
          <div className="sb-savebar__actions">
            <button type="button" className="sb-button sb-button--quiet" onClick={() => setDrawer(true)}>
              Review changes
            </button>
            <button type="button" className="sb-button sb-button--primary" onClick={() => void save(changedLocales)}>
              Save {changedLocales.length} {changedLocales.length === 1 ? 'file' : 'files'}
            </button>
          </div>
        </footer>
      ) : null}

      <ChangesDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        onSave={save}
        onJump={(path) => {
          setSection('*');
          setFilter('all');
          setQuery(path);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}

function EmptyState({
  query,
  filter,
  onReset,
}: {
  query: string;
  filter: EntryFilter;
  onReset: () => void;
}) {
  return (
    <div className="sb-empty sb-empty--list">
      {query.trim() ? (
        <>
          <p>
            Nothing matched “{query}”.
          </p>
          <p className="sb-hint">
            Try a shorter piece of the sentence, or one distinctive word. Accents, capitals, HTML tags and{' '}
            <code>{'{{variables}}'}</code> are ignored while matching.
          </p>
        </>
      ) : filter !== 'all' ? (
        <p>No text in this section matches the “{filter}” filter.</p>
      ) : (
        <p>This section is empty.</p>
      )}
      <button type="button" className="sb-button sb-button--quiet" onClick={onReset}>
        Clear search and filters
      </button>
    </div>
  );
}
