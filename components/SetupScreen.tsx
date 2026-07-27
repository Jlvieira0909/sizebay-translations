"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchStandardLocale,
  loadManifest,
  type LocaleManifest,
} from "@/lib/defaults";
import { isFileError } from "@/lib/parse";
import { useTranslator } from "@/lib/store";
import { Dropzone } from "./Dropzone";
import { LanguagePicker, LanguagePickerSummary } from "./LanguagePicker";
import { AlertIcon, ArrowRightIcon, CheckIcon, CloseIcon } from "./Icons";
import { SourceChoice } from "./SourceChoice";
import { TapeBand } from "./TapeBand";

export function SetupScreen() {
  const {
    state,
    dispatch,
    activeLocales,
    loadedCodes,
    awaitingCodes,
    entries,
    changeCount,
  } = useTranslator();
  const [manifest, setManifest] = useState<LocaleManifest | null | undefined>(
    undefined
  );
  const requested = useRef(new Set<string>());
  const ready = activeLocales.length > 0;

  useEffect(() => {
    let live = true;
    void loadManifest().then((result) => {
      if (live) setManifest(result);
    });
    return () => {
      live = false;
    };
  }, []);

  const available = useMemo(
    () =>
      manifest ? new Set(manifest.locales.map((entry) => entry.code)) : null,
    [manifest]
  );

  useEffect(() => {
    if (state.source !== "standard" || !manifest) return;

    const pending = state.selected.filter(
      (code) => !state.loaded[code] && !requested.current.has(code)
    );
    if (pending.length === 0) return;

    for (const code of pending) {
      const entry = manifest.locales.find((item) => item.code === code);
      if (!entry) continue;
      requested.current.add(code);
      void fetchStandardLocale(entry).then((result) => {
        if (isFileError(result)) dispatch({ type: "add-error", error: result });
        else dispatch({ type: "add-file", file: result });
      });
    }
  }, [state.source, state.selected, state.loaded, manifest, dispatch]);

  const standardMode = state.source === "standard";

  return (
    <div className="sb-setup">
      <header className="sb-hero">
        <TapeBand />
        <p className="sb-eyebrow sb-hero__eyebrow">
          Sizebay · fitting room &amp; size chart
        </p>
        <h1 className="sb-hero__title">
          Fitting room copy,
          <br />
          measured and rewritten
        </h1>
        <p className="sb-hero__lede">
          Every text your shoppers read lives behind a key like{" "}
          <code>footer.add_to_cart</code> — but you know it as the{" "}
          <em>Add to cart</em> button. Search by the words you can see in the
          store, edit every language side by side, and download files that are
          ready to ship.
        </p>
      </header>

      {state.source === "choose" ? (
        <div className="sb-steps sb-steps--single">
          <SourceChoice
            manifest={manifest}
            onPick={(source) => dispatch({ type: "set-source", source })}
          />
        </div>
      ) : (
        <>
          <div className="sb-steps">
            <section className="sb-card" aria-labelledby="step-languages">
              <div className="sb-card__head">
                <p className="sb-eyebrow">Step 1 · Languages</p>
                <h2 className="sb-card__title" id="step-languages">
                  Which languages do you want to change?
                </h2>
                <p className="sb-card__note">
                  Codes come straight from <code>languages.all_langs</code>.
                  Several are not ISO — Brazil is <code>br</code>, Danish is{" "}
                  <code>dk</code>, and <code>uk</code> means British English.
                </p>
              </div>
              <LanguagePicker available={standardMode ? available : null} />
              <LanguagePickerSummary />
            </section>

            <section className="sb-card" aria-labelledby="step-files">
              <div className="sb-card__head">
                <p className="sb-eyebrow">Step 2 · Texts</p>
                <h2 className="sb-card__title" id="step-files">
                  {standardMode
                    ? "Loading the standard texts"
                    : "Where are your files?"}
                </h2>
                <p className="sb-card__note">
                  Everything stays in this tab. Nothing is uploaded anywhere,
                  and the files on your computer are never touched.
                </p>
              </div>

              {standardMode ? <StandardStatus /> : <Dropzone />}

              <button
                type="button"
                className="sb-ghost sb-card__switch"
                onClick={() =>
                  dispatch({
                    type: "set-source",
                    source: standardMode ? "upload" : "standard",
                  })
                }
                disabled={!standardMode && !manifest}
                title={
                  !standardMode && !manifest
                    ? "No standard texts in this project yet"
                    : undefined
                }
              >
                {standardMode
                  ? "Use my own files instead"
                  : "Use the standard texts instead"}
              </button>
            </section>
          </div>

          <div className="sb-launch">
            <p className="sb-launch__status" aria-live="polite">
              {ready ? (
                <>
                  <strong>{activeLocales.length}</strong>{" "}
                  {activeLocales.length === 1 ? "language" : "languages"} ready
                  · <strong>{entries.length}</strong> texts
                  {changeCount > 0 ? (
                    <>
                      {" "}
                      · <strong>{changeCount}</strong> unsaved{" "}
                      {changeCount === 1 ? "change" : "changes"} kept
                    </>
                  ) : null}
                </>
              ) : standardMode ? (
                "Pick a language above to continue."
              ) : (
                "Pick a language and add its file to continue."
              )}
            </p>
            <button
              type="button"
              className="sb-button sb-button--primary"
              disabled={!ready}
              onClick={() => dispatch({ type: "set-step", step: "editor" })}
            >
              {changeCount > 0 ? "Back to editor" : "Open editor"}{" "}
              <ArrowRightIcon size={16} />
            </button>
          </div>

          {!standardMode &&
          state.selected.length > 0 &&
          loadedCodes.length === 0 ? (
            <p className="sb-hint sb-hint--center">
              Languages are selected but no file matched them yet. Drop the
              files above, or use the dropdown on each file to say which
              language it is.
            </p>
          ) : null}

          {standardMode && awaitingCodes.length > 0 && available ? (
            <p className="sb-hint sb-hint--center">
              {awaitingCodes.filter((code) => !available.has(code)).length > 0
                ? "Some selected languages have no standard text yet. Switch to your own files for those."
                : "Fetching the standard texts…"}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

function StandardStatus() {
  const { state, dispatch, loadedCodes, awaitingCodes } = useTranslator();

  if (state.selected.length === 0) {
    return (
      <p className="sb-empty">
        Nothing selected yet. Choose the languages above and their texts load
        straight away — no files needed.
      </p>
    );
  }

  return (
    <div className="sb-files">
      <ul className="sb-filelist">
        {state.selected.map((code) => {
          const file = state.loaded[code];
          const waiting = awaitingCodes.includes(code);
          return (
            <li
              key={code}
              className="sb-filelist__row"
              data-waiting={waiting || undefined}
            >
              <span className="sb-filelist__name">
                {file?.fileName ?? `${code}.json`}
              </span>
              <span className="sb-filelist__count">
                {file ? `${file.keyCount} texts` : "loading…"}
              </span>
              <span className="sb-filelist__origin">
                {file ? (
                  <>
                    <CheckIcon size={13} />{" "}
                    {file.origin === "standard" ? "standard" : "your file"}
                  </>
                ) : null}
              </span>
              <button
                type="button"
                className="sb-iconbutton"
                onClick={() => dispatch({ type: "toggle-locale", code })}
                aria-label={`Remove ${code}`}
              >
                <CloseIcon size={14} />
              </button>
            </li>
          );
        })}
      </ul>

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
        </ul>
      ) : null}

      {loadedCodes.length > 0 ? (
        <p className="sb-hint">
          You can still drop a file of your own over any of these — switch below
          and it replaces that language.
        </p>
      ) : null}
    </div>
  );
}
