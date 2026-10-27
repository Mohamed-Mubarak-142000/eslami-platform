"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, RotateCcw, Undo2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { haptic } from "@/features/tasbih/haptics";
import { updateUmrah, useUmrah } from "./umrahStore";

const ROUNDS = 7;
const ORDINALS = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع"];

function Pips({ count }: { count: number }) {
  return (
    <ol className="flex justify-center gap-1.5" aria-label={`أتممت ${toArabicDigits(count)} من ${toArabicDigits(ROUNDS)} أشواط`}>
      {Array.from({ length: ROUNDS }, (_, index) => {
        const done = index < count;
        const current = index === count;
        return (
          <li
            key={index}
            className={cn(
              "grid size-9 place-items-center rounded-full text-sm font-bold transition-colors",
              done
                ? "bg-emerald text-white"
                : current
                  ? "border-2 border-gold bg-gold-mist text-gold-deep"
                  : "border border-line bg-white text-muted",
            )}
          >
            {done ? <Check className="size-4" aria-hidden /> : toArabicDigits(index + 1)}
          </li>
        );
      })}
    </ol>
  );
}

/** The shared controls: finish a round, undo one, start over. */
function Controls({ count, field, nextLabel, tone }: { count: number; field: "tawaf" | "sai"; nextLabel: string; tone: "dark" | "light" }) {
  const finished = count >= ROUNDS;
  const set = (value: number) => updateUmrah((current) => ({ ...current, [field]: value }));
  // On the dark tawaf card the quiet buttons need the light variant to stay readable.
  const ghost = tone === "dark" ? "light" : "ghost";
  return (
    <div className="mt-5 space-y-3">
      <button
        type="button"
        disabled={finished}
        onClick={() => {
          set(count + 1);
          haptic(count + 1 === ROUNDS ? "done" : "tap");
        }}
        className={buttonClass(tone === "dark" ? "gold" : "primary", "lg", "w-full touch-manipulation text-lg disabled:opacity-100")}
      >
        {finished ? (
          <>
            <Check aria-hidden /> اكتملت الأشواط السبعة
          </>
        ) : (
          <>أتممت {nextLabel}</>
        )}
      </button>
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => set(Math.max(0, count - 1))}
          disabled={count === 0}
          className={buttonClass(ghost, "sm", "text-current")}
        >
          <Undo2 aria-hidden /> تراجع شوطًا
        </button>
        <button
          type="button"
          onClick={() => count > 0 && window.confirm("تصفير العدّاد والبدء من الشوط الأول؟") && set(0)}
          disabled={count === 0}
          className={buttonClass(ghost, "sm", "text-current")}
        >
          <RotateCcw aria-hidden /> ابدأ من جديد
        </button>
      </div>
    </div>
  );
}

/**
 * The tawaf from above: the Kaaba with its corners, the Hijr, and a pilgrim who goes once around
 * (counter-clockwise, the Kaaba on the left) for every round counted.
 */
export function TawafCounter() {
  const { tawaf: count } = useUmrah();
  const reduce = useReducedMotion();
  const finished = count >= ROUNDS;
  const round = Math.min(count + 1, ROUNDS);

  return (
    <section aria-labelledby="tawaf-counter" className="rounded-[2rem] bg-emerald-deep p-5 text-white shadow-lift sm:p-7">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="tawaf-counter" className="text-lg font-bold">
          عدّاد الطواف
        </h3>
        <p className="text-sm text-white/70" aria-live="polite">
          {finished ? "تمّ الطواف" : `أنت في الشوط ${ORDINALS[count]}`}
        </p>
      </div>

      <svg
        viewBox="0 0 260 260"
        className="mx-auto mt-3 block w-full max-w-[19rem]"
        role="img"
        aria-label="الكعبة من أعلى، والطائف يدور حولها والكعبة عن يساره"
      >
        <circle cx="130" cy="130" r="122" fill="rgba(255,255,255,0.06)" stroke="rgba(232,215,166,0.25)" />
        <circle cx="130" cy="130" r="86" fill="none" stroke="rgba(232,215,166,0.35)" strokeDasharray="2 7" strokeLinecap="round" />
        {/* The direction of tawaf: down the left side, so counter-clockwise from above. */}
        <path
          d="M 39 122 l 5 10 l 5 -10"
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 221 138 l -5 -10 l -5 10"
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Hijr Ismail, the low half-circle wall on the north-west side: tawaf goes outside it. */}
        <path d="M 102 97 A 30 30 0 0 1 158 97" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="3" strokeLinecap="round" />
        <rect x="98" y="98" width="64" height="64" rx="3" fill="black" />
        <rect x="98" y="113" width="64" height="6" fill="var(--color-gold)" />
        {/* The Black Stone corner, where every round starts and ends, with its start line. */}
        <line x1="162" y1="162" x2="214" y2="214" stroke="var(--color-gold)" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="162" cy="162" r="6" fill="#3a2a1a" stroke="var(--color-gold)" strokeWidth="2" />
        <circle cx="98" cy="162" r="4" fill="rgba(255,255,255,0.85)" />
        <text x="214" y="236" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-gold-soft)">
          الحجر الأسود
        </text>
        <text x="58" y="200" textAnchor="middle" fontSize="11" fontWeight="700" fill="rgba(255,255,255,0.85)">
          الركن اليماني
        </text>
        <text x="130" y="60" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.6)">
          حِجْر إسماعيل
        </text>
        <motion.g
          initial={false}
          animate={{ rotate: -360 * count }}
          transition={reduce ? { duration: 0 } : { duration: 1.6, ease: [0.45, 0, 0.25, 1] }}
          style={{ transformOrigin: "130px 130px" }}
        >
          <circle cx="190.8" cy="190.8" r="9" fill="var(--color-gold)" stroke="white" strokeWidth="3" />
        </motion.g>
      </svg>

      <div className="mt-2">
        <Pips count={count} />
      </div>

      <div className="mt-4 rounded-2xl bg-white/10 p-4 text-sm leading-7" aria-live="polite">
        {finished ? (
          <p>أتممت الطواف، تقبّل الله منك. غطِّ كتفك الأيمن واتجه إلى مقام إبراهيم لتصلّي ركعتين.</p>
        ) : (
          <>
            <p>
              {round <= 3 ? "شوط رَمَل للرجال: أسرع مشيك مع مقاربة الخطى." : "امشِ مشيًا عاديًا في هذا الشوط."} وكلما حاذيت الحجر الأسود
              فأشر إليه وقل: «الله أكبر».
            </p>
            <p className="mt-1 text-gold-soft">بين الركن اليماني والحجر الأسود: ﴿رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً…﴾</p>
          </>
        )}
      </div>

      <Controls count={count} field="tawaf" nextLabel={`الشوط ${ORDINALS[count] ?? ""}`} tone="dark" />
    </section>
  );
}

/**
 * The sa'i as a path between the two hills, with the green-lit stretch where men hurry; the
 * pilgrim crosses to the other hill for every round counted. Safa is on the right, where the
 * Arabic reader starts.
 */
export function SaiCounter() {
  const { sai: count } = useUmrah();
  const reduce = useReducedMotion();
  const finished = count >= ROUNDS;
  const atMarwa = count % 2 === 1;
  const towardMarwa = count % 2 === 0;

  return (
    <section aria-labelledby="sai-counter" className="rounded-[2rem] border border-gold/40 bg-gold-mist/70 p-5 sm:p-7">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="sai-counter" className="text-lg font-bold text-emerald-deep">
          عدّاد السعي
        </h3>
        <p className="text-sm text-muted" aria-live="polite">
          {finished ? "تمّ السعي عند المروة" : `الشوط ${ORDINALS[count]}: ${towardMarwa ? "من الصفا إلى المروة" : "من المروة إلى الصفا"}`}
        </p>
      </div>

      <svg viewBox="0 0 320 130" className="mt-3 block w-full" role="img" aria-label="المسعى بين الصفا والمروة">
        <path d="M 236 92 Q 270 34 312 92 Z" fill="#d8c08a" />
        <path d="M 8 92 Q 50 40 84 92 Z" fill="#d8c08a" />
        <line x1="70" y1="92" x2="250" y2="92" stroke="var(--color-emerald)" strokeOpacity="0.35" strokeWidth="10" strokeLinecap="round" />
        <rect x="134" y="84" width="52" height="16" rx="8" fill="#3fbf6f" fillOpacity="0.85" />
        <text x="160" y="118" textAnchor="middle" fontSize="10" fill="var(--color-muted)">
          العلَمان الأخضران
        </text>
        <text x="274" y="118" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--color-emerald-deep)">
          الصفا
        </text>
        <text x="46" y="118" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--color-emerald-deep)">
          المروة
        </text>
        <motion.circle
          cy="74"
          r="10"
          fill="var(--color-gold)"
          stroke="white"
          strokeWidth="3"
          initial={false}
          animate={{ cx: atMarwa ? 46 : 274 }}
          transition={reduce ? { duration: 0 } : { duration: 1.2, ease: [0.45, 0, 0.25, 1] }}
        />
      </svg>

      <div className="mt-2">
        <Pips count={count} />
      </div>

      <p className="mt-4 rounded-2xl bg-white/80 p-4 text-sm leading-7 text-ink" aria-live="polite">
        {finished
          ? "أتممت السعي، تقبّل الله منك. بقي الحلق أو التقصير لتتمّ عمرتك."
          : count === 0
            ? "اصعد الصفا واقرأ الآية، ثم استقبل الكعبة وكبّر وادعُ، وانطلق إلى المروة."
            : `على ${atMarwa ? "المروة" : "الصفا"} الآن: استقبل الكعبة وكبّر وادعُ كما فعلت أول مرة، ثم انطلق.`}
      </p>

      <Controls count={count} field="sai" nextLabel={`الشوط ${ORDINALS[count] ?? ""}`} tone="light" />
    </section>
  );
}
