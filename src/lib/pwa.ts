/**
 * Minimal PWA plumbing for the Twister storefront (SCR-010 offline page, installable app).
 * Registration is opt-in — nothing calls `registerServiceWorker` yet; the future Twister root
 * layout (integration-agent) decides when to call it once real routes exist.
 */

export const manifestHref = "/manifest.webmanifest";
export const serviceWorkerUrl = "/sw.js";

export interface ServiceWorkerRegistrationResult {
  registered: boolean;
  error?: unknown;
}

/** No-ops safely outside the browser, on unsupported browsers, or if registration fails. */
export async function registerServiceWorker(swUrl: string = serviceWorkerUrl): Promise<ServiceWorkerRegistrationResult> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return { registered: false };
  try {
    await navigator.serviceWorker.register(swUrl);
    return { registered: true };
  } catch (error) {
    return { registered: false, error };
  }
}

/** True when running as an installed PWA (standalone display mode), for admin/offline UI cues. */
export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
  } catch {
    return false;
  }
}
