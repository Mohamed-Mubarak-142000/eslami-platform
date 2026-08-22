export const tokens = {
  color: { canvas: "--ds-color-canvas", surface: "--ds-color-surface", surfaceRaised: "--ds-color-surface-raised", text: "--ds-color-text", textMuted: "--ds-color-text-muted", border: "--ds-color-border", primary: "--ds-color-primary", primaryContainer: "--ds-color-primary-container", accent: "--ds-color-accent", accentMuted: "--ds-color-accent-muted", accentContainer: "--ds-color-accent-container", danger: "--ds-color-danger", warning: "--ds-color-warning", success: "--ds-color-success", focus: "--ds-color-focus" },
  space: { 1: "--ds-space-1", 2: "--ds-space-2", 3: "--ds-space-3", 4: "--ds-space-4", 6: "--ds-space-6", 8: "--ds-space-8", 12: "--ds-space-12", 16: "--ds-space-16" },
  radius: { sm: "--ds-radius-sm", md: "--ds-radius-md", lg: "--ds-radius-lg", xl: "--ds-radius-xl", pill: "--ds-radius-pill" },
  motion: { fast: "--ds-duration-fast", normal: "--ds-duration-normal", slow: "--ds-duration-slow" },
} as const;

export type Theme = "light" | "dark";
export type Direction = "rtl" | "ltr";
export const cssVar = (token: string): `var(${string})` => `var(${token})`;
