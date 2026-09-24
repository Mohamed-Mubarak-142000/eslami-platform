/**
 * SSR-safe, private-browsing-safe localStorage access. Every localStorage-backed repository in
 * `src/lib/repositories` goes through this module instead of touching `window.localStorage`
 * directly, so a future real backend can swap the storage layer without touching call sites.
 */

export interface JsonStorage {
  readJson<T>(key: string, fallback: T): T;
  writeJson<T>(key: string, value: T): void;
  remove(key: string): void;
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const probeKey = "__twister_storage_probe__";
    window.localStorage.setItem(probeKey, "1");
    window.localStorage.removeItem(probeKey);
    return window.localStorage;
  } catch {
    // Private browsing, blocked site data, or a disabled storage API.
    return null;
  }
}

export const localJsonStorage: JsonStorage = {
  readJson<T>(key: string, fallback: T): T {
    const storage = getLocalStorage();
    if (!storage) return fallback;
    try {
      const raw = storage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  writeJson<T>(key: string, value: T): void {
    const storage = getLocalStorage();
    if (!storage) return;
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota exceeded or storage blocked mid-session: fail silently, keep in-memory state working.
    }
  },
  remove(key: string): void {
    getLocalStorage()?.removeItem(key);
  },
};
