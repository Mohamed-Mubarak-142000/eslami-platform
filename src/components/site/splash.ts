// Shared by the server layout and the client splash — kept out of the "use client" module so the
// layout gets the real string, not a client reference.
export const SPLASH_SEEN_KEY = "splash-seen";

/**
 * Runs in <head> before first paint: a visitor who already saw the splash this session never gets
 * even a flash of it on reloads.
 */
export const SPLASH_BOOT_SCRIPT = `try{if(sessionStorage.getItem("${SPLASH_SEEN_KEY}"))document.documentElement.dataset.splash="off"}catch(e){}`;
