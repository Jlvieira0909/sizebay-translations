const MAX_FILES = 120;

function isJson(file: File): boolean {
  return /\.json$/i.test(file.name) || file.type === 'application/json';
}

async function readDirectory(entry: FileSystemDirectoryEntry, depth: number): Promise<File[]> {
  if (depth > 3) return [];
  const reader = entry.createReader();

  const batch = await new Promise<FileSystemEntry[]>((resolve) => {
    reader.readEntries(
      (entries) => resolve(entries),
      () => resolve([]),
    );
  });

  const files: File[] = [];
  for (const child of batch) {
    files.push(...(await readEntry(child, depth + 1)));
  }
  return files;
}

async function readEntry(entry: FileSystemEntry, depth = 0): Promise<File[]> {
  if (entry.isFile) {
    const file = await new Promise<File | null>((resolve) => {
      (entry as FileSystemFileEntry).file(
        (value) => resolve(value),
        () => resolve(null),
      );
    });
    return file && isJson(file) ? [file] : [];
  }
  if (entry.isDirectory) return readDirectory(entry as FileSystemDirectoryEntry, depth);
  return [];
}

/** Accepts loose files and whole dropped folders (Chrome, Edge, Firefox, Safari). */
export async function filesFromDrop(transfer: DataTransfer): Promise<File[]> {
  const items = Array.from(transfer.items ?? []);
  const entries = items
    .map((item) => (typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null))
    .filter((entry): entry is FileSystemEntry => Boolean(entry));

  if (entries.length) {
    const nested = await Promise.all(entries.map((entry) => readEntry(entry)));
    return nested.flat().slice(0, MAX_FILES);
  }

  return Array.from(transfer.files ?? [])
    .filter(isJson)
    .slice(0, MAX_FILES);
}

export function filesFromInput(list: FileList | null): File[] {
  return Array.from(list ?? [])
    .filter(isJson)
    .slice(0, MAX_FILES);
}

export function downloadText(fileName: string, text: string, mime = 'application/json'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke late: Safari needs the URL alive while the download starts.
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Browsers drop rapid-fire downloads, so they are staggered. */
export async function downloadMany(files: { name: string; text: string }[]): Promise<void> {
  for (const [index, file] of files.entries()) {
    downloadText(file.name, file.text);
    if (index < files.length - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 320));
    }
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
