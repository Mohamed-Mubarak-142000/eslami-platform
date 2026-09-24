import { Moon } from "lucide-react";
import { daysBetween, getHijriDate, getNextRamadanStart } from "./hijriDate";
import "../quran-extras.css";

export function RamadanBanner() {
  const now = new Date();
  const hijri = getHijriDate(now);
  const nextRamadanStart = hijri.isRamadan ? null : getNextRamadanStart(now);
  const daysUntilRamadan = nextRamadanStart ? daysBetween(now, nextRamadanStart) : null;

  return (
    <section className="quran-extras-card quran-extras-card--ramadan">
      <h2><Moon size={18} aria-hidden /> {hijri.monthName} {hijri.year} هـ</h2>
      {hijri.isRamadan ? (
        <p>رمضان مبارك! أنت اليوم في اليوم {hijri.day} من رمضان، تقبّل الله منّا ومنكم.</p>
      ) : daysUntilRamadan !== null ? (
        <p>يفصلنا عن رمضان تقريبًا {daysUntilRamadan} يومًا (حساب تقريبي بتقويم أم القرى).</p>
      ) : null}
    </section>
  );
}
