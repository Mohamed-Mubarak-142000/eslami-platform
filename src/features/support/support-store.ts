"use client";

import { useSyncExternalStore } from "react";

/** Any link with ?support (emails, posts, the app) opens the sheet on arrival. */
const SUPPORT_PARAM = "support";

let open = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
  const url = new URL(window.location.href);
  if (url.searchParams.has(SUPPORT_PARAM)) {
    open = true;
    url.searchParams.delete(SUPPORT_PARAM);
    window.history.replaceState(window.history.state, "", url);
  }
}

export function openSupportSheet() {
  open = true;
  emit();
}

export function closeSupportSheet() {
  open = false;
  emit();
}

export function useSupportSheetOpen(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => open,
    () => false,
  );
}
