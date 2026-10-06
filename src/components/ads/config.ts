/** AdSense publisher ID (ca-pub-…). Ads stay off everywhere while it is unset. */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";
/** The responsive display unit every slot uses. */
export const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT ?? "";

export const adsEnabled = Boolean(ADSENSE_CLIENT && ADSENSE_SLOT);
