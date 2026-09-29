"use client";

import { useSyncExternalStore } from "react";
import { isIOS, isInAppBrowser, openInRealBrowser } from "@/lib/browser";

export { isIOS };

/** Chromium's install prompt event; not in the DOM typings yet. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * - prompt: Chromium can show its own install dialog.
 * - ios: Safari/Chrome on iOS — the visitor adds it from the share sheet.
 * - in-app: Facebook/Instagram/… webviews, which cannot install at all; open a real browser first.
 */
export type InstallMode = "prompt" | "ios" | "in-app" | "installed" | "unsupported";

/** Added to the link we hand the real browser, so it opens the install steps on arrival. */
const INSTALL_PARAM = "install";

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
let arrivedToInstall = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

// Chrome fires beforeinstallprompt once, often before React mounts, so catch it at module load.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    emit();
  });

  const url = new URL(window.location.href);
  if (url.searchParams.has(INSTALL_PARAM)) {
    arrivedToInstall = true;
    url.searchParams.delete(INSTALL_PARAM);
    window.history.replaceState(window.history.state, "", url);
  }
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** Chrome on iOS puts the share button next to the address bar rather than in the bottom toolbar. */
export function isIOSChrome(): boolean {
  return /CriOS/.test(navigator.userAgent);
}

function getMode(): InstallMode {
  if (installed || isStandalone()) return "installed";
  if (deferred) return "prompt";
  if (isInAppBrowser() && (isIOS() || /Android/i.test(navigator.userAgent))) return "in-app";
  if (isIOS()) return "ios";
  return "unsupported";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useInstallMode(): InstallMode {
  return useSyncExternalStore(subscribe, getMode, () => "unsupported");
}

/** True when this page was opened from our "open in browser" link and the steps haven't been dismissed. */
export function useInstallArrival(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => arrivedToInstall,
    () => false,
  );
}

export function dismissInstallArrival() {
  if (!arrivedToInstall) return;
  arrivedToInstall = false;
  emit();
}

export function installLink(): string {
  const url = new URL(window.location.href);
  url.searchParams.set(INSTALL_PARAM, "1");
  return url.toString();
}

/** Leaves the in-app webview for the phone's real browser, landing on the same page with the install steps open. */
export function openInBrowser() {
  openInRealBrowser(installLink());
}

/** Opens the browser's own install dialog. Resolves true when the visitor accepts. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const event = deferred;
  // The event can only be used once.
  deferred = null;
  await event.prompt();
  const { outcome } = await event.userChoice;
  emit();
  return outcome === "accepted";
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
}
