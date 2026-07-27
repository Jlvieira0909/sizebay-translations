'use client';

import { memo, useState } from 'react';
import { copyToClipboard } from '@/lib/files';
import { hasMarkup, placeholders } from '@/lib/json';
import type { Entry } from '@/lib/types';
import { UndoIcon } from './Icons';
import { ValueField } from './ValueField';

interface EntryCardProps {
  entry: Entry;
  locales: string[];
  matchedIn: string[];
  valueOf: (code: string, path: string) => string;
  originalOf: (code: string, path: string) => string | undefined;
  isChanged: (code: string, path: string) => boolean;
  onChange: (code: string, path: string, value: string, original: string) => void;
  onRevertValue: (code: string, path: string) => void;
  onRevertRow: (path: string) => void;
}

function EntryCardImpl({
  entry,
  locales,
  matchedIn,
  valueOf,
  originalOf,
  isChanged,
  onChange,
  onRevertValue,
  onRevertRow,
}: EntryCardProps) {
  const [copied, setCopied] = useState(false);
  const rowChanged = locales.some((code) => isChanged(code, entry.path));

  const reference = locales[0];
  const sample = originalOf(reference, entry.path) ?? valueOf(reference, entry.path);
  const tokens = placeholders(sample);
  const markup = hasMarkup(sample);

  async function copyPath() {
    const ok = await copyToClipboard(entry.path);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <article className="sb-entry" data-changed={rowChanged || undefined} id={`entry-${entry.path}`}>
      <header className="sb-entry__head">
        <button type="button" className="sb-entry__path" onClick={copyPath} title="Copy the key path">
          <span className="sb-entry__section">{entry.section}</span>
          {entry.middle.map((segment) => (
            <span key={segment} className="sb-entry__middle">
              <span className="sb-entry__sep">›</span>
              {segment}
            </span>
          ))}
          <span className="sb-entry__sep">›</span>
          <span className="sb-entry__leaf">{entry.leaf}</span>
          <span className="sb-entry__copy">{copied ? 'copied' : 'copy'}</span>
        </button>

        <div className="sb-entry__flags">
          {tokens.map((token) => (
            <span key={token} className="sb-tag sb-tag--var" title="Filled in automatically — keep it in the text">
              {`{{${token}}}`}
            </span>
          ))}
          {markup ? (
            <span className="sb-tag sb-tag--html" title="Contains HTML. Keep the tags.">
              html
            </span>
          ) : null}
          {rowChanged ? (
            <button type="button" className="sb-tag sb-tag--revert" onClick={() => onRevertRow(entry.path)}>
              <UndoIcon size={12} /> revert row
            </button>
          ) : null}
        </div>
      </header>

      <div className="sb-entry__fields" data-columns={Math.min(locales.length, 2)}>
        {locales.map((code) => (
          <ValueField
            key={code}
            code={code}
            path={entry.path}
            value={valueOf(code, entry.path)}
            original={originalOf(code, entry.path)}
            changed={isChanged(code, entry.path)}
            matched={matchedIn.includes(code)}
            isReference={locales.length > 1 && code === reference}
            onChange={(value) => onChange(code, entry.path, value, originalOf(code, entry.path) ?? '')}
            onRevert={() => onRevertValue(code, entry.path)}
          />
        ))}
      </div>
    </article>
  );
}

export const EntryCard = memo(EntryCardImpl);
