import { Alexandria, Amiri_Quran, Baloo_Bhaijaan_2, Cairo } from "next/font/google";

export const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});
export const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-alexandria",
  display: "swap",
});
export const amiriQuran = Amiri_Quran({ subsets: ["arabic"], weight: "400", variable: "--font-amiri-quran", display: "swap" });
export const baloo = Baloo_Bhaijaan_2({
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});

export const fontVariables = [cairo.variable, alexandria.variable, amiriQuran.variable, baloo.variable].join(" ");
