"use client";

import { useState } from "react";
import { Award, Printer } from "lucide-react";
import "../quran-kids.css";

const CHILD_NAME_STORAGE_KEY = "al-manara:kids-child-name:v1";

function loadSavedChildName(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(CHILD_NAME_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveChildName(name: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHILD_NAME_STORAGE_KEY, name);
  } catch {
    // Storage unavailable — the name just won't be remembered next time.
  }
}

export function CompletionCertificate({ surahName }: { surahName: string }) {
  const [childName, setChildName] = useState(loadSavedChildName);
  const today = new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "long", day: "numeric" }).format(new Date());

  function handlePrint() {
    saveChildName(childName);
    window.print();
  }

  return (
    <section className="quran-certificate-panel">
      <label className="quran-certificate-panel__name-field">
        <span>اسم الطفل (اختياري)</span>
        <input
          type="text"
          value={childName}
          onChange={(event) => setChildName(event.currentTarget.value)}
          placeholder="اكتب الاسم ليظهر في الشهادة"
        />
      </label>

      <button type="button" className="quran-certificate-panel__print" onClick={handlePrint}>
        <Printer size={16} aria-hidden /> اطبع الشهادة
      </button>

      <div className="quran-certificate" aria-hidden>
        <Award size={40} className="quran-certificate__icon" />
        <p className="quran-certificate__kicker">شهادة إتمام حفظ</p>
        <h2 className="quran-certificate__title">سورة {surahName}</h2>
        {childName && <p className="quran-certificate__name">تُمنح هذه الشهادة إلى: {childName}</p>}
        <p className="quran-certificate__date">بتاريخ {today}</p>
      </div>
    </section>
  );
}
