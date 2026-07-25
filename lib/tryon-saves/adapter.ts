import {
  TRYON_LOCAL_KEY,
  TRYON_SAVES_MAX,
  type TryOnSave,
} from './types';

function readLocal(userId: string): TryOnSave[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRYON_LOCAL_KEY(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TryOnSave[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(userId: string, items: TryOnSave[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    TRYON_LOCAL_KEY(userId),
    JSON.stringify(items.slice(0, TRYON_SAVES_MAX))
  );
}

export const tryonSavesAdapter = {
  loadLocal(userId: string): TryOnSave[] {
    return readLocal(userId);
  },

  upsertLocal(userId: string, item: TryOnSave): TryOnSave[] {
    const prev = readLocal(userId).filter((s) => s.id !== item.id);
    const next = [item, ...prev].slice(0, TRYON_SAVES_MAX);
    writeLocal(userId, next);
    return next;
  },

  removeLocal(userId: string, id: string): TryOnSave[] {
    const next = readLocal(userId).filter((s) => s.id !== id);
    writeLocal(userId, next);
    return next;
  },

  replaceLocal(userId: string, items: TryOnSave[]) {
    writeLocal(userId, items);
  },
};

/** Client-side download (works for remote + data URLs). */
export async function downloadTryOnImage(
  url: string,
  filename = 'streetplayr-tryon.jpg'
) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

/** Persist remote AI result as data URL when server save is unavailable. */
export async function imageUrlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not read try-on image');
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not encode try-on image'));
    reader.readAsDataURL(blob);
  });
}
