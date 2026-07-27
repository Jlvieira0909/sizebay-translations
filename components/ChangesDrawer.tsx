'use client';

import { useEffect, useRef, useState } from 'react';
import { copyToClipboard, downloadText } from '@/lib/files';
import { localeMeta } from '@/lib/locales';
import { useTranslator } from '@/lib/store';
import { ArrowRightIcon, CloseIcon, CopyIcon, DownloadIcon, UndoIcon } from './Icons';

interface ChangesDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (codes: string[]) => Promise<void>;
  onJump: (path: string) => void;
}

function oneLine(value: string): string {
  return value.replace(/\s*\n\s*/g, ' ⏎ ').trim();
}

export function ChangesDrawer({ open, onClose, onSave, onJump }: ChangesDrawerProps) {
  const { state, dispatch, changes, changedLocales, loadedCodes, changeCount } = useTranslator();
  const panel = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    panel.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  function buildReport(): string {
    const stamp = new Date().toLocaleString();
    const lines = [
      '# Sizebay Translator — change report',
      '',
      `${stamp} · ${changedLocales.length} ${changedLocales.length === 1 ? 'file' : 'files'} · ${changeCount} ${
        changeCount === 1 ? 'change' : 'changes'
      }`,
      '',
    ];

    for (const code of changedLocales) {
      const file = state.loaded[code];
      const meta = localeMeta(code);
      const localeChanges = changes.filter((change) => change.locale === code);
      lines.push(`## ${file?.fileName ?? `${code}.json`} — ${meta.name} — ${localeChanges.length} changes`, '');
      for (const change of localeChanges) {
        lines.push(`### ${change.path}`, `Before: ${oneLine(change.before)}`, `After:  ${oneLine(change.after)}`, '');
      }
    }

    return lines.join('\n');
  }

  async function copyReport() {
    const ok = await copyToClipboard(buildReport());
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      <div className="sb-scrim" data-open={open || undefined} onClick={onClose} aria-hidden={!open} />
      <aside
        className="sb-drawer"
        data-open={open || undefined}
        role="dialog"
        aria-modal="true"
        aria-label="Changes"
        aria-hidden={!open}
        tabIndex={-1}
        ref={panel}
      >
        <header className="sb-drawer__head">
          <div>
            <p className="sb-eyebrow">Review</p>
            <h2 className="sb-drawer__title">
              {changeCount === 0
                ? 'No changes yet'
                : `${changeCount} ${changeCount === 1 ? 'change' : 'changes'} in ${changedLocales.length} ${
                    changedLocales.length === 1 ? 'file' : 'files'
                  }`}
            </h2>
          </div>
          <button type="button" className="sb-iconbutton" onClick={onClose} aria-label="Close review">
            <CloseIcon size={16} />
          </button>
        </header>

        <div className="sb-drawer__body">
          {changeCount === 0 ? (
            <p className="sb-empty">
              Edits show up here as you type, grouped by the file they will be written to. Nothing is saved until you
              download.
            </p>
          ) : (
            changedLocales.map((code) => {
              const file = state.loaded[code];
              const meta = localeMeta(code);
              const localeChanges = changes.filter((change) => change.locale === code);
              return (
                <section key={code} className="sb-diff">
                  <header className="sb-diff__head">
                    <span className="sb-diff__file">{file?.fileName ?? `${code}.json`}</span>
                    <span className="sb-diff__meta">
                      {meta.name} · {localeChanges.length}
                    </span>
                    <button
                      type="button"
                      className="sb-ghost"
                      onClick={() => dispatch({ type: 'revert-locale', code })}
                    >
                      Revert file
                    </button>
                  </header>
                  <ul className="sb-diff__list">
                    {localeChanges.map((change) => (
                      <li key={change.path} className="sb-diff__item">
                        <button
                          type="button"
                          className="sb-diff__path"
                          onClick={() => {
                            onJump(change.path);
                            onClose();
                          }}
                        >
                          {change.path}
                        </button>
                        <p className="sb-diff__before" dir="auto">
                          {oneLine(change.before) || <em>empty</em>}
                        </p>
                        <p className="sb-diff__after" dir="auto">
                          {oneLine(change.after) || <em>empty</em>}
                        </p>
                        <button
                          type="button"
                          className="sb-iconbutton sb-diff__revert"
                          onClick={() => dispatch({ type: 'revert-value', code, path: change.path })}
                          aria-label={`Revert ${change.path} in ${code}`}
                        >
                          <UndoIcon size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })
          )}
        </div>

        <footer className="sb-drawer__foot">
          <div className="sb-drawer__secondary">
            <button type="button" className="sb-ghost" onClick={copyReport} disabled={changeCount === 0}>
              <CopyIcon size={14} /> {copied ? 'Report copied' : 'Copy report'}
            </button>
            <button
              type="button"
              className="sb-ghost"
              onClick={() => downloadText('sizebay-translator-report.md', buildReport(), 'text/markdown')}
              disabled={changeCount === 0}
            >
              <DownloadIcon size={14} /> Download report
            </button>
            <button
              type="button"
              className="sb-ghost"
              onClick={() => void onSave(loadedCodes)}
              disabled={loadedCodes.length === 0}
            >
              <DownloadIcon size={14} /> Save every loaded file
            </button>
            <button
              type="button"
              className="sb-ghost sb-ghost--danger"
              onClick={() => dispatch({ type: 'revert-all' })}
              disabled={changeCount === 0}
            >
              <UndoIcon size={14} /> Revert everything
            </button>
          </div>
          <button
            type="button"
            className="sb-button sb-button--primary"
            disabled={changeCount === 0}
            onClick={() => void onSave(changedLocales)}
          >
            Save {changedLocales.length} {changedLocales.length === 1 ? 'file' : 'files'} <ArrowRightIcon size={15} />
          </button>
        </footer>
      </aside>
    </>
  );
}
