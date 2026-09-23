# Sizebay Translator

An editor for the fitting room and size chart texts. Pick the languages you want to change, find
a text by the words you can see in the store, edit every language side by side, and download
only the keys you changed, ready to merge into the live files.

Nothing leaves the browser. Files are read with the File API, edited in memory, and written back
with a download — the originals on disk are never touched.

## Install

Unzip at the **root of the project** — the archive carries the folder structure, so the files land
where they belong:

```
app/          layout.tsx · page.tsx · globals.css   (replaces the starter files)
components/   12 components
lib/          8 modules
scripts/      prepare-locales.mjs
```

```bash
unzip -o ~/Downloads/sizebay-translator.zip -d /path/to/the-project
```

The three files inside `app/` overwrite the `create-next-app` starter. That is intentional:
`globals.css` carries the whole design system and no longer imports Tailwind. If you want to keep
Tailwind for other pages, add `@import "tailwindcss";` back as the first line — nothing here
depends on it either way.

No new dependencies. Next, React and the DOM APIs cover everything, including the download.
Two things the project needs to already have:

1. **The `@/*` path alias**, which `create-next-app` sets up by default:
   ```json
   { "compilerOptions": { "paths": { "@/*": ["./*"] } } }
   ```
   If it points at `./src/*`, move `app/`, `components/` and `lib/` into `src/`.
2. **App Router**, which is what the `app/` folder already means.

## Add the standard texts

So nobody has to upload anything to get started, the standard files live in `public/locales`.
Point the script at the folder you already have and it installs them:

```bash
node scripts/prepare-locales.mjs ~/sizebay/locales
```

It reads every `.json` in that folder (one level of subfolders included), checks each one parses,
works out the language from the file name — `br.json`, `pt-BR.json` and `translations.esAR.json`
all resolve — copies it to `public/locales/<code>.json`, and writes a `manifest.json` the app
reads on load. Nothing in the source folder is modified, and re-running it is safe: that is how
you refresh the standard texts when they change.

The output tells you what it did, and names anything it skipped:

```
public/locales — 24 languages installed

  br       462 texts   br.json
  es       462 texts   es.json
  esAR     460 texts   esAR.json
  …

Skipped 1:
  copy of texts.json — no language code in the file name
```

Files with different key counts are fine — a key missing from one language shows up in the editor
with a dashed border, and typing in it creates the key.

Then `npm run dev`. Without `public/locales` the app still works; it simply offers the upload path
only, and says how to add the standard texts.

Fonts (Bricolage Grotesque, IBM Plex Sans, IBM Plex Mono) load from Google Fonts via
`app/layout.tsx`; swap in `next/font` if you would rather self-host.

## How it is used

1. **Choose where the texts come from.** Start from the standard texts, or upload your own files.
   Either way you can switch later, and mix the two — a standard language plus one file of your
   own for another.
2. **Pick the languages.** In standard mode that is the only step: choosing a language loads it.
   Codes come from `languages.all_langs` inside the files themselves, so they match the file names
   and the `lang` parameter exactly — including the ones that are not ISO: `br`, `cz`, `dk`, `gr`,
   `jp`, `vn`, and `uk`, which is British English while Ukrainian is `ukr`. Languages with no
   standard file are greyed out with the reason.
3. **Add files** (upload mode only). Drop them, drop a whole folder, pick them, or paste JSON.
   Anything ambiguous still loads, with a dropdown to correct the language.
4. **Find the text.** The search box matches the key path *and* the current text of every loaded
   language, ignoring accents, capitals, HTML tags and `{{variables}}`. Paste the sentence exactly
   as you see it in the store — even a rewritten one with the variables already filled in ("Ponte
   tu talla 38 de Nike…" finds `shoe_size.length_example`). The section rail turns into a hit map
   while you search.
5. **Edit.** One row per key, one field per language, the first one flagged as the reference. Pin
   any language to move it first.
6. **Save.** Each changed language downloads as `<file>.changes.json` (`br.json` becomes
   `br.changes.json`), holding only the keys you edited, nested exactly as in the original. Merge
   it into the file that is live on S3 so customer-specific keys you never loaded survive. The
   review drawer shows every before/after grouped by file and exports a Markdown report to send
   along with the change.

## The guards

Three things break the fitting room every time, so each is flagged inline as you type:

- **A lost `{{variable}}`** — the field turns red and says which one disappeared. `{{size}}`,
  `{{brandName}}` and friends are filled in automatically; a rewrite that drops them ships a
  sentence with a hole in it.
- **A lost HTML tag** — several texts carry `<strong>`, `<span class=…>` or `<a href=…>`.
- **An emptied value** — a blank string renders as a blank space.

None of them block saving. They are warnings, because sometimes dropping a variable is the point.

## Worth knowing

- **Only edited keys are written.** The download is a partial file: just the edited paths, with
  their original nesting, sorted by path. It is never the full file, so it cannot overwrite keys
  a customer already customised on S3. Deep-merge it into the live file instead of replacing it.
  Indentation is two spaces with a trailing newline.
- **Integer-like keys get hoisted.** JavaScript orders keys like `"0"`, `"1"`, `"2"` before string
  keys, so `subtitle: { "0": …, "box": … }` always serialises with `"0"` first. In these files
  they already are first, and JSON does not care about key order — but a diff might show the move.
- **Keys missing from a language** appear with a dashed border and a `missing key` tag. Typing in
  one creates it, nested containers included.
- **Numbers and booleans keep their type** when the new text still parses as one.
- **Unsaved changes survive** switching languages, adding files, and going back to the first
  screen. They do not survive a reload — the browser asks before you leave.

## Extending

- **A new language:** add one entry to `LOCALES` in `lib/locales.ts`, and the same code to the
  `CODES` array in `scripts/prepare-locales.mjs`. Set `rtl: true` and the fields flip direction;
  add a `note` and it shows up as a warning in the picker.
- **A new guard:** add a case to `inspectValue` in `lib/json.ts` and a line to the issue list in
  `components/ValueField.tsx`.
- **Search behaviour** lives in `lib/search.ts`. `normalize` decides what noise is ignored;
  `search` decides the ranking, including the token-overlap fallback that makes pasted sentences
  work.
- **Where the standard files come from** is `lib/defaults.ts` — one constant for the folder and
  the manifest shape.
