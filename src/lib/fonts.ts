import { Alexandria, Amiri_Quran, Baloo_Bhaijaan_2, Cairo } from "next/font/google";
import localFont from "next/font/local";

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
/** KFGQPC Uthmanic Script Hafs, the typeface of the Madinah Mushaf. */
export const uthmanicHafs = localFont({
  src: "../assets/fonts/UthmanicHafs.woff2",
  weight: "400",
  variable: "--font-uthmanic-hafs",
  display: "swap",
});
export const baloo = Baloo_Bhaijaan_2({
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});

export const fontVariables = [cairo.variable, alexandria.variable, amiriQuran.variable, uthmanicHafs.variable, baloo.variable].join(" ");
