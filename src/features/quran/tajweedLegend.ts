/**
 * The tajweed colour key of the King Fahd Complex's tajweed mushaf. The colours are read from the V4
 * page fonts' CPAL palettes: `light` from palette 0, `dark` from palette 1 (the night and dusk pages).
 */
export interface TajweedLegendEntry {
  name: string;
  light: string;
  dark: string;
  explanation: string;
}

export const TAJWEED_LEGEND: readonly TajweedLegendEntry[] = [
  { name: "مد ٦ حركات لزومًا", light: "#b50000", dark: "#e30000", explanation: "المد اللازم، يُمد ست حركات." },
  {
    name: "مد واجب ٤ أو ٥ حركات",
    light: "#f40000",
    dark: "#ff5e8e",
    explanation: "المد المتصل والمنفصل، يُمد أربع أو خمس حركات.",
  },
  { name: "مد ٢ أو ٤ أو ٦ جوازًا", light: "#ff7b00", dark: "#ff8e3b", explanation: "المد العارض للسكون عند الوقف." },
  { name: "مد حركتان", light: "#ce9e00", dark: "#ffc1e0", explanation: "المد الطبيعي، حركتان." },
  {
    name: "إخفاء، ومواضع الغنة (حركتان)",
    light: "#09b000",
    dark: "#26b55d",
    explanation: "الغنة في الإخفاء والإدغام بغنة والإقلاب والنون والميم المشددتين.",
  },
  { name: "إدغام، وما لا يُلفظ", light: "#a5a5a5", dark: "#9d9999", explanation: "حرف يُدغم فيما بعده أو يُكتب ولا يُنطق." },
  { name: "تفخيم الراء", light: "#3f48e6", dark: "#3c84d5", explanation: "راء تُنطق مفخّمة." },
  { name: "قلقلة", light: "#2fadff", dark: "#00deff", explanation: "حروف «قطب جد» الساكنة تُنطق بنبرة." },
];
