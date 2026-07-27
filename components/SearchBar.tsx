'use client';

import { useEffect, useRef } from 'react';
import { CloseIcon, SearchIcon } from './Icons';

export type EntryFilter = 'all' | 'edited' | 'empty' | 'vars' | 'html';

const FILTERS: { id: EntryFilter; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'edited', label: 'Edited' },
  { id: 'empty', label: 'Empty' },
  { id: 'vars', label: 'With {{variables}}' },
  { id: 'html', label: 'With HTML' },
];

interface SearchBarProps {
  query: string;
  onQuery: (value: string) => void;
  filter: EntryFilter;
  onFilter: (filter: EntryFilter) => void;
  resultCount: number;
  totalCount: number;
  editedCount: number;
}

export function SearchBar({
  query,
  onQuery,
  filter,
  onFilter,
  resultCount,
  totalCount,
  editedCount,
}: SearchBarProps) {
  const input = useRef<HTMLInputElement>(null);
  const latestOnQuery = useRef(onQuery);
  latestOnQuery.current = onQuery;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;

      if ((event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        input.current?.focus();
        input.current?.select();
        return;
      }
      if (event.key === '/' && !typing) {
        event.preventDefault();
        input.current?.focus();
      }
      if (event.key === 'Escape' && document.activeElement === input.current) {
        latestOnQuery.current('');
        input.current?.blur();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="sb-search">
      <div className="sb-search__field">
        <SearchIcon size={17} className="sb-search__icon" />
        <input
          ref={input}
          type="text"
          className="sb-search__input"
          placeholder="Paste the text you see in the store, or type a key…"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          aria-label="Search texts and keys"
          spellCheck={false}
        />
        {query ? (
          <button type="button" className="sb-iconbutton" onClick={() => onQuery('')} aria-label="Clear search">
            <CloseIcon size={15} />
          </button>
        ) : (
          <kbd className="sb-kbd">/</kbd>
        )}
      </div>

      <div className="sb-search__filters" role="group" aria-label="Filter texts">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            className="sb-pill"
            data-active={filter === option.id || undefined}
            aria-pressed={filter === option.id}
            onClick={() => onFilter(option.id)}
            disabled={option.id === 'edited' && editedCount === 0}
          >
            {option.label}
            {option.id === 'edited' && editedCount > 0 ? <span className="sb-pill__count">{editedCount}</span> : null}
          </button>
        ))}
      </div>

      <p className="sb-search__count" aria-live="polite">
        {query.trim() ? (
          resultCount > 0 ? (
            <>
              <strong>{resultCount}</strong> {resultCount === 1 ? 'match' : 'matches'} across all sections
            </>
          ) : (
            'No match'
          )
        ) : (
          <>
            <strong>{resultCount}</strong> of {totalCount} texts
          </>
        )}
      </p>
    </div>
  );
}
