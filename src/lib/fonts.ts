import { Alexandria, Cairo } from "next/font/google";

/**
 * Loads Cairo/Alexandria via `next/font` and exposes them as CSS variables. Applying
 * `twisterFontVariables` on any ancestor element makes `--font-cairo`/`--font-alexandria`
 * resolve for that subtree; `src/components/layout/twister-shell.css` binds the design-system's
 * `--ds-font-ui`/`--ds-font-heading` tokens to these variables (design-system-agent intentionally
 * left the actual font loading to foundation — see its handoff's decisions).
 */
export const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

export const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-alexandria",
  display: "swap",
});

/** Apply on a root-ish wrapper (each Twister shell component applies this defensively). */
export const twisterFontVariables = `${cairo.variable} ${alexandria.variable}`;
