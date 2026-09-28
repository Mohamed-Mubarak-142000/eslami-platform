const PIN_STORAGE_KEY = "al-manara:kids-parent-pin:v1";
const UNLOCK_SESSION_KEY = "al-manara:kids-parent-unlocked:v1";

// This PIN is a soft privacy gate to keep a child from wandering into the parent
// dashboard, not a real security boundary — everything lives in the browser's own
// localStorage, which anyone with device access can already read or clear.
async function hashPin(pin: string): Promise<string> {
  const bytes = new TextEncoder().encode(pin);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function hasParentPin(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PIN_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export async function setParentPin(pin: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PIN_STORAGE_KEY, await hashPin(pin));
  } catch {
    // Storage unavailable (private browsing) — the gate simply won't persist.
  }
}

export async function verifyParentPin(pin: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const stored = window.localStorage.getItem(PIN_STORAGE_KEY);
    if (!stored) return false;
    return stored === (await hashPin(pin));
  } catch {
    return false;
  }
}

export function clearParentPin(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PIN_STORAGE_KEY);
    window.sessionStorage.removeItem(UNLOCK_SESSION_KEY);
  } catch {
    // Ignore — nothing to clear if storage isn't available.
  }
}

export function isParentUnlockedThisSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(UNLOCK_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markParentUnlockedThisSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(UNLOCK_SESSION_KEY, "1");
  } catch {
    // Ignore — the gate will just ask again next render.
  }
}
