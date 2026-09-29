/** Client-only helpers for telling a real browser apart from an app's built-in webview. */

export function isIOS(): boolean {
  // iPadOS reports itself as a Mac, so also check for touch.
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/**
 * Facebook/Instagram/WhatsApp/… webviews. They can't install the app, Google refuses to sign in
 * inside them, and their cookies aren't shared with the phone's browser. "; wv)" marks any Android WebView.
 */
export function isInAppBrowser(): boolean {
  return /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|WhatsApp|Line\/|Snapchat|TikTok|musical_ly|BytedanceWebview|Twitter|LinkedInApp|; wv\)/i.test(
    navigator.userAgent,
  );
}

/** Leaves the in-app webview for the phone's real browser at `link` (an absolute https URL). */
export function openInRealBrowser(link: string) {
  const rest = link.replace(/^https?:\/\//, "");
  if (isIOS()) {
    // iOS 17+ hands this scheme to Safari; older versions ignore it, so callers keep manual steps on screen.
    window.location.href = `x-safari-https://${rest}`;
  } else {
    // Android: ask for Chrome, and fall back to the plain link if it isn't installed.
    window.location.href = `intent://${rest}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(link)};end`;
  }
}
