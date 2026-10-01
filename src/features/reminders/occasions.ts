/**
 * The special days we email about, with their content. Pure data and rules (no server imports)
 * so the cron, the admin preview and the schedule checks all share one source.
 *
 * Every hadith carries its source; review the wording with a qualified person before changing it.
 * Evening reminders are about *tomorrow* (sent the evening before, so people can intend to fast).
 */
import { toArabicDigits } from "@/lib/arabic";
import type { ReminderSlot } from "@/lib/supabase/database.types";
import type { ReminderDay } from "./dates";
import type { ReminderTopic } from "./topics";

/** Mishary Alafasy on mp3quran.net; his Hafs moshaf includes Surat al-Kahf. */
export const DEFAULT_REMINDER_RECITER_ID = 123;

export interface ReminderContext {
  today: ReminderDay;
  tomorrow: ReminderDay;
}

export interface ReminderContent {
  badge: string;
  subject: string;
  preheader: string;
  title: string;
  intro: string;
  /** Hadith or ayah with its source, shown as quote cards under "فضل اليوم". */
  virtues: { text: string; source: string }[];
  /** "ماذا تفعل؟" — short practical points. */
  tips: string[];
  /** One or two buttons; `href` is a site path. The first is the main (gold) one. */
  actions: { label: string; href: string }[];
  verse: { text: string; ref: string };
}

export interface Occasion {
  key: string;
  label: string;
  slot: ReminderSlot;
  topic: ReminderTopic;
  /** When two occasions fall on the same day, only the higher one is sent. */
  priority: number;
  matches: (context: ReminderContext) => boolean;
  content: (context: ReminderContext) => ReminderContent;
}

const RAMADAN = 9;
const SHAWWAL = 10;
const DHUL_HIJJAH = 12;
const MUHARRAM = 1;

const on = (day: ReminderDay, month: number, dayOfMonth: number) => day.hijri.month === month && day.hijri.day === dayOfMonth;

/** Days a voluntary fast isn't held: Ramadan itself, the two Eids and the days of Tashreeq. */
function noVoluntaryFast(day: ReminderDay) {
  const { month, day: dayOfMonth } = day.hijri;
  return month === RAMADAN || (month === SHAWWAL && dayOfMonth === 1) || (month === DHUL_HIJJAH && dayOfMonth >= 10 && dayOfMonth <= 13);
}

const SUHOOR = "تسحّر ولو بجرعة ماء؛ قال ﷺ: «تسحّروا فإن في السحور بركة» (متفق عليه).";
const FASTING_VERSE = { text: "﴿ وَأَن تَصُومُوا خَيْرٌ لَّكُمْ إِن كُنتُمْ تَعْلَمُونَ ﴾", ref: "سورة البقرة — ١٨٤" };

function weekdayFast(key: string, weekday: 1 | 4, name: string): Occasion {
  return {
    key,
    label: `صيام يوم ${name}`,
    slot: "evening",
    topic: "fasting",
    priority: 10,
    matches: ({ tomorrow }) => tomorrow.weekday === weekday && !noVoluntaryFast(tomorrow),
    content: () => ({
      badge: `✦ غدًا ${name}`,
      subject: `غدًا ${name}… هل تنوي الصيام؟`,
      preheader: "تُعرض الأعمال يوم الاثنين والخميس، فأحِبَّ أن يُعرض عملك وأنت صائم.",
      title: `تذكير بصيام يوم ${name}`,
      intro: `غدًا يوم ${name}، وكان النبي ﷺ يتحرّى صيام الاثنين والخميس. انوِ الصيام من الليلة، واجعل يومك غدًا يومًا تُرفع فيه أعمالك وأنت صائم.`,
      virtues: [
        {
          text: "«تُعرض الأعمال يوم الاثنين والخميس، فأحبّ أن يُعرض عملي وأنا صائم»",
          source: "رواه الترمذي، وصححه الألباني",
        },
        ...(weekday === 1
          ? [
              {
                text: "سُئل ﷺ عن صوم يوم الاثنين فقال: «ذاك يومٌ وُلدتُ فيه، ويومٌ بُعثتُ -أو أُنزل عليّ- فيه»",
                source: "رواه مسلم",
              },
            ]
          : []),
      ],
      tips: ["انوِ الصيام من الليل.", SUHOOR, "أكثر من الدعاء عند الفطر، فللصائم دعوة لا تُرد."],
      actions: [{ label: "التقويم الهجري", href: "/calendar" }],
      verse: FASTING_VERSE,
    }),
  };
}

export const OCCASIONS: Occasion[] = [
  {
    key: "friday-kahf",
    label: "يوم الجمعة وسورة الكهف",
    slot: "morning",
    topic: "friday",
    priority: 10,
    matches: ({ today }) => today.weekday === 5,
    content: () => ({
      badge: "✦ جمعة مباركة",
      subject: "جمعة مباركة… لا تنسَ سورة الكهف",
      preheader: "نورٌ لك ما بين الجمعتين: اقرأ سورة الكهف أو استمع إليها اليوم.",
      title: "اليوم الجمعة، فاقرأ سورة الكهف",
      intro:
        "اليوم الجمعة، خير يوم طلعت عليه الشمس. ومن سنن هذا اليوم المبارك قراءة سورة الكهف، فهي نور لك ما بين الجمعتين. خصّص لها ربع ساعة من يومك، قراءةً أو استماعًا.",
      virtues: [
        {
          text: "«من قرأ سورة الكهف في يوم الجمعة أضاء له من النور ما بين الجمعتين»",
          source: "رواه الحاكم والبيهقي، وصححه الألباني في صحيح الجامع (٦٤٧٠)",
        },
        { text: "«من حفظ عشر آيات من أول سورة الكهف عُصم من الدجال»", source: "رواه مسلم" },
        {
          text: "«خير يومٍ طلعت عليه الشمس يوم الجمعة، فيه خُلق آدم، وفيه أُدخل الجنة، وفيه أُخرج منها»",
          source: "رواه مسلم",
        },
        {
          text: "«فيه ساعةٌ لا يوافقها عبدٌ مسلم وهو قائم يصلي، يسأل الله تعالى شيئًا إلا أعطاه إياه»",
          source: "متفق عليه",
        },
      ],
      tips: [
        "وقت قراءة الكهف من غروب شمس الخميس إلى غروب شمس الجمعة.",
        "أكثر من الصلاة على النبي ﷺ اليوم.",
        "اغتسل وتطيّب وبكّر إلى صلاة الجمعة.",
        "تحرَّ ساعة الإجابة بالدعاء، خاصة آخر ساعة بعد العصر.",
      ],
      actions: [
        { label: "اقرأ سورة الكهف", href: "/quran/18" },
        { label: "استمع لسورة الكهف", href: `/listen/${DEFAULT_REMINDER_RECITER_ID}?surah=18` },
      ],
      verse: {
        text: "﴿ الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَل لَّهُ عِوَجًا ﴾",
        ref: "سورة الكهف — ١",
      },
    }),
  },
  weekdayFast("fast-monday", 1, "الاثنين"),
  weekdayFast("fast-thursday", 4, "الخميس"),
  {
    key: "white-days",
    label: "الأيام البيض",
    slot: "evening",
    topic: "fasting",
    priority: 20,
    // 13 Dhul-Hijjah is a day of Tashreeq, so that month has no white-days reminder.
    matches: ({ tomorrow }) => tomorrow.hijri.day === 13 && tomorrow.hijri.month !== RAMADAN && tomorrow.hijri.month !== DHUL_HIJJAH,
    content: ({ tomorrow }) => {
      const month = tomorrow.hijri.monthName;
      return {
        badge: "✦ الأيام البيض",
        subject: `الأيام البيض تبدأ غدًا (١٣ ${month})`,
        preheader: "صيام ثلاثة أيام من كل شهر كصيام الدهر كله.",
        title: "تذكير بصيام الأيام البيض",
        intro: `تبدأ غدًا الأيام البيض من شهر ${month}: الثالث عشر والرابع عشر والخامس عشر. صيامها سنة عن النبي ﷺ، وأجرها كصيام الشهر كله.`,
        virtues: [
          {
            text: "«يا أبا ذر، إذا صمت من الشهر ثلاثة أيام فصم ثلاث عشرة، وأربع عشرة، وخمس عشرة»",
            source: "رواه الترمذي والنسائي، وحسّنه الألباني",
          },
          { text: "«صوم ثلاثة أيامٍ من كل شهر صوم الدهر كله»", source: "متفق عليه" },
        ],
        tips: [`الأيام: ${toArabicDigits(13)} و${toArabicDigits(14)} و${toArabicDigits(15)} من ${month}.`, "انوِ الصيام من الليل.", SUHOOR],
        actions: [{ label: "التقويم الهجري", href: "/calendar" }],
        verse: FASTING_VERSE,
      };
    },
  },
  {
    key: "dhul-hijjah-10",
    label: "العشر الأوائل من ذي الحجة",
    slot: "evening",
    topic: "seasons",
    priority: 30,
    matches: ({ tomorrow }) => on(tomorrow, DHUL_HIJJAH, 1),
    content: () => ({
      badge: "✦ العشر من ذي الحجة",
      subject: "غدًا تبدأ أفضل أيام الدنيا: العشر من ذي الحجة",
      preheader: "ما من أيامٍ العملُ الصالح فيهن أحب إلى الله من هذه الأيام العشر.",
      title: "أقبلت العشر الأوائل من ذي الحجة",
      intro:
        "تبدأ غدًا العشر الأوائل من ذي الحجة، وهي أفضل أيام السنة. اغتنمها بالذكر والصيام والصدقة وقراءة القرآن، فالعمل الصالح فيها أحب إلى الله من غيرها.",
      virtues: [
        {
          text: "«ما من أيامٍ العملُ الصالح فيهن أحب إلى الله من هذه الأيام العشر». قالوا: ولا الجهاد في سبيل الله؟ قال: «ولا الجهاد في سبيل الله، إلا رجلٌ خرج بنفسه وماله فلم يرجع من ذلك بشيء»",
          source: "رواه أبو داود والترمذي، وأصله في البخاري",
        },
        {
          text: "«إذا دخلت العشر، وأراد أحدكم أن يضحّي، فلا يمسّ من شعره وبشره شيئًا»",
          source: "رواه مسلم",
        },
      ],
      tips: [
        "أكثر من التكبير والتهليل والتحميد: الله أكبر، الله أكبر، لا إله إلا الله، والله أكبر، الله أكبر، ولله الحمد.",
        "صم ما تيسّر منها، وخاصة يوم عرفة (٩ ذي الحجة).",
        "اجعل لك وِردًا يوميًا من القرآن طوال العشر.",
        "إن نويت الأضحية فأمسك عن شعرك وأظفارك حتى تذبح.",
      ],
      actions: [
        { label: "الأذكار", href: "/adhkar" },
        { label: "اقرأ القرآن", href: "/quran" },
      ],
      verse: { text: "﴿ وَالْفَجْرِ ۝ وَلَيَالٍ عَشْرٍ ﴾", ref: "سورة الفجر — ١، ٢" },
    }),
  },
  {
    key: "arafah",
    label: "يوم عرفة",
    slot: "evening",
    topic: "seasons",
    priority: 40,
    matches: ({ tomorrow }) => on(tomorrow, DHUL_HIJJAH, 9),
    content: () => ({
      badge: "✦ يوم عرفة",
      subject: "غدًا يوم عرفة… صيامه يكفّر سنتين",
      preheader: "صيام يوم عرفة يكفّر السنة التي قبله والسنة التي بعده.",
      title: "غدًا يوم عرفة، خير يوم في السنة",
      intro: "غدًا يوم عرفة، يوم المغفرة والعتق من النار. انوِ صيامه من الليلة، واجعل يومك كله دعاءً وذكرًا، خاصة من العصر إلى المغرب.",
      virtues: [
        {
          text: "«صيام يوم عرفة أحتسب على الله أن يكفّر السنة التي قبله، والسنة التي بعده»",
          source: "رواه مسلم",
        },
        { text: "«ما من يومٍ أكثر من أن يُعتق الله فيه عبدًا من النار من يوم عرفة»", source: "رواه مسلم" },
        {
          text: "«خير الدعاء دعاء يوم عرفة، وخير ما قلت أنا والنبيون من قبلي: لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير»",
          source: "رواه الترمذي، وحسّنه الألباني",
        },
      ],
      tips: [
        "انوِ الصيام من الليل (الصيام لغير الحاج).",
        "اكتب حاجاتك ودعواتك من الليلة، وادعُ بها غدًا.",
        "أكثر من قول: لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.",
        "التكبير المقيّد يبدأ من فجر يوم عرفة إلى عصر آخر أيام التشريق.",
      ],
      actions: [
        { label: "أدعية مختارة", href: "/duas" },
        { label: "الأذكار", href: "/adhkar" },
      ],
      verse: { text: "﴿ الْيَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ وَأَتْمَمْتُ عَلَيْكُمْ نِعْمَتِي ﴾", ref: "سورة المائدة — ٣" },
    }),
  },
  {
    key: "ashura",
    label: "تاسوعاء وعاشوراء",
    slot: "evening",
    topic: "seasons",
    priority: 40,
    matches: ({ tomorrow }) => on(tomorrow, MUHARRAM, 9),
    content: () => ({
      badge: "✦ تاسوعاء وعاشوراء",
      subject: "غدًا تاسوعاء، وبعده عاشوراء",
      preheader: "صيام يوم عاشوراء يكفّر السنة التي قبله.",
      title: "تذكير بصيام تاسوعاء وعاشوراء",
      intro:
        "غدًا التاسع من محرم (تاسوعاء)، وبعده العاشر (عاشوراء)، اليوم الذي نجّى الله فيه موسى عليه السلام وقومه. السنة أن تصوم اليومين معًا.",
      virtues: [
        { text: "«صيام يوم عاشوراء أحتسب على الله أن يكفّر السنة التي قبله»", source: "رواه مسلم" },
        { text: "«لئن بقيتُ إلى قابلٍ لأصومنّ التاسع»", source: "رواه مسلم" },
        { text: "«أفضل الصيام بعد رمضان شهرُ الله المحرّم»", source: "رواه مسلم" },
      ],
      tips: ["انوِ صيام التاسع من الليلة، ثم العاشر بعده.", SUHOOR],
      actions: [{ label: "التقويم الهجري", href: "/calendar" }],
      verse: FASTING_VERSE,
    }),
  },
  {
    key: "ramadan",
    label: "استقبال رمضان",
    slot: "evening",
    topic: "seasons",
    priority: 40,
    matches: ({ tomorrow }) => on(tomorrow, RAMADAN, 1),
    content: () => ({
      badge: "✦ رمضان كريم",
      subject: "رمضان على الأبواب… كيف ستستقبله؟",
      preheader: "من صام رمضان إيمانًا واحتسابًا غُفر له ما تقدّم من ذنبه.",
      title: "أهلًا رمضان، شهر القرآن",
      intro:
        "بحسب التقويم، يُتوقَّع أن يبدأ شهر رمضان غدًا، فتابع إعلان الرؤية في بلدك. هذه أيام معدودة؛ ضع لنفسك من الليلة خطة لختم القرآن، ونيةً صادقة للصيام والقيام.",
      virtues: [
        { text: "«من صام رمضان إيمانًا واحتسابًا غُفر له ما تقدّم من ذنبه»", source: "متفق عليه" },
        { text: "«من قام رمضان إيمانًا واحتسابًا غُفر له ما تقدّم من ذنبه»", source: "متفق عليه" },
        {
          text: "«إذا جاء رمضان فُتّحت أبواب الجنة، وغُلّقت أبواب النار، وصُفّدت الشياطين»",
          source: "متفق عليه",
        },
      ],
      tips: [
        "ابدأ ختمة رمضان من أول يوم، وقسّمها على أيام الشهر.",
        "اجعل لك نصيبًا من قيام الليل ولو ركعتين.",
        "تفقّد من حولك بالصدقة وإفطار الصائمين.",
      ],
      actions: [
        { label: "ابدأ ختمة رمضان", href: "/khatma" },
        { label: "اقرأ القرآن", href: "/quran" },
      ],
      verse: { text: "﴿ شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ ﴾", ref: "سورة البقرة — ١٨٥" },
    }),
  },
  {
    key: "last-ten",
    label: "العشر الأواخر من رمضان",
    slot: "evening",
    topic: "seasons",
    priority: 40,
    matches: ({ tomorrow }) => on(tomorrow, RAMADAN, 21),
    content: () => ({
      badge: "✦ العشر الأواخر",
      subject: "الليلة تبدأ العشر الأواخر… التمس ليلة القدر",
      preheader: "ليلة القدر خيرٌ من ألف شهر، فتحرّها في الوتر من العشر الأواخر.",
      title: "أقبلت العشر الأواخر من رمضان",
      intro:
        "الليلة أولى ليالي العشر الأواخر، وفيها ليلة القدر، خير من ألف شهر. كان النبي ﷺ يجتهد فيها ما لا يجتهد في غيرها، فشدّ العزم واغتنم ما بقي.",
      virtues: [
        {
          text: "كان رسول الله ﷺ «إذا دخل العشر شدّ مئزره، وأحيا ليله، وأيقظ أهله»",
          source: "متفق عليه",
        },
        { text: "«تحرّوا ليلة القدر في الوتر من العشر الأواخر من رمضان»", source: "رواه البخاري" },
        { text: "«من قام ليلة القدر إيمانًا واحتسابًا غُفر له ما تقدّم من ذنبه»", source: "متفق عليه" },
      ],
      tips: [
        "أكثر من دعاء: «اللهم إنك عفوٌّ تحب العفو فاعفُ عني» (رواه الترمذي، وصححه الألباني).",
        "أحيِ الليل بالصلاة والقرآن والذكر، وأيقظ أهلك.",
        "أخرج صدقة كل ليلة ولو قليلة، لعلها توافق ليلة القدر.",
      ],
      actions: [
        { label: "أدعية مختارة", href: "/duas" },
        { label: "أكمل ختمتك", href: "/khatma" },
      ],
      verse: { text: "﴿ لَيْلَةُ الْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ ﴾", ref: "سورة القدر — ٣" },
    }),
  },
];

export const occasionByKey = (key: string) => OCCASIONS.find((occasion) => occasion.key === key) ?? null;
