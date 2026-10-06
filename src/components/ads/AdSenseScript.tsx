import Script from "next/script";
import { ADSENSE_CLIENT } from "./config";

/**
 * Loaded from the (site) layout only, so the Mushaf reader, the kids area and the auth pages never
 * fetch it. Idle-time loading keeps it off the critical path. Needs only the publisher ID, so the
 * site can be verified with AdSense before any ad unit exists.
 */
export function AdSenseScript() {
  if (!ADSENSE_CLIENT) return null;
  return (
    <Script
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      strategy="lazyOnload"
      crossOrigin="anonymous"
    />
  );
}
