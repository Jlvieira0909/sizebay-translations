'use client';

import { useRef, useState } from 'react';
import { filesFromDrop, filesFromInput } from '@/lib/files';
import { LOCALES, isKnownLocale, localeMeta } from '@/lib/locales';
import { isFileError, parseLocaleFile } from '@/lib/parse';
import { useTranslator } from '@/lib/store';
import { AlertIcon, CloseIcon, FolderIcon, UploadIcon } from './Icons';

/** Not in the React typings, but every current browser honours them. */
const DIRECTORY_PROPS = { webkitdirectory: 'true', directory: 'true' } as Record<string, string>;

export function Dropzone() {
  const { state, dispatch, loadedCodes } = useTranslator();
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [paste, setPaste] = useState('');
  const [pasteCode, setPasteCode] = useState('br');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);

  async function ingest(files: File[]) {
    if (files.length === 0) return;
    setBusy(true);
    for (const file of files) {
      const result = await parseLocaleFile(file);
      if (isFileError(result)) dispatch({ type: 'add-error', error: result });
      else dispatch({ type: 'add-file', file: result });
    }
    setBusy(false);
  }

  async function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setOver(false);
    await ingest(await filesFromDrop(event.dataTransfer));
  }

  function handlePaste() {
    setPasteError(null);
    const trimmed = paste.trim();
    if (!trimmed) return;
    const blob = new File([trimmed], `${pasteCode}.json`, { type: 'application/json' });
    void parseLocaleFile(blob, pasteCode).then((result) => {
      if (isFileError(result)) setPasteError(result.message);
      else {
        dispatch({ type: 'add-file', file: result });
        setPaste('');
      }
    });
  }

  return (
    <div className="sb-files">
      <div
        className="sb-drop"
        data-over={over || undefined}
        data-busy={busy || undefined}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={handleDrop}
      >
        <UploadIcon size={22} className="sb-drop__icon" />
        <p className="sb-drop__title">Drop the language files here</p>
        <p className="sb-drop__hint">
          A whole folder works too. Names like <code>br.json</code>, <code>pt-BR.json</code> or{' '}
          <code>translations.esAR.json</code> are matched automatically.
        </p>
        <div className="sb-drop__actions">
          <button type="button" className="sb-button sb-button--quiet" onClick={() => fileInput.current?.click()}>
            <UploadIcon size={15} /> Choose files
          </button>
          <button type="button" className="sb-button sb-button--quiet" onClick={() => folderInput.current?.click()}>
            <FolderIcon size={15} /> Choose folder
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          multiple
          hidden
          onChange={(event) => {
            void ingest(filesFromInput(event.target.files));
            event.target.value = '';
          }}
        />
        <input
          ref={folderInput}
          type="file"
          hidden
          multiple
          {...DIRECTORY_PROPS}
          onChange={(event) => {
            void ingest(filesFromInput(event.target.files));
            event.target.value = '';
          }}
        />
      </div>

      {state.errors.length > 0 ? (
        <ul className="sb-errors">
          {state.errors.map((error) => (
            <li key={error.fileName} className="sb-errors__item">
              <AlertIcon size={15} />
              <span>
                <strong>{error.fileName}</strong> — {error.message}
              </span>
            </li>
          ))}
          <li>
            <button type="button" className="sb-ghost" onClick={() => dispatch({ type: 'clear-errors' })}>
              Dismiss
            </button>
          </li>
        </ul>
      ) : null}

      {loadedCodes.length > 0 ? (
        <ul className="sb-filelist">
          {loadedCodes.map((code) => {
            const file = state.loaded[code];
            const meta = localeMeta(code);
            const known = isKnownLocale(code);
            return (
              <li key={code} className="sb-filelist__row" data-unknown={!known || undefined}>
                <span className="sb-filelist__name" title={file.fileName}>
                  {file.fileName}
                </span>
                <span className="sb-filelist__count">{file.keyCount} texts</span>
                {file.origin === 'standard' ? <span className="sb-tag sb-tag--ref">standard</span> : null}
                <label className="sb-filelist__assign">
                  <span className="sb-vh">Language for {file.fileName}</span>
                  <select
                    className="sb-select"
                    value={code}
                    onChange={(event) => dispatch({ type: 'reassign-file', from: code, to: event.target.value })}
                  >
                    {!known ? <option value={code}>{code} — confirm language</option> : null}
                    {LOCALES.map((locale) => (
                      <option key={locale.code} value={locale.code}>
                        {locale.code} — {locale.name}
                      </option>
                    ))}
                  </select>
                </label>
                {!known ? (
                  <span className="sb-filelist__warn">
                    <AlertIcon size={14} /> {meta.note}
                  </span>
                ) : null}
                <button
                  type="button"
                  className="sb-iconbutton"
                  onClick={() => dispatch({ type: 'remove-file', code })}
                  aria-label={`Remove ${file.fileName}`}
                >
                  <CloseIcon size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <details className="sb-paste">
        <summary>Or paste JSON directly</summary>
        <div className="sb-paste__body">
          <label className="sb-paste__lang">
            <span className="sb-vh">Language of the pasted JSON</span>
            <select className="sb-select" value={pasteCode} onChange={(event) => setPasteCode(event.target.value)}>
              {LOCALES.map((locale) => (
                <option key={locale.code} value={locale.code}>
                  {locale.code} — {locale.name}
                </option>
              ))}
            </select>
          </label>
          <textarea
            className="sb-textarea sb-paste__area"
            value={paste}
            onChange={(event) => setPaste(event.target.value)}
            placeholder='{ "footer": { "add_to_cart": "Add to cart" } }'
            rows={4}
            spellCheck={false}
          />
          <div className="sb-paste__foot">
            {pasteError ? <span className="sb-paste__error">{pasteError}</span> : <span />}
            <button type="button" className="sb-button sb-button--quiet" onClick={handlePaste} disabled={!paste.trim()}>
              Load as {pasteCode}.json
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}
