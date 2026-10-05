"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gamepad2, LogIn, Mic, Sparkles, Star, UserPlus, X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { useAccount } from "@/features/account/AccountProvider";
import { useInstallArrival } from "@/features/pwa/install-store";
import gardenChild from "@/assets/scenes/garden-child.png";

/** Shown to signed-out visitors after a while on the site, then not again for a week once closed. */
const KEY = "al-manara:kids-invite:v1";
const DELAY_MS = 25_000;
const AGAIN_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
/** Never over the sign-in forms, the reader, reciting, exams, or the kids area itself. */
const SKIP = /^\/(login|register|verify|forgot-password|reset-password|auth|kids|quran|tasmee|exams|admin)/;

const PERKS = [
  { icon: Gamepad2, text: "ألعاب تفاعلية في الحروف والتجويد وترتيب الآيات" },
  { icon: Mic, text: "يحفظ السور القصيرة آيةً آية ويسجّل صوته ليسمع نفسه" },
  { icon: Star, text: "نجوم وشارات تشجّعه، وتقدّم كل طفل محفوظ في حسابك" },
] as const;

function seenRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(KEY));
    return Number.isFinite(at) && Date.now() - at < AGAIN_AFTER_MS;
  } catch {
    return false;
  }
}

function remember() {
  try {
    localStorage.setItem(KEY, String(Date.now()));
  } catch {
    // Private mode: it may show again next visit, which is fine.
  }
}

export function KidsInviteDialog() {
  const account = useAccount();
  const pathname = usePathname();
  const installOpen = useInstallArrival();
  const [open, setOpen] = useState(false);
  const eligible = account.status === "signed-out" && !SKIP.test(pathname) && !installOpen;

  useEffect(() => {
    if (!eligible || seenRecently()) return;
    const id = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(id);
  }, [eligible]);

  function close() {
    remember();
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <AnimatePresence>
      {open && eligible && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-emerald-night/60 p-3 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="kids-invite-title"
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-ivory shadow-lift"
            style={{ marginBottom: "max(0rem, env(safe-area-inset-bottom))" }}
            initial={{ y: 48, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 48, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-[16/9]">
              <Image
                src={gardenChild}
                alt="طفل يقرأ المصحف تحت شجرة في حديقة خضراء"
                fill
                sizes="(min-width: 640px) 28rem, 100vw"
                placeholder="blur"
                className="object-cover object-left"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-t from-ivory via-ivory/10 to-transparent" aria-hidden />
              <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-bold text-emerald-night shadow-gold">
                <Sparkles className="size-3.5" aria-hidden /> مجانًا لأطفالك
              </span>
              <button
                type="button"
                onClick={close}
                autoFocus
                className="absolute left-4 top-4 grid size-10 place-items-center rounded-full bg-white/85 text-ink shadow-soft backdrop-blur hover:bg-white"
              >
                <X className="size-5" aria-hidden />
                <span className="sr-only">إغلاق</span>
              </button>
            </div>

            <div className="px-6 pb-6">
              <p className="text-sm font-bold text-gold-deep">للأطفال</p>
              <h2 id="kids-invite-title" className="mt-1 text-2xl font-bold text-emerald-deep">
                حديقة القرآن لأطفالك
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">مكان آمن وممتع يحبّب طفلك في القرآن، بلا إعلانات.</p>

              <ul className="mt-4 space-y-2.5">
                {PERKS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm leading-6 text-ink">
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-emerald-mist text-emerald">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>

              <p className="mt-4 rounded-2xl bg-gold-mist px-4 py-2.5 text-xs leading-6 text-gold-deep">
                سجّل حسابك المجاني، ثم أضف أطفالك من صفحة حسابك ليكون لكلٍّ منهم حديقته ونجومه.
              </p>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Link href="/register" onClick={close} className={buttonClass("primary", "md", "w-full")}>
                  <UserPlus aria-hidden /> أنشئ حسابًا مجانيًا
                </Link>
                <Link href="/login?next=/kids" onClick={close} className={buttonClass("outline", "md", "w-full")}>
                  <LogIn aria-hidden /> لديّ حساب
                </Link>
              </div>
              <button type="button" onClick={close} className="mt-3 w-full text-center text-sm font-bold text-muted hover:text-ink">
                ربما لاحقًا
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
