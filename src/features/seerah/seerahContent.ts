import evidence from "./seerahEvidence.json";
import map from "./arabiaMap.json";

/*
 * The seerah as a timeline of events, each a chapter of short beats the reader steps through over a
 * map of Arabia or a scene. The hadiths and verses are built by scripts/build-seerah.mjs, so only the
 * narration is written here: in our own words, following the account in «الرحيق المختوم», and kept to
 * what the sources agree on — see CONTENT.md. No verse or hadith is quoted in the narration itself;
 * a beat points to its evidence instead. Plain data only: the app copies this file unchanged.
 *
 * Nothing here pictures the Prophet ﷺ or his companions; the stage is the land, its places and the
 * sky — never a figure.
 */

export type HadithKey = keyof typeof evidence.hadiths;
export type VerseKey = keyof typeof evidence.verses;

export const HADITHS = evidence.hadiths as Record<HadithKey, { text: string; grade: string; attribution: string; url: string }>;
export const VERSES = evidence.verses as Record<
  VerseKey,
  { text: string; surah: number; surahName: string; ayah: number; partial: boolean; audio: number }
>;

// ---------------------------------------------------------------------------------------------
// The map

/** The land of Arabia and its neighbours as one SVG path, in map units (see arabiaMap.json). */
export const MAP = { width: map.width, height: map.height, land: map.land };

export interface Point {
  x: number;
  y: number;
}

/** Where a latitude and longitude fall on the map — the projection scripts/build-seerah.mjs drew it with. */
export function project(lat: number, lon: number): Point {
  return { x: (lon - map.bounds.west) * map.cosLat * map.scale, y: (map.bounds.north - lat) * map.scale };
}

/**
 * Places at their modern coordinates; Hunayn's valley is placed approximately. `side` is where the
 * name sits, so neighbours such as Makkah and Thawr don't write over each other.
 */
export const PLACES = {
  makkah: { name: "مكة", lat: 21.4225, lon: 39.8262, side: "left" },
  thawr: { name: "غار ثور", lat: 21.3777, lon: 39.8497, side: "right" },
  hira: { name: "غار حراء", lat: 21.4576, lon: 39.8579, side: "right" },
  aqabah: { name: "العقبة بمنى", lat: 21.4207, lon: 39.873, side: "right" },
  arafah: { name: "عرفة", lat: 21.3549, lon: 39.9841, side: "right" },
  hudaybiyah: { name: "الحديبية", lat: 21.4436, lon: 39.615, side: "left" },
  taif: { name: "الطائف", lat: 21.2703, lon: 40.4158, side: "right" },
  hunayn: { name: "حنين", lat: 21.52, lon: 40.06, side: "right" },
  madinah: { name: "المدينة", lat: 24.4672, lon: 39.6111, side: "left" },
  quba: { name: "قباء", lat: 24.4393, lon: 39.6172, side: "right" },
  uhud: { name: "جبل أحد", lat: 24.5025, lon: 39.6142, side: "right" },
  badr: { name: "بدر", lat: 23.7808, lon: 38.7906, side: "left" },
  khaybar: { name: "خيبر", lat: 25.6956, lon: 39.2917, side: "right" },
  tabuk: { name: "تبوك", lat: 28.3998, lon: 36.57, side: "right" },
  mutah: { name: "مؤتة", lat: 31.0806, lon: 35.7006, side: "right" },
  busra: { name: "بُصرى الشام", lat: 32.5176, lon: 36.481, side: "right" },
  aqsa: { name: "المسجد الأقصى", lat: 31.7761, lon: 35.2358, side: "left" },
  madain: { name: "المدائن", lat: 33.0936, lon: 44.5808, side: "right" },
  abyssinia: { name: "الحبشة", lat: 14.1211, lon: 38.7234, side: "right" },
} satisfies Record<string, { name: string; lat: number; lon: number; side: "left" | "right" }>;

export type PlaceId = keyof typeof PLACES;

/** The way out of Madinah to the south, by Dhul-Hulayfah and down the inland road to Makkah's side. */
const MADINAH_SOUTH: [number, number][] = [
  [24.4672, 39.6111],
  [24.41, 39.54],
  [23.6, 39.25],
  [22.78, 39.2],
  [22.0, 39.35],
];

/** The caravan road north from Madinah through al-Ula and Tabuk toward Syria. */
const MADINAH_NORTH: [number, number][] = [
  [24.4672, 39.6111],
  [25.3, 39.0],
  [26.0, 38.4],
  [26.79, 37.95],
  [27.6, 37.2],
  [28.3998, 36.57],
];

/**
 * Journeys as [lat, lon] waypoints. The sources name the stations, not their coordinates, so these
 * trace the way's general course; the chapter says so where it draws one.
 */
export const ROUTES = {
  "to-sham": [[21.4225, 39.8262], [22.6, 39.45], ...MADINAH_NORTH, [30.19, 35.73], [32.5176, 36.481]],
  "to-abyssinia": [
    [21.4225, 39.8262],
    [21.0, 39.5],
    [19.6, 39.4],
    [17.2, 39.9],
    [15.6, 39.45],
    [14.95, 39.1],
    [14.1211, 38.7234],
  ],
  "to-taif": [
    [21.4225, 39.8262],
    [21.38, 40.0],
    [21.3, 40.22],
    [21.2703, 40.4158],
  ],
  "to-thawr": [
    [21.4225, 39.8262],
    [21.402, 39.836],
    [21.3777, 39.8497],
  ],
  /** Down to the coast, north along the Tihama shore past Usfan, Qudayd and al-Kharrar, then inland to Quba. */
  hijrah: [
    [21.3777, 39.8497],
    [21.31, 39.6],
    [21.5, 39.27],
    [21.92, 39.3],
    [22.3, 39.22],
    [22.78, 39.14],
    [23.3, 39.02],
    [23.78, 39.12],
    [24.15, 39.35],
    [24.4393, 39.6172],
  ],
  "to-badr": [
    [24.4672, 39.6111],
    [24.2, 39.32],
    [23.98, 39.05],
    [23.7808, 38.7906],
  ],
  "to-hudaybiyah": [...MADINAH_SOUTH, [21.6, 39.5], [21.4436, 39.615]],
  "to-khaybar": [
    [24.4672, 39.6111],
    [25.0, 39.5],
    [25.6956, 39.2917],
  ],
  "to-mutah": [...MADINAH_NORTH, [30.19, 35.73], [31.0806, 35.7006]],
  conquest: [...MADINAH_SOUTH, [21.55, 39.68], [21.4225, 39.8262]],
  /** Out to Hunayn's valley, then on to besiege al-Taif. */
  "to-hunayn": [
    [21.4225, 39.8262],
    [21.5, 39.95],
    [21.52, 40.06],
    [21.4, 40.25],
    [21.2703, 40.4158],
  ],
  "to-tabuk": MADINAH_NORTH,
  farewell: [...MADINAH_SOUTH, [21.6, 39.55], [21.4225, 39.8262]],
  "to-arafah": [
    [21.4225, 39.8262],
    [21.4207, 39.873],
    [21.3549, 39.9841],
  ],
} satisfies Record<string, [number, number][]>;

export type RouteId = keyof typeof ROUTES;

/** The routes that cross the sea; every other waypoint is on land (tests/seerah.test.ts checks). */
export const AT_SEA: RouteId[] = ["to-abyssinia"];

export function routePoints(route: RouteId): Point[] {
  return ROUTES[route].map(([lat, lon]) => project(lat, lon));
}

/** A route's length in map units: what a drawing stroke dashes over. */
export function routeLength(route: RouteId): number {
  const points = routePoints(route);
  return points.slice(1).reduce((sum, point, index) => sum + Math.hypot(point.x - points[index]!.x, point.y - points[index]!.y), 0);
}

/** The point a given share of the way along a route: where the travelling light is. */
export function pointAlong(route: RouteId, share: number): Point {
  const points = routePoints(route);
  let remaining = Math.max(0, Math.min(1, share)) * routeLength(route);
  for (let index = 1; index < points.length; index++) {
    const from = points[index - 1]!;
    const to = points[index]!;
    const segment = Math.hypot(to.x - from.x, to.y - from.y);
    if (remaining <= segment) {
      const t = segment ? remaining / segment : 0;
      return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    }
    remaining -= segment;
  }
  return points[points.length - 1]!;
}

export interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The part of the map a beat looks at: the places it names, padded, and never closer than `minSpan`
 * map units (a degree of latitude is 60; the default keeps the coast in view). Square; the stage shows
 * more on its long sides.
 */
export function frameAround(places: PlaceId[], minSpan = 150): Frame {
  const points = places.map((id) => project(PLACES[id].lat, PLACES[id].lon));
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const span = Math.max(minSpan, (Math.max(...xs) - Math.min(...xs)) * 1.6, (Math.max(...ys) - Math.min(...ys)) * 1.6);
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  return { x: cx - span / 2, y: cy - span / 2, width: span, height: span };
}

/** Where the whole map sits, for the opening frame. */
export const WHOLE_MAP: Frame = { x: 0, y: 0, width: map.width, height: map.height };

// ---------------------------------------------------------------------------------------------
// The story

export type SceneId =
  "night" | "cave" | "mountain" | "kaaba" | "masjid" | "dunes" | "sea" | "uhud" | "trench" | "tree" | "letter" | "arafah";

export type Stage =
  /**
   * The map, framed on `focus` (no closer than `span` map units); `route` is drawn up to `upTo`
   * (all of it when left out), `glow` lights places.
   */
  { kind: "map"; focus: PlaceId[]; span?: number; route?: RouteId; upTo?: number; glow?: PlaceId[] } | { kind: "scene"; scene: SceneId };

export interface Beat {
  /** One to three short sentences. */
  text: string;
  stage: Stage;
  hadith?: HadithKey;
  verse?: VerseKey;
}

export interface Era {
  id: string;
  title: string;
  /** The years it spans, as shown. */
  span: string;
}

export interface SeerahEvent {
  id: string;
  era: string;
  title: string;
  /** The date as shown, Hijri first where there is one. */
  date: string;
  /** The approximate Gregorian year: the timeline's order. */
  year: number;
  /** His age ﷺ in lunar years, and whether the sources fix it or it is reckoned from the year; left out where the date itself is disputed. */
  age?: number;
  exactAge?: boolean;
  summary: string;
  /** The chapter; an event without beats is on the timeline and its chapter is still being written. */
  beats: Beat[];
  lesson?: string;
}

export const ERAS: Era[] = [
  { id: "before", title: "قبل البعثة", span: "٥٧١ – ٦١٠م" },
  { id: "makkah", title: "الدعوة في مكة", span: "١٣ سنة" },
  { id: "hijrah", title: "الهجرة", span: "١ هـ" },
  { id: "madinah", title: "في المدينة", span: "١ – ٨ هـ" },
  { id: "victory", title: "الفتح وما بعده", span: "٨ – ١١ هـ" },
];

export const SEERAH_EVENTS: SeerahEvent[] = [
  {
    id: "birth",
    era: "before",
    title: "المولد في عام الفيل",
    date: "عام الفيل، نحو ٥٧١م",
    year: 571,
    age: 0,
    exactAge: true,
    summary: "وُلد ﷺ في مكة يتيمًا؛ مات أبوه عبد الله قبل مولده، ثم ماتت أمه آمنة وهو في السادسة، فكفله جده عبد المطلب ثم عمه أبو طالب.",
    lesson: "نشأ ﷺ يتيمًا يرعى الغنم، لم يكن له من الدنيا ما يتكبّر به، فصنعه الله على عينه، فكان أرحم الناس باليتيم والضعيف.",
    beats: [
      {
        text: "في العام الذي جاء فيه أبرهة بجيشه وفيله يريد هدم الكعبة، فردّه الله عنها، وُلد محمد ﷺ في مكة.",
        stage: { kind: "map", focus: ["makkah"], glow: ["makkah"] },
        verse: "elephant",
      },
      {
        text: "وُلد في بني هاشم من قريش، أشرف بيوت العرب نسبًا، من ذرية إسماعيل بن إبراهيم عليهما السلام.",
        stage: { kind: "scene", scene: "kaaba" },
        hadith: "lineage",
      },
      {
        text: "مات أبوه عبد الله قبل أن يولد، ثم ماتت أمه آمنة وهو ابن ست سنين، فكفله جده عبد المطلب، فلما مات كفله عمه أبو طالب.",
        stage: { kind: "scene", scene: "night" },
      },
      {
        text: "واستُرضع في بادية بني سعد، وفي صغره جاءه جبريل وهو يلعب مع الغلمان، فشقّ صدره وغسل قلبه بماء زمزم.",
        stage: { kind: "scene", scene: "dunes" },
        hadith: "opened-chest",
      },
      {
        text: "وشبّ يرعى الغنم لأهل مكة بأجر يسير، كما رعاها الأنبياء من قبله.",
        stage: { kind: "scene", scene: "night" },
        hadith: "shepherd",
      },
    ],
  },
  {
    id: "khadijah",
    era: "before",
    title: "الزواج من خديجة",
    date: "نحو ٥٩٥م",
    year: 595,
    age: 25,
    summary: "عُرف بين قومه بالصادق الأمين، وخرج في تجارة لخديجة بنت خويلد إلى الشام، ثم تزوجها، فكانت أول من آمن به بعد ذلك.",
    lesson: "الأمانة رأس مال: بها عرفه الناس قبل النبوة، وبها اختارته خديجة. والوفاء يبقى بعد الموت.",
    beats: [
      {
        text: "عُرف في قومه بالصادق الأمين، فعرضت عليه خديجة بنت خويلد، وهي ذات شرف ومال، أن يخرج في تجارتها إلى الشام.",
        stage: { kind: "map", focus: ["makkah", "busra"], route: "to-sham", glow: ["busra"] },
      },
      {
        text: "فرجع بربح وفير، وحدّثها غلامها ميسرة بما رأى من صدقه وأمانته، فرغبت فيه، فتزوجها وهو ابن خمس وعشرين.",
        stage: { kind: "map", focus: ["makkah"], glow: ["makkah"] },
      },
      {
        text: "فكانت خير زوج له: لم يتزوج عليها أحدًا حتى ماتت، وولدت له أولاده كلهم إلا إبراهيم.",
        stage: { kind: "scene", scene: "night" },
        hadith: "khadijah-only",
      },
      {
        text: "وبشّرها النبي ﷺ ببيت في الجنة من قصب، لا صخب فيه ولا نصب.",
        stage: { kind: "scene", scene: "night" },
        hadith: "khadijah-house",
      },
      {
        text: "وبقي يذكرها بعد موتها بسنين، ويذبح الشاة فيبعث بها إلى صديقاتها وفاءً لها.",
        stage: { kind: "scene", scene: "dunes" },
        hadith: "khadijah-memory",
      },
    ],
  },
  {
    id: "black-stone",
    era: "before",
    title: "بناء الكعبة ووضع الحجر",
    date: "نحو ٦٠٥م",
    year: 605,
    age: 35,
    summary: "أعادت قريش بناء الكعبة، واختلفت القبائل فيمن يضع الحجر الأسود، فحكّموه، فوضعه في ثوب وأخذت كل قبيلة بطرفه، ثم وضعه بيده.",
    lesson: "حكمةٌ تجمع ولا تفرّق: أعطى كل قبيلة نصيبها من الشرف، فانطفأت فتنة كادت تشتعل.",
    beats: [
      {
        text: "تصدّعت الكعبة، فأجمعت قريش على هدمها وإعادة بنائها، واشترطوا ألا يُدخلوا في بنائها إلا مالًا طيبًا.",
        stage: { kind: "scene", scene: "kaaba" },
      },
      {
        text: "فلما بلغ البناء موضع الحجر الأسود اختلفوا: كل قبيلة تريد أن تنال شرف وضعه، حتى كادوا يقتتلون.",
        stage: { kind: "map", focus: ["makkah"], glow: ["makkah"] },
      },
      {
        text: "فاتفقوا أن يحكّموا أول من يدخل عليهم، فكان محمدًا ﷺ، فقالوا: هذا الأمين، رضينا به.",
        stage: { kind: "scene", scene: "kaaba" },
      },
      {
        text: "فبسط ثوبًا ووضع الحجر في وسطه، وأمر كل قبيلة أن تأخذ بطرف منه، فرفعوه جميعًا، ثم وضعه بيده في مكانه.",
        stage: { kind: "scene", scene: "kaaba" },
      },
    ],
  },
  {
    id: "revelation",
    era: "makkah",
    title: "نزول الوحي في غار حراء",
    date: "٦١٠م",
    year: 610,
    age: 40,
    exactAge: true,
    summary: "كان يخلو بغار حراء يتعبّد الليالي ذوات العدد، فجاءه جبريل بأول ما نزل من القرآن: أوائل سورة العلق.",
    lesson: "بدأت الرسالة بالقراءة، وبدأ تثبيته ﷺ ببيت مؤمن: زوجة عرفت خُلقه فطمأنته. ومن كان في عون الناس كان الله في عونه.",
    beats: [
      {
        text: "كان أول ما بدأ به الوحي الرؤيا الصالحة في النوم، فكان لا يرى رؤيا إلا جاءت مثل فلق الصبح.",
        stage: { kind: "scene", scene: "night" },
        hadith: "first-revelation",
      },
      {
        text: "ثم حُبّب إليه الخلاء، فكان يخلو في غار حراء الليالي ذوات العدد يتعبّد، ثم يرجع إلى خديجة فيتزوّد لمثلها.",
        stage: { kind: "map", focus: ["makkah", "hira"], span: 24, glow: ["hira"] },
      },
      {
        text: "حتى جاءه الملك وهو في الغار فقال له: اقرأ، فقال: ما أنا بقارئ، ثلاث مرات، ثم أقرأه أول ما نزل من القرآن.",
        stage: { kind: "scene", scene: "mountain" },
        verse: "iqra",
      },
      {
        text: "فرجع بها يرجف فؤاده، فدخل على خديجة فقال: زمّلوني، فطمأنته وذكّرته بأنه يصل الرحم ويحمل الضعيف ويُكرم الضيف، وأن الله لا يخزيه أبدًا.",
        stage: { kind: "map", focus: ["makkah", "hira"], span: 24, glow: ["makkah"] },
      },
      {
        text: "فانطلقت به إلى ابن عمها ورقة بن نوفل، وكان قد قرأ كتب أهل الكتاب، فأخبره أن هذا الملك هو الذي نزل على موسى.",
        stage: { kind: "scene", scene: "night" },
      },
      {
        text: "ثم فتر الوحي مدة، ثم رأى الملك الذي جاءه بحراء جالسًا بين السماء والأرض، فنزلت أوائل سورة المدثر تأمره بالإنذار، وتتابع الوحي.",
        stage: { kind: "scene", scene: "mountain" },
        hadith: "the-pause",
        verse: "arise",
      },
    ],
  },
  {
    id: "public-call",
    era: "makkah",
    title: "من الدعوة السرية إلى الجهر بها",
    date: "نحو ٦١٣م",
    year: 613,
    age: 43,
    summary: "دعا ثلاث سنين سرًّا، ثم أُمر بالجهر بالدعوة، فاشتد أذى قريش عليه وعلى المستضعفين من أصحابه.",
    lesson: "ثبات بلا عنف: أوذي ﷺ في نفسه وفي أصحابه، فلم يردّ إلا بالصبر والدعوة، وعلّمهم أن العاقبة لمن صبر.",
    beats: [
      {
        text: "بدأ يدعو سرًّا من يثق به، فآمنت خديجة، وأبو بكر، وعلي، وزيد بن حارثة، وقليل من الضعفاء والموالي.",
        stage: { kind: "scene", scene: "night" },
        hadith: "first-believers",
      },
      {
        text: "فلما أُمر بإنذار عشيرته الأقربين صعد الصفا ونادى بطون قريش، فسألهم: لو أخبرتكم أن خيلًا بالوادي تريد أن تغير عليكم، أكنتم مصدّقيّ؟ قالوا: ما جرّبنا عليك كذبًا.",
        stage: { kind: "map", focus: ["makkah"], glow: ["makkah"] },
        hadith: "safa",
        verse: "warn-kin",
      },
      {
        text: "فاشتد أذى قريش: كان يصلي عند الكعبة، فجاء أحدهم بسلا جزور فوضعه على ظهره وهو ساجد، حتى جاءت فاطمة فطرحته عنه.",
        stage: { kind: "scene", scene: "kaaba" },
        hadith: "entrails",
      },
      {
        text: "وخنقه عقبة بن أبي معيط بردائه وهو يصلي خنقًا شديدًا، حتى جاء أبو بكر فدفعه عنه.",
        stage: { kind: "scene", scene: "kaaba" },
        hadith: "strangled",
      },
      {
        text: "وعُذّب المستضعفون من أصحابه، فشكوا إليه وهو متوسّد بردة في ظل الكعبة، فذكّرهم بصبر من قبلهم، وأخبرهم أن الله سيُتمّ هذا الأمر.",
        stage: { kind: "scene", scene: "night" },
        hadith: "khabbab",
      },
    ],
  },
  {
    id: "abyssinia",
    era: "makkah",
    title: "الهجرة إلى الحبشة",
    date: "نحو ٦١٥م",
    year: 615,
    age: 45,
    summary: "أذن لأصحابه في الهجرة إلى الحبشة، عند ملك لا يُظلم عنده أحد، فهاجروا إليها مرتين.",
    lesson: "حين تضيق الأرض يجعل الله فيها سعة: لجأ المسلمون إلى ملك عادل، فحفظ الله بهم دينهم حتى جاء الفرج.",
    beats: [
      {
        text: "لما اشتد البلاء على أصحابه أذن لهم بالهجرة إلى الحبشة، فإن بها ملكًا لا يُظلم عنده أحد.",
        stage: { kind: "map", focus: ["makkah", "abyssinia"], glow: ["makkah"] },
      },
      {
        text: "فخرجوا سرًّا، وركبوا البحر من ساحل الحجاز إلى الضفة الأخرى، فكانت أول هجرة في الإسلام، ثم تبعتها هجرة ثانية أكثر عددًا.",
        stage: { kind: "map", focus: ["makkah", "abyssinia"], route: "to-abyssinia", glow: ["abyssinia"] },
      },
      {
        text: "وأرسلت قريش إلى النجاشي تسأله أن يردّهم، فسمع من جعفر بن أبي طالب ما يدعو إليه الإسلام، وما نزل في عيسى ومريم، فأبى أن يسلّمهم.",
        stage: { kind: "scene", scene: "sea" },
      },
      {
        text: "ولما مات النجاشي نعاه النبي ﷺ لأصحابه في اليوم الذي مات فيه، وخرج بهم فصلّى عليه.",
        stage: { kind: "map", focus: ["abyssinia"], glow: ["abyssinia"] },
        hadith: "najashi-prayer",
      },
      {
        text: "وبقي جعفر ومن معه هناك سنين حتى قدموا على النبي ﷺ بعد فتح خيبر، فقال لأهل السفينة: لكم هجرتان.",
        stage: { kind: "scene", scene: "sea" },
        hadith: "ship-people",
      },
    ],
  },
  {
    id: "sorrow",
    era: "makkah",
    title: "عام الحزن والطائف",
    date: "نحو ٦١٩م",
    year: 619,
    age: 50,
    summary: "ماتت خديجة ومات أبو طالب في عام واحد، ثم خرج إلى الطائف يدعو أهلها فردّوه وآذوه، فرجع صابرًا يدعو لهم.",
    lesson: "في أشد أيامه لم يدعُ على من آذاه، بل رجا هداية ذرّيتهم، وقد دخلت ثقيف في الإسلام بعد ذلك.",
    beats: [
      {
        text: "في عام واحد ماتت خديجة سنده في بيته، ومات عمه أبو طالب الذي كان يمنعه من قريش، فاشتد أذاهم عليه بعدهما.",
        stage: { kind: "scene", scene: "night" },
      },
      {
        text: "فخرج إلى الطائف يدعو ثقيفًا إلى الله لعلهم ينصرونه، فردّوه أقبح الرد، وأغروا به سفهاءهم.",
        stage: { kind: "map", focus: ["makkah", "taif"], route: "to-taif", glow: ["taif"] },
      },
      {
        text: "فانطلق مهمومًا حتى أفاق في الطريق، فإذا سحابة قد أظلّته فيها جبريل، ومعه ملك الجبال يقول: إن شئت أطبقت عليهم الجبلين.",
        stage: { kind: "scene", scene: "mountain" },
        hadith: "taif",
      },
      {
        text: "فقال ﷺ: بل أرجو أن يُخرج الله من أصلابهم من يعبد الله وحده لا يشرك به شيئًا.",
        stage: { kind: "scene", scene: "dunes" },
      },
      {
        text: "ثم رجع إلى مكة يواصل دعوته، ويعرض نفسه على القبائل في مواسم الحج.",
        stage: { kind: "map", focus: ["makkah", "taif"], route: "to-taif", glow: ["makkah"] },
      },
    ],
  },
  {
    id: "isra",
    era: "makkah",
    title: "الإسراء والمعراج",
    date: "قبل الهجرة",
    year: 620,
    summary: "أُسري به ليلًا من المسجد الحرام إلى المسجد الأقصى، ثم عُرج به إلى السماء، وفُرضت الصلوات الخمس.",
    lesson: "جاءت الرحلة تكريمًا وتثبيتًا له في سنوات الشدة، وفيها فُرضت الصلاة، فهي صلة المؤمن بربه كل يوم.",
    beats: [
      {
        text: "أُسري به ﷺ في ليلة من المسجد الحرام إلى المسجد الأقصى.",
        stage: { kind: "map", focus: ["makkah", "aqsa"], glow: ["makkah", "aqsa"] },
        verse: "isra",
      },
      {
        text: "ثم عُرج به إلى السماوات، فلقي فيها الأنبياء، حتى انتهى إلى سدرة المنتهى.",
        stage: { kind: "scene", scene: "night" },
        hadith: "sidrah",
      },
      {
        text: "وفُرضت عليه الصلاة خمسين، فما زال يسأل ربه التخفيف حتى صارت خمس صلوات في كل يوم وليلة.",
        stage: { kind: "scene", scene: "night" },
        hadith: "five-prayers",
      },
      {
        text: "وأصبح يحدّث قريشًا بما رأى، فكذّبوه وسألوه عن صفة بيت المقدس، فجلّاه الله له فجعل يخبرهم عنه.",
        stage: { kind: "scene", scene: "kaaba" },
        hadith: "quraysh-ask",
      },
    ],
  },
  {
    id: "aqabah",
    era: "makkah",
    title: "بيعتا العقبة",
    date: "٦٢١ – ٦٢٢م",
    year: 621,
    age: 52,
    summary: "لقيه نفر من أهل يثرب في موسم الحج فأسلموا، ثم بايعوه في العام التالي على نصرته، فكانت يثرب دار الهجرة.",
    lesson: "بدأ الأمر بنفر قليل عند العقبة، فصار مدينة كاملة: لا تحقرنّ دعوة صادقة لعدد قليل.",
    beats: [
      {
        text: "كان ﷺ يعرض نفسه على القبائل في مواسم الحج، فلقي عند العقبة بمنى نفرًا من الخزرج من أهل يثرب، فدعاهم فأسلموا.",
        stage: { kind: "map", focus: ["makkah", "aqabah"], span: 24, glow: ["aqabah"] },
      },
      {
        text: "فرجعوا إلى قومهم يدعونهم، وفي الموسم التالي جاء منهم اثنا عشر رجلًا فبايعوه على ألا يشركوا بالله شيئًا، ولا يسرقوا، ولا يزنوا.",
        stage: { kind: "map", focus: ["makkah", "aqabah"], span: 24, glow: ["aqabah"] },
        hadith: "aqabah-pledge",
      },
      {
        text: "فبعث معهم مصعب بن عمير يعلّمهم القرآن، فانتشر الإسلام في دور يثرب.",
        stage: { kind: "map", focus: ["makkah", "madinah"], glow: ["madinah"] },
        hadith: "first-emigrants",
      },
      {
        text: "وفي العام الذي يليه جاءه منهم بضعة وسبعون، فبايعوه ليلًا عند العقبة على أن ينصروه ويمنعوه مما يمنعون منه أنفسهم وأهليهم.",
        stage: { kind: "scene", scene: "night" },
      },
      {
        text: "فصارت يثرب دار الإسلام، وبدأ المسلمون يهاجرون إليها.",
        stage: { kind: "map", focus: ["makkah", "madinah"], glow: ["makkah", "madinah"] },
      },
    ],
  },
  {
    id: "hijrah",
    era: "hijrah",
    title: "الهجرة إلى المدينة",
    date: "ربيع الأول ١ هـ، ٦٢٢م",
    year: 622,
    age: 53,
    exactAge: true,
    summary: "خرج من مكة مع أبي بكر الصديق، فاختبأ في غار ثور ثلاثًا، ثم سلك طريق الساحل حتى بلغ قباء ثم المدينة.",
    lesson:
      "لم تكن الهجرة فرارًا بلا تدبير؛ أخذ ﷺ بكل سبب: صاحبٌ أمين، ودليلٌ خبير، وطريقٌ غير مطروق، ومن يعفّي الأثر ويأتي بالخبر. ثم توكّل على الله توكّلًا تامًّا: «ما ظنك باثنين الله ثالثهما».",
    beats: [
      {
        text: "ثلاث عشرة سنة يدعو في مكة، ثم أُذن له بالهجرة. وكان أصحابه قد سبقوه إلى يثرب سرًّا، أفرادًا وجماعات.",
        stage: { kind: "map", focus: ["makkah", "madinah"], glow: ["makkah", "madinah"] },
        hadith: "mission-years",
      },
      {
        text: "خرج المسلمون الأولون يُقرئون أهلها القرآن، ثم تتابع المهاجرون، حتى لم يبق بمكة إلا قليل.",
        stage: { kind: "map", focus: ["makkah", "madinah"], glow: ["madinah"] },
        hadith: "first-emigrants",
      },
      {
        text: "واجتمعت قريش تتشاور في أمره: أيحبسونه، أم يقتلونه، أم يخرجونه؟ واتفقوا على قتله ليلًا.",
        stage: { kind: "scene", scene: "kaaba" },
        verse: "plot",
      },
      {
        text: "في تلك الليلة خرج ﷺ ومعه صاحبه أبو بكر الصديق، فاتّجها جنوبًا إلى غار ثور، على غير طريق المدينة.",
        stage: { kind: "map", focus: ["makkah", "thawr"], span: 24, route: "to-thawr", glow: ["thawr"] },
      },
      {
        text: "مكثا في الغار ثلاث ليال، وجاء الطلب حتى وقفوا على باب الغار. قال أبو بكر: لو نظر أحدهم إلى قدميه لأبصرنا.",
        stage: { kind: "scene", scene: "cave" },
        hadith: "cave",
        verse: "two-in-the-cave",
      },
      {
        text: "وبعد ثلاث جاءهما الدليل الذي استأجراه بالراحلتين، فسلكوا طريق الساحل: غربًا نحو البحر، ثم شمالًا بمحاذاته، بعيدًا عن الطريق المعهود.",
        stage: { kind: "map", focus: ["makkah", "madinah"], route: "hijrah", upTo: 0.35 },
      },
      {
        text: "وجعلت قريش لمن يأتي بهما دية كل واحد منهما. فلحقهم سراقة بن مالك على فرسه، فساخت قوائمها في الأرض، فطلب الأمان، وسأله ﷺ أن يُخفي عنهم.",
        stage: { kind: "map", focus: ["makkah", "madinah"], route: "hijrah", upTo: 0.55 },
        hadith: "arrival",
      },
      {
        text: "وكان أهل المدينة يخرجون كل صباح إلى الحرّة ينتظرونه حتى يردّهم الحرّ، حتى بلغ قباء يوم الاثنين في ربيع الأول، فأقام فيها وأسّس أول مسجد.",
        stage: { kind: "map", focus: ["quba", "madinah"], span: 40, route: "hijrah", glow: ["quba"] },
        hadith: "quba-and-mosque",
      },
      {
        text: "ثم دخل المدينة والناس حوله، حتى بركت ناقته في مِربد لغلامين يتيمين، فاشتراه منهما وبنى عليه مسجده، وكان ينقل اللَّبِن بيده مع أصحابه.",
        stage: { kind: "scene", scene: "masjid" },
        hadith: "arrival",
      },
      {
        text: "ونزل ضيفًا على أبي أيوب الأنصاري، فكان أبو أيوب يتحرّج أن يمشي فوق رأسه، حتى تحوّل ﷺ إلى العلو.",
        stage: { kind: "scene", scene: "masjid" },
        hadith: "abu-ayyub",
      },
      {
        text: "وقدم المهاجرون وليس في أيديهم شيء، فقاسمهم الأنصار ثمار أموالهم، فكانت المدينة أول مجتمع للمسلمين.",
        stage: { kind: "map", focus: ["madinah"], glow: ["madinah"] },
        hadith: "ansar-share",
        verse: "ansar",
      },
      {
        text: "وأصابت حمّى المدينة بعض أصحابه، فدعا: «اللهم حبّب إلينا المدينة كحبنا مكة أو أشد».",
        stage: { kind: "scene", scene: "dunes" },
        hadith: "love-of-madinah",
      },
    ],
  },
  {
    id: "badr",
    era: "madinah",
    title: "غزوة بدر",
    date: "رمضان ٢ هـ",
    year: 624,
    age: 55,
    summary: "يوم الفرقان: التقى ثلاثمئة وبضعة عشر رجلًا بجيش قريش، فنصرهم الله نصرًا عزيزًا.",
    lesson: "قلّة مع الله غالبة: كانوا ثلث عدوّهم، فأخذوا بالأسباب ثم ألحّوا في الدعاء، فجاء النصر من عند الله.",
    beats: [
      {
        text: "في رمضان من السنة الثانية خرج ﷺ في ثلاثمئة وبضعة عشر رجلًا، يريدون قافلة لقريش عائدة من الشام.",
        stage: { kind: "map", focus: ["madinah", "badr"], route: "to-badr", glow: ["badr"] },
        hadith: "badr-count",
      },
      {
        text: "فنجت القافلة، وخرجت قريش في نحو ألف مقاتل، فاستشار أصحابه، فأجمعوا على لقاء عدوهم.",
        stage: { kind: "map", focus: ["madinah", "badr"], route: "to-badr", glow: ["badr"] },
      },
      {
        text: "ووقف يدعو ربه مستقبل القبلة مادًّا يديه: اللهم أنجز لي ما وعدتني، حتى سقط رداؤه عن منكبيه.",
        stage: { kind: "scene", scene: "night" },
        hadith: "badr-dua",
        verse: "badr-call",
      },
      {
        text: "والتقى الجمعان عند ماء بدر، فنصر الله المؤمنين، وقُتل أبو جهل وكثير من سادة قريش.",
        stage: { kind: "map", focus: ["badr"], span: 40, glow: ["badr"] },
        hadith: "abu-jahl",
        verse: "badr-help",
      },
      {
        text: "وكان أهل بدر بعدها من أفضل المسلمين.",
        stage: { kind: "scene", scene: "dunes" },
        hadith: "badr-people",
      },
    ],
  },
  {
    id: "uhud",
    era: "madinah",
    title: "غزوة أحد",
    date: "شوال ٣ هـ",
    year: 625,
    age: 56,
    summary: "كانت الجولة للمسلمين ثم نزل الرماة عن الجبل، فاستُشهد سبعون، منهم حمزة عم النبي ﷺ.",
    lesson: "مخالفة أمر واحد غيّرت مجرى يوم كامل: الطاعة في وقتها نصر، والنصر ليس بالعدد وحده.",
    beats: [
      {
        text: "جاءت قريش في السنة الثالثة بجيش كبير تريد الثأر لبدر، فخرج إليهم ﷺ حتى نزل عند جبل أحد شمال المدينة.",
        stage: { kind: "map", focus: ["madinah", "uhud"], span: 30, glow: ["uhud"] },
      },
      {
        text: "وجعل خمسين من الرماة على جبل صغير، وأمّر عليهم عبد الله بن جبير، وقال: لا تبرحوا مكانكم ولو رأيتمونا تخطفنا الطير.",
        stage: { kind: "scene", scene: "uhud" },
        hadith: "archers",
      },
      {
        text: "وكانت الجولة أول النهار للمسلمين، فلما رأى أكثر الرماة هزيمة المشركين نزلوا يطلبون الغنيمة، فأتى المشركون المسلمين من خلفهم.",
        stage: { kind: "scene", scene: "uhud" },
      },
      {
        text: "واضطرب المسلمون، وجُرح النبي ﷺ في وجهه، وكُسرت رباعيته، وثبت حوله نفر من أصحابه يفدونه.",
        stage: { kind: "map", focus: ["madinah", "uhud"], span: 30, glow: ["uhud"] },
        hadith: "wounds",
      },
      {
        text: "واستُشهد يومئذ سبعون من أصحابه، منهم عمه حمزة بن عبد المطلب.",
        stage: { kind: "scene", scene: "night" },
        hadith: "hamza",
      },
      {
        text: "ونزل القرآن يواسيهم ويرفع رؤوسهم، وبقي ﷺ يحب أحدًا، ويقول: جبل يحبنا ونحبه.",
        stage: { kind: "scene", scene: "uhud" },
        hadith: "uhud-loves",
        verse: "uhud-comfort",
      },
    ],
  },
  {
    id: "khandaq",
    era: "madinah",
    title: "غزوة الخندق",
    date: "٥ هـ",
    year: 627,
    age: 58,
    summary: "تحزّبت القبائل على المدينة، فحفر المسلمون الخندق، ثم ردّ الله الأحزاب بريح وجنود لم يروها.",
    lesson: "خطة لم تعرفها العرب ردّت جيشًا عظيمًا، والقائد يحفر مع جنده ويجوع معهم.",
    beats: [
      {
        text: "تحزّبت قريش وغطفان وقبائل أخرى في جيش لم تعرف العرب مثله، يريدون استئصال المسلمين في المدينة.",
        stage: { kind: "map", focus: ["madinah"], glow: ["madinah"] },
      },
      {
        text: "فحفر المسلمون خندقًا في الجهة المكشوفة من المدينة، والنبي ﷺ ينقل التراب معهم حتى غطّى بطنه، وهو يرتجز.",
        stage: { kind: "scene", scene: "trench" },
        hadith: "trench-dig",
      },
      {
        text: "واعترضتهم صخرة شديدة، فنزل إليها وقد عصب بطنه بحجر من الجوع، فضربها بالمعول فعادت رملًا.",
        stage: { kind: "scene", scene: "trench" },
        hadith: "trench-rock",
      },
      {
        text: "وحاصر الأحزاب المدينة أيامًا، واشتد الخوف والبرد والجوع، ونقضت بنو قريظة عهدها مع المسلمين.",
        stage: { kind: "scene", scene: "night" },
        verse: "confederates-fear",
      },
      {
        text: "ثم أرسل الله على الأحزاب ريحًا شديدة في ليلة باردة، فرحلوا خائبين.",
        stage: { kind: "scene", scene: "trench" },
        hadith: "confederates-night",
        verse: "confederates-wind",
      },
      {
        text: "فقال ﷺ: الآن نغزوهم ولا يغزوننا، نحن نسير إليهم. وكان كما قال.",
        stage: { kind: "map", focus: ["madinah"], glow: ["madinah"] },
        hadith: "now-we-march",
      },
    ],
  },
  {
    id: "hudaybiyah",
    era: "madinah",
    title: "صلح الحديبية",
    date: "ذو القعدة ٦ هـ",
    year: 628,
    age: 59,
    summary: "خرج معتمرًا فصدّته قريش، فصالحها على وضع الحرب عشر سنين، فسمّاه الله فتحًا مبينًا، وأسلم بعده خلق كثير.",
    lesson: "ما يبدو تنازلًا قد يكون فتحًا: صبر الصحابة على شروط شقّت عليهم، فجعل الله فيها خيرًا كثيرًا.",
    beats: [
      {
        text: "في ذي القعدة من السنة السادسة خرج ﷺ معتمرًا في ألف وأربعمئة من أصحابه، يسوقون الهدي، لا يريدون قتالًا.",
        stage: { kind: "map", focus: ["madinah", "makkah"], route: "to-hudaybiyah", glow: ["hudaybiyah"] },
      },
      {
        text: "فصدّتهم قريش عن مكة، فنزلوا الحديبية على بئر قليلة الماء نزحوها حتى لم يبق فيها قطرة، فجاشت بالماء ببركته ﷺ.",
        stage: { kind: "map", focus: ["hudaybiyah", "makkah"], span: 40, glow: ["hudaybiyah"] },
        hadith: "hudaybiyah-well",
      },
      {
        text: "وبايعه أصحابه تحت الشجرة على ألا يفرّوا، فكانت بيعة الرضوان.",
        stage: { kind: "scene", scene: "tree" },
        hadith: "ridwan",
        verse: "tree-pledge",
      },
      {
        text: "ثم كتب الصلح مع قريش: أن يرجع المسلمون عامهم هذا، وأن توضع الحرب بين الفريقين، وشروطًا رأى فيها بعض الصحابة غضاضة.",
        stage: { kind: "scene", scene: "letter" },
        hadith: "treaty",
      },
      {
        text: "فنحروا هديهم وحلقوا، ورجعوا، ونزلت في طريق العودة سورة الفتح.",
        stage: { kind: "map", focus: ["madinah", "makkah"], route: "to-hudaybiyah", glow: ["madinah"] },
        verse: "clear-victory",
      },
      {
        text: "وكان الصلح فتحًا حقًّا: أمن الناس واختلطوا بالمسلمين وسمعوا منهم، فدخل في الإسلام بعده أكثر ممن دخل قبله.",
        stage: { kind: "scene", scene: "dunes" },
      },
    ],
  },
  {
    id: "letters",
    era: "madinah",
    title: "الكتب إلى الملوك",
    date: "٦ – ٧ هـ",
    year: 628,
    age: 60,
    summary: "بعد الحديبية كتب إلى كسرى وقيصر والنجاشي وغيرهم من الملوك يدعوهم إلى الإسلام.",
    lesson: "رسالة للعالمين: من مدينة صغيرة خرجت كتب تدعو أعظم ملوك الأرض إلى الله، بلغة واضحة لا تملّق فيها.",
    beats: [
      {
        text: "بعد صلح الحديبية أمن المسلمون، فكتب ﷺ إلى الملوك يدعوهم إلى الله: إلى كسرى، وقيصر، والنجاشي، وغيرهم.",
        stage: { kind: "map", focus: ["madinah", "busra", "madain", "abyssinia"], glow: ["madinah"] },
        hadith: "letters",
      },
      {
        text: "واتخذ خاتمًا من فضة نُقش فيه: محمد رسول الله، في ثلاثة أسطر، يختم به كتبه.",
        stage: { kind: "scene", scene: "letter" },
        hadith: "seal",
      },
      {
        text: "وبلغ كتابه هرقل ملك الروم وهو بالشام، فسأل أبا سفيان عن النبي ﷺ أسئلة، ثم قال: ليبلغنّ ملكه ما تحت قدميّ.",
        stage: { kind: "map", focus: ["madinah", "busra"], glow: ["busra"] },
        hadith: "heraclius",
        verse: "common-word",
      },
      {
        text: "وأما كسرى فمزّق كتابه، فدعا عليهم النبي ﷺ أن يُمزَّقوا كل ممزّق.",
        stage: { kind: "map", focus: ["madinah", "madain"], glow: ["madain"] },
        hadith: "kisra",
      },
    ],
  },
  {
    id: "khaybar",
    era: "madinah",
    title: "فتح خيبر",
    date: "٧ هـ",
    year: 628,
    age: 60,
    summary: "سار إلى خيبر فحاصر حصونها واحدًا بعد واحد حتى فتحها الله، وقدم عليه فيها مهاجرو الحبشة.",
    lesson: "النصر بعد الصبر: الذين حوصروا في الخندق قبل سنتين صاروا يفتحون حصون من حزّب الأحزاب عليهم.",
    beats: [
      {
        text: "في أول السنة السابعة سار ﷺ إلى خيبر، حصون اليهود شمال المدينة، التي خرج منها من حزّب الأحزاب على المسلمين.",
        stage: { kind: "map", focus: ["madinah", "khaybar"], route: "to-khaybar", glow: ["khaybar"] },
        hadith: "khaybar-march",
      },
      {
        text: "فوصلوها فجرًا، فلما رآهم أهلها خارجين إلى أعمالهم قالوا: محمد والجيش! فقال ﷺ: الله أكبر، خربت خيبر.",
        stage: { kind: "map", focus: ["khaybar"], span: 40, glow: ["khaybar"] },
        hadith: "khaybar-dawn",
      },
      {
        text: "وحاصر حصونها حصنًا بعد حصن، وأعطى الراية عليّ بن أبي طالب بعد أن تفل في عينيه فبرأتا، ففتح الله على يديه.",
        stage: { kind: "scene", scene: "dunes" },
        hadith: "ali-flag",
      },
      {
        text: "وصالح أهلها على أن يعملوا في نخلها وأرضها، ولهم نصف ما يخرج منها.",
        stage: { kind: "map", focus: ["khaybar"], span: 40, glow: ["khaybar"] },
      },
      {
        text: "وفيها قدم جعفر بن أبي طالب ومن معه من الحبشة بعد سنين من الغربة، ففرح بهم النبي ﷺ.",
        stage: { kind: "scene", scene: "sea" },
        hadith: "ship-people",
      },
    ],
  },
  {
    id: "mutah",
    era: "madinah",
    title: "غزوة مؤتة",
    date: "جمادى الأولى ٨ هـ",
    year: 629,
    age: 61,
    summary: "أول لقاء مع الروم: استُشهد الأمراء الثلاثة واحدًا بعد واحد، ثم أخذ خالد الراية ففتح الله عليه.",
    lesson: "لم تسقط الراية حين سقط حاملها، بل حملها الذي يليه: هكذا تبقى الدعوات بعد أصحابها.",
    beats: [
      {
        text: "بعث ﷺ جيشًا إلى مؤتة على تخوم الشام، وأمّر عليهم زيد بن حارثة، وقال: إن قُتل زيد فجعفر، وإن قُتل جعفر فعبد الله بن رواحة.",
        stage: { kind: "map", focus: ["madinah", "mutah"], route: "to-mutah", glow: ["mutah"] },
        hadith: "mutah-commanders",
      },
      {
        text: "فلقوا جموعًا عظيمة من الروم ومن معهم، فقاتل الأمراء الثلاثة حتى استُشهدوا واحدًا بعد واحد.",
        stage: { kind: "map", focus: ["mutah"], span: 60, glow: ["mutah"] },
      },
      {
        text: "وكان ﷺ في المدينة يخبر أصحابه بما يجري، وعيناه تذرفان: أخذ الراية زيد فأصيب، ثم جعفر، ثم ابن رواحة، ثم أخذها خالد ففُتح عليه.",
        stage: { kind: "scene", scene: "masjid" },
        hadith: "mutah-news",
      },
      {
        text: "وأخبر أنه رأى جعفرًا يطير في الجنة مع الملائكة.",
        stage: { kind: "scene", scene: "night" },
        hadith: "jafar",
      },
      {
        text: "وثبت خالد بن الوليد بالجيش، وقد انقطعت في يده يومئذ تسعة أسياف، حتى رجع بالناس.",
        stage: { kind: "map", focus: ["madinah", "mutah"], route: "to-mutah", glow: ["madinah"] },
        hadith: "khalid-swords",
      },
    ],
  },
  {
    id: "fath",
    era: "victory",
    title: "فتح مكة",
    date: "رمضان ٨ هـ",
    year: 630,
    age: 61,
    summary: "دخل مكة فاتحًا متواضعًا، فطهّر الكعبة من الأصنام، وعفا عن أهلها الذين آذوه وأخرجوه.",
    lesson: "دخل منتصرًا بلا انتقام: البلد الذي أخرجه فُتح له، فكان أول ما فعله أن طهّر البيت وعفا.",
    beats: [
      {
        text: "نقضت قريش صلح الحديبية حين أعانت حلفاءها على خزاعة حلفاء النبي ﷺ، فتجهّز لفتح مكة وكتم وجهته.",
        stage: { kind: "map", focus: ["madinah"], glow: ["madinah"] },
      },
      {
        text: "وكتب حاطب بن أبي بلتعة إلى قريش يخبرهم، فأطلع الله نبيّه، فأُدرك الكتاب في الطريق، وعفا ﷺ عن حاطب لأنه شهد بدرًا.",
        stage: { kind: "scene", scene: "letter" },
        hadith: "hatib",
      },
      {
        text: "وخرج في رمضان في جيش عظيم لم تر مكة مثله، حتى نزل قريبًا منها.",
        stage: { kind: "map", focus: ["madinah", "makkah"], route: "conquest", glow: ["makkah"] },
      },
      {
        text: "ودخل مكة فاتحًا، وأمّن أهلها: من دخل المسجد، أو أغلق عليه بابه، أو دخل دار أبي سفيان، فهو آمن.",
        stage: { kind: "map", focus: ["makkah"], span: 40, glow: ["makkah"] },
      },
      {
        text: "وطاف بالبيت وحوله ثلاثمئة وستون صنمًا، فجعل يطعنها بعود في يده ويتلو قول الله تعالى:",
        stage: { kind: "scene", scene: "kaaba" },
        hadith: "idols",
        verse: "truth-came",
      },
      {
        text: "ودخل الكعبة فصلّى فيها، ثم عفا عن أهل مكة الذين آذوه وأخرجوه وقاتلوه.",
        stage: { kind: "scene", scene: "kaaba" },
        hadith: "in-the-kaaba",
      },
      {
        text: "وخشي الأنصار أن يقيم في بلده بعد أن فتحها الله عليه، فقال لهم: المحيا محياكم، والممات مماتكم.",
        stage: { kind: "map", focus: ["makkah", "madinah"], glow: ["madinah"] },
        hadith: "ansar-fath",
      },
    ],
  },
  {
    id: "hunayn",
    era: "victory",
    title: "حنين والطائف",
    date: "شوال ٨ هـ",
    year: 630,
    age: 61,
    summary: "بعد الفتح بأيام لقي هوازن في وادي حنين، فانكشف المسلمون أول الأمر ثم ثبتوا حوله فنصرهم الله.",
    lesson: "الكثرة لا تُغني: من أعجبته قوته وُكل إليها، وعاد النصر مع الثبات حول النبي ﷺ.",
    beats: [
      {
        text: "بعد الفتح بأيام جمعت هوازن جموعها، فخرج إليهم ﷺ في أكبر جيش اجتمع للمسلمين حتى يومئذ، فأعجبتهم كثرتهم.",
        stage: { kind: "map", focus: ["makkah", "hunayn"], span: 50, route: "to-hunayn", upTo: 0.37, glow: ["hunayn"] },
        verse: "hunayn",
      },
      {
        text: "وكمن لهم العدو في الوادي، فرشقوهم بالنبل، فانكشف كثير من الناس، وثبت ﷺ على بغلته البيضاء.",
        stage: { kind: "scene", scene: "dunes" },
        hadith: "hunayn",
      },
      {
        text: "وأمر عمّه العباس أن ينادي: يا أصحاب السمرة، فأقبلوا إليه، فنصرهم الله.",
        stage: { kind: "map", focus: ["hunayn"], span: 40, glow: ["hunayn"] },
      },
      {
        text: "ثم سار إلى الطائف فحاصرها أيامًا فلم تُفتح، فرجع عنها.",
        stage: { kind: "map", focus: ["makkah", "taif"], span: 50, route: "to-hunayn", glow: ["taif"] },
        hadith: "taif-siege",
      },
      {
        text: "وجاءه وفد هوازن مسلمين، فردّ عليهم سبيهم.",
        stage: { kind: "scene", scene: "dunes" },
        hadith: "hawazin",
      },
    ],
  },
  {
    id: "tabuk",
    era: "victory",
    title: "غزوة تبوك",
    date: "رجب ٩ هـ",
    year: 630,
    age: 62,
    summary: "آخر غزواته: خرج في شدة الحر والعسرة إلى تبوك، فلم يلق قتالًا، وتخلّف المنافقون.",
    lesson: "الصدق نجّى: الذين اعتذروا بالكذب ظنّوا أنهم نجوا، والذين صدقوا تاب الله عليهم وخلّد ذكرهم في القرآن.",
    beats: [
      {
        text: "في السنة التاسعة، في حر شديد وعسرة، أعلن ﷺ وجهته صراحة على غير عادته: الروم في الشام، ليتأهّب الناس.",
        stage: { kind: "map", focus: ["madinah", "tabuk"], glow: ["tabuk"] },
        hadith: "tabuk-plain",
      },
      {
        text: "وأنفق الصحابة في تجهيز الجيش، وتخلّف المنافقون بأعذار كاذبة، وتخلّف ثلاثة من الصادقين بلا عذر.",
        stage: { kind: "map", focus: ["madinah"], glow: ["madinah"] },
      },
      {
        text: "وسار بالجيش حتى بلغ تبوك، وأصابتهم مجاعة، فدعا بما بقي من أزوادهم فبارك فيها حتى ملؤوا أوعيتهم.",
        stage: { kind: "map", focus: ["madinah", "tabuk"], route: "to-tabuk", glow: ["tabuk"] },
        hadith: "tabuk-food",
      },
      {
        text: "وأقام بتبوك أيامًا لم يلق فيها قتالًا، ثم رجع، فخرج الصبيان يتلقّونه عند ثنية الوداع.",
        stage: { kind: "map", focus: ["madinah", "tabuk"], route: "to-tabuk", glow: ["madinah"] },
        hadith: "welcome-back",
      },
      {
        text: "وصدق كعب بن مالك وصاحباه فلم يعتذروا بباطل، فهُجروا خمسين ليلة حتى اشتد بهم الكرب، ثم نزلت توبتهم.",
        stage: { kind: "scene", scene: "night" },
        hadith: "kab",
        verse: "three-left",
      },
    ],
  },
  {
    id: "farewell",
    era: "victory",
    title: "حجة الوداع",
    date: "ذو الحجة ١٠ هـ",
    year: 632,
    age: 63,
    summary: "حجّ بالناس حجته الوحيدة، وخطبهم بعرفة، ونزلت فيها آية إكمال الدين.",
    lesson: "خطبة واحدة جمعت حرمة الدماء والأموال، وحق المرأة، والتمسك بكتاب الله، ثم أشهد الله على البلاغ.",
    beats: [
      {
        text: "في السنة العاشرة أعلن ﷺ أنه حاجّ، فاجتمع إليه خلق كثير يريدون أن يأتمّوا به، فخرج من المدينة إلى مكة.",
        stage: { kind: "map", focus: ["madinah", "makkah"], route: "farewell", glow: ["makkah"] },
      },
      {
        text: "وطاف بالبيت على بعيره، يستلم الركن بمحجن معه.",
        stage: { kind: "scene", scene: "kaaba" },
        hadith: "tawaf-camel",
      },
      {
        text: "ثم مضى إلى عرفة، فخطب الناس: إن دماءكم وأموالكم حرام عليكم، وأوصاهم بالنساء، وترك فيهم كتاب الله.",
        stage: { kind: "map", focus: ["makkah", "arafah"], span: 30, route: "to-arafah", glow: ["arafah"] },
        hadith: "jabir-hajj",
      },
      {
        text: "ثم سألهم: وأنتم تُسألون عني، فما أنتم قائلون؟ قالوا: نشهد أنك قد بلّغت وأدّيت ونصحت، فرفع إصبعه إلى السماء: اللهم اشهد.",
        stage: { kind: "scene", scene: "arafah" },
      },
      {
        text: "ونزلت يومئذ بعرفة آية إكمال الدين.",
        stage: { kind: "scene", scene: "arafah" },
        hadith: "perfected",
        verse: "religion-perfected",
      },
      {
        text: "وكان الناس يتحدثون عن حجة الوداع ولا يدرون ما معناها، حتى ودّعهم ﷺ ولحق بربه بعدها بأشهر.",
        stage: { kind: "map", focus: ["madinah", "makkah"], route: "farewell", glow: ["madinah"] },
        hadith: "farewell-talk",
      },
    ],
  },
  {
    id: "passing",
    era: "victory",
    title: "الرفيق الأعلى",
    date: "ربيع الأول ١١ هـ",
    year: 632,
    age: 63,
    exactAge: true,
    summary: "مرض ﷺ ثم لحق بالرفيق الأعلى وهو ابن ثلاث وستين، بعد أن بلّغ الرسالة وأدّى الأمانة.",
    lesson: "بلّغ الرسالة وأدّى الأمانة، ومضى إلى ربه وهو ابن ثلاث وستين. والدين باقٍ بعده، فمن أحبه اتّبعه.",
    beats: [
      {
        text: "بعد رجوعه من الحج بأشهر اشتد به الوجع، فاستأذن أزواجه أن يُمرَّض في بيت عائشة، فأذنّ له.",
        stage: { kind: "scene", scene: "masjid" },
        hadith: "aishas-house",
      },
      {
        text: "ولما ثقل عليه الخروج قال: مروا أبا بكر فليصلّ بالناس.",
        stage: { kind: "scene", scene: "masjid" },
        hadith: "abu-bakr-leads",
      },
      {
        text: "وفي يوم الاثنين كشف ستر حجرته فنظر إلى الناس صفوفًا خلف أبي بكر، ثم أرخى الستر، وتوفي من آخر ذلك اليوم.",
        stage: { kind: "map", focus: ["madinah"], span: 40, glow: ["madinah"] },
        hadith: "last-look",
      },
      {
        text: "وكان آخر ما قال: اللهم الرفيق الأعلى.",
        stage: { kind: "scene", scene: "night" },
        hadith: "highest-companion",
        verse: "you-will-die",
      },
      {
        text: "ودهش الناس، فقام أبو بكر فقال: من كان يعبد محمدًا فإن محمدًا قد مات، ومن كان يعبد الله فإن الله حي لا يموت، ثم تلا:",
        stage: { kind: "scene", scene: "masjid" },
        hadith: "abu-bakr-speech",
        verse: "messenger",
      },
      {
        text: "ومات ﷺ وهو ابن ثلاث وستين، ولم يترك دينارًا ولا درهمًا، وترك لأمته القرآن والسنة.",
        stage: { kind: "scene", scene: "dunes" },
        hadith: "left-nothing",
      },
    ],
  },
];

export function eventById(id: string): SeerahEvent | undefined {
  return SEERAH_EVENTS.find((event) => event.id === id);
}

/** The events whose chapters are written, in order: what "next" steps through. */
export const CHAPTERS = SEERAH_EVENTS.filter((event) => event.beats.length > 0);

/**
 * How much of each route is drawn at a beat: the furthest any beat so far took it, so stepping back
 * undraws what came after.
 */
export function routesAt(event: SeerahEvent, beat: number): Partial<Record<RouteId, number>> {
  const drawn: Partial<Record<RouteId, number>> = {};
  event.beats.slice(0, beat + 1).forEach(({ stage }) => {
    if (stage.kind === "map" && stage.route) drawn[stage.route] = Math.max(drawn[stage.route] ?? 0, stage.upTo ?? 1);
  });
  return drawn;
}
