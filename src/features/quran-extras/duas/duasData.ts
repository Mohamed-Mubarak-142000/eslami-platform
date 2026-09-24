export interface Dua {
  id: string;
  title: string;
  text: string;
  source: string;
}

// Seed content only — short, widely-known duas chosen for low transcription risk.
// A qualified religious reviewer should verify wording and sourcing before this list
// is treated as production-ready content (same "owner-confirm before launch" convention
// used elsewhere in this repo for unverified real-world data).
export const DUAS: Dua[] = [
  { id: "before-meal", title: "قبل الطعام", text: "بِسْمِ اللَّهِ", source: "حديث نبوي" },
  {
    id: "after-meal",
    title: "بعد الطعام",
    text: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ",
    source: "حديث نبوي",
  },
  {
    id: "leaving-home",
    title: "عند الخروج من المنزل",
    text: "بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    source: "حديث نبوي",
  },
  { id: "sleeping", title: "عند النوم", text: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", source: "حديث نبوي" },
  {
    id: "waking-up",
    title: "عند الاستيقاظ",
    text: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    source: "حديث نبوي",
  },
  {
    id: "travel",
    title: "عند الركوب والسفر",
    text: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ",
    source: "القرآن الكريم — سورة الزخرف",
  },
  {
    id: "for-parents",
    title: "دعاء للوالدين",
    text: "رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
    source: "القرآن الكريم — سورة الإسراء",
  },
];
