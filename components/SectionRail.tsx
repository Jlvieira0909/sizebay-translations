'use client';

import { useTranslator } from '@/lib/store';

interface SectionRailProps {
  active: string;
  onSelect: (section: string) => void;
  /** Populated while searching, so the rail doubles as a hit map. */
  hits?: Record<string, number> | null;
}

export function SectionRail({ active, onSelect, hits }: SectionRailProps) {
  const { sections, entries } = useTranslator();
  const searching = Boolean(hits);

  return (
    <nav className="sb-rail" aria-label="Sections">
      <p className="sb-eyebrow sb-rail__label">Sections</p>
      <ul className="sb-rail__list">
        <li>
          <button
            type="button"
            className="sb-rail__item"
            data-active={active === '*' || undefined}
            onClick={() => onSelect('*')}
          >
            <span className="sb-rail__name">All texts</span>
            <span className="sb-rail__count">{entries.length}</span>
          </button>
        </li>
        {sections.map((section) => {
          const hitCount = hits?.[section.name] ?? 0;
          return (
            <li key={section.name}>
              <button
                type="button"
                className="sb-rail__item"
                data-active={active === section.name || undefined}
                data-dimmed={searching && hitCount === 0 ? true : undefined}
                onClick={() => onSelect(section.name)}
                title={`${section.count} texts`}
              >
                <span className="sb-rail__name">{section.name.replace(/_/g, ' ')}</span>
                <span className="sb-rail__count">
                  {searching ? hitCount || '—' : section.count}
                  {section.changed > 0 ? <span className="sb-rail__dot" title={`${section.changed} edited`} /> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
