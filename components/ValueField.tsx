"use client";

import { useLayoutEffect, useRef } from "react";
import { inspectValue } from "@/lib/json";
import { localeMeta } from "@/lib/locales";
import { UndoIcon } from "./Icons";

interface ValueFieldProps {
  code: string;
  path: string;
  value: string;
  original: string | undefined;
  changed: boolean;
  matched: boolean;
  isReference: boolean;
  onChange: (value: string) => void;
  onRevert: () => void;
}

export function ValueField({
  code,
  path,
  value,
  original,
  changed,
  matched,
  isReference,
  onChange,
  onRevert,
}: ValueFieldProps) {
  const meta = localeMeta(code);
  const area = useRef<HTMLTextAreaElement>(null);
  const fieldId = `f-${code}-${path.replace(/[^\w]/g, "-")}`;
  const issues = changed ? inspectValue(original ?? "", value) : [];
  const delta = original === undefined ? null : value.length - original.length;

  useLayoutEffect(() => {
    const element = area.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  return (
    <div
      className="sb-field"
      data-changed={changed || undefined}
      data-missing={original === undefined || undefined}
      data-matched={matched || undefined}
      data-invalid={issues.length > 0 || undefined}
    >
      <div className="sb-field__head">
        <label
          className="sb-field__code"
          htmlFor={fieldId}
          title={`${meta.name} — ${meta.native}`}
        >
          {code}
        </label>
        {isReference ? (
          <span className="sb-tag sb-tag--ref">reference</span>
        ) : null}
        {matched ? <span className="sb-tag sb-tag--match">match</span> : null}
        {original === undefined ? (
          <span className="sb-tag sb-tag--new">missing key</span>
        ) : null}
        <span className="sb-field__meta">
          {value.length} chars
          {changed && delta !== null && delta !== 0 ? (
            <b>{delta > 0 ? ` +${delta}` : ` ${delta}`}</b>
          ) : null}
        </span>
        {changed ? (
          <button type="button" className="sb-field__revert" onClick={onRevert}>
            <UndoIcon size={13} /> Revert
          </button>
        ) : null}
      </div>

      <textarea
        id={fieldId}
        ref={area}
        className="sb-textarea"
        rows={1}
        spellCheck={false}
        dir={meta.rtl ? "rtl" : undefined}
        lang={code}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />

      {issues.length > 0 ? (
        <ul className="sb-field__issues">
          {issues.map((issue) => (
            <li key={issue.kind}>
              {issue.kind === "empty"
                ? "This text is now empty. The fitting room will show a blank space."
                : null}
              {issue.kind === "missing-placeholder"
                ? `Lost ${issue.tokens
                    .map((token) => `{{${token}}}`)
                    .join(
                      ", "
                    )} — the fitting room fills that in automatically.`
                : null}
              {issue.kind === "extra-placeholder"
                ? `${issue.tokens
                    .map((token) => `{{${token}}}`)
                    .join(
                      ", "
                    )} is new here. It only shows up if the fitting room has that value.`
                : null}
              {issue.kind === "missing-tag"
                ? `Lost the <${issue.tokens.join(
                    ">, <"
                  )}> tag from the original.`
                : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
