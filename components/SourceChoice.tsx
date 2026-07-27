'use client';

import type { LocaleManifest } from '@/lib/defaults';
import type { SourceMode } from '@/lib/store';
import { ArrowRightIcon, FolderIcon, UploadIcon } from './Icons';

interface SourceChoiceProps {
  /** undefined while checking, null when there are no standard files. */
  manifest: LocaleManifest | null | undefined;
  onPick: (source: SourceMode) => void;
}

export function SourceChoice({ manifest, onPick }: SourceChoiceProps) {
  const checking = manifest === undefined;
  const count = manifest?.locales.length ?? 0;

  return (
    <section className="sb-card sb-choice" aria-labelledby="choice-title">
      <div className="sb-card__head">
        <p className="sb-eyebrow">Start</p>
        <h2 className="sb-card__title" id="choice-title">
          Where should the texts come from?
        </h2>
        <p className="sb-card__note">
          You can switch either way later, and mix the two — a standard language plus a file of your own.
        </p>
      </div>

      <div className="sb-choice__options">
        <button
          type="button"
          className="sb-choice__option"
          onClick={() => onPick('standard')}
          disabled={checking || !manifest}
        >
          <FolderIcon size={18} className="sb-choice__icon" />
          <span className="sb-choice__label">Start from the standard texts</span>
          <span className="sb-choice__note">
            {checking
              ? 'Checking what is available…'
              : manifest
                ? `${count} ${count === 1 ? 'language' : 'languages'} ready to edit, nothing to upload.`
                : 'Not set up in this project yet.'}
          </span>
          {manifest ? <ArrowRightIcon size={15} className="sb-choice__go" /> : null}
        </button>

        <button type="button" className="sb-choice__option" onClick={() => onPick('upload')}>
          <UploadIcon size={18} className="sb-choice__icon" />
          <span className="sb-choice__label">Use my own files</span>
          <span className="sb-choice__note">
            Drop your JSON files, or a whole folder. They stay in this tab.
          </span>
          <ArrowRightIcon size={15} className="sb-choice__go" />
        </button>
      </div>

      {manifest === null ? (
        <p className="sb-hint">
          To offer the standard texts here, copy them in once with{' '}
          <code>node scripts/prepare-locales.mjs &lt;folder&gt;</code>. Until then, upload files instead.
        </p>
      ) : null}
    </section>
  );
}
