import { DEFAULT_KIDS_PROGRESS, type KidsProgressState } from "./progressTypes";
import { kidsProgressSchema } from "./progressSchema";

const STORAGE_KEY = "al-manara:kids-progress:v1";

export function loadKidsProgress(): KidsProgressState {
  if (typeof window === "undefined") return DEFAULT_KIDS_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_KIDS_PROGRESS;
    const parsed = kidsProgressSchema.safeParse(JSON.parse(raw));
    return parsed.success ? (parsed.data as KidsProgressState) : DEFAULT_KIDS_PROGRESS;
  } catch {
    return DEFAULT_KIDS_PROGRESS;
  }
}

export function saveKidsProgress(state: KidsProgressState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable (private browsing) — progress simply won't persist this session.
  }
}
