import { ADSENSE_CLIENT } from "./config";

/**
 * Loaded from the (site) layout only, so the Mushaf reader, the kids area and the auth pages never
 * fetch it. A plain async <script> (React hoists it into <head> and dedupes it) rather than
 * next/script, because AdSense site verification looks for the tag in the server-rendered HTML.
 * Needs only the publisher ID, so the site can be verified before any ad unit exists.
 */
export function AdSenseScript() {
  if (!ADSENSE_CLIENT) return null;
  return (
    <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`} crossOrigin="anonymous" />
  );
}
