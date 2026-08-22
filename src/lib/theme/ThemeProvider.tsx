"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/** Activates the existing `[data-theme="dark"]` palette in `tokens.css`; owns persistence and system preference. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="data-theme" defaultTheme="system" enableSystem storageKey="basira-theme">
      {children}
    </NextThemesProvider>
  );
}
