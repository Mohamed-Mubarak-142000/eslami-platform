export interface Topic {
  id: string;
  label: string;
  description: string;
}

export interface SampleQuestion {
  id: string;
  question: string;
  answer: string;
}

// Placeholder scaffold only, from the archived "بصيرة" product vision: generic study
// categories (not attributed to any named scholar) and generic, uncontroversial sample
// Q&A. Real topic pages, sourced answers, and scholar profiles need real content and a
// documented review process before this ships as anything but a shell.
export const TOPICS: Topic[] = [
  { id: "aqeedah", label: "العقيدة", description: "أصول الإيمان وأركانه." },
  { id: "fiqh", label: "الفقه", description: "أحكام العبادات والمعاملات." },
  { id: "seerah", label: "السيرة النبوية", description: "سيرة النبي محمد ﷺ وأصحابه." },
  { id: "akhlaq", label: "الأخلاق والتزكية", description: "الآداب الإسلامية وتهذيب النفس." },
];

export const SAMPLE_QUESTIONS: SampleQuestion[] = [
  { id: "pillars-of-islam", question: "كم عدد أركان الإسلام؟", answer: "خمسة: الشهادتان، والصلاة، والزكاة، وصوم رمضان، وحج البيت لمن استطاع إليه سبيلًا." },
  { id: "pillars-of-iman", question: "كم عدد أركان الإيمان؟", answer: "ستة: الإيمان بالله، وملائكته، وكتبه، ورسله، واليوم الآخر، والقدر خيره وشره." },
];
