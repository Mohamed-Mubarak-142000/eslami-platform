/** Set per build in next.config.ts, so the page's copy and the server's differ once a new version is live. */
export const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";
