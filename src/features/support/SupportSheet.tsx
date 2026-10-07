"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "framer-motion";
import { Check, Clock, Copy, HandHeart, ImagePlus, Loader2, LogIn, Sparkles, UserPlus, X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { useAccount } from "@/features/account/AccountProvider";
import { Field, FormAlert } from "@/features/auth/ui/AuthFields";
import { RECEIPT_TYPES, donationProblem, loadMyDonation, submitDonation, type MyDonation } from "./donationApi";
import { closeSupportSheet, useSupportSheetOpen } from "./support-store";
import { INSTAPAY_NUMBER, QUICK_AMOUNTS, SUPPORTER_PERKS } from "./supportInfo";

/** Dragging the handle down past this, or flicking it, closes the sheet. */
const CLOSE_OFFSET = 120;
const CLOSE_VELOCITY = 500;

const toLatinDigits = (value: string) => value.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

function InstaPayCard() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(INSTAPAY_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the number is still selectable.
    }
  }
  return (
    <section className="rounded-3xl border border-gold/40 bg-white p-5 shadow-soft">
      <h3 className="text-sm font-bold text-gold-deep">١. حوّل عبر إنستاباي</h3>
      <button
        type="button"
        onClick={copy}
        aria-label={`نسخ الرقم ${INSTAPAY_NUMBER}`}
        className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-emerald-night px-4 py-3.5 text-white transition-transform active:scale-[0.98]"
      >
        <span dir="ltr" className="flex-1 select-all text-center text-2xl font-bold tracking-widest">
          {INSTAPAY_NUMBER}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-gold-soft">
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "تم النسخ" : "نسخ"}
        </span>
      </button>
      <p className="mt-3 text-xs leading-6 text-muted">
        افتح تطبيق إنستاباي وحوّل أي مبلغ تريده إلى هذا الرقم، ثم خذ لقطة شاشة لصفحة نجاح التحويل وارفعها هنا.
      </p>
    </section>
  );
}

function StatusCard({
  icon: Icon,
  title,
  body,
  tone,
}: {
  icon: typeof Clock;
  title: string;
  body: string;
  tone: "wait" | "done" | "warn";
}) {
  return (
    <div className={cn("flex gap-3 rounded-3xl border p-4", tone === "warn" ? "border-rose/40 bg-white" : "border-gold/40 bg-gold-mist")}>
      <Icon
        className={cn("size-6 shrink-0", tone === "warn" ? "text-rose" : tone === "done" ? "text-emerald" : "text-gold-deep")}
        aria-hidden
      />
      <div>
        <p className="font-bold text-ink">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
      </div>
    </div>
  );
}

function DonationForm({ defaultName, onSent }: { defaultName: string; onSent: () => void }) {
  const [amountText, setAmountText] = useState("");
  const [displayName, setDisplayName] = useState(defaultName);
  const [sender, setSender] = useState("");
  const [message, setMessage] = useState("");
  const [showName, setShowName] = useState(true);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const amount = Number(toLatinDigits(amountText.trim()));

  // Free the local preview when it's replaced and when the form goes away.
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  function chooseReceipt(file: File | null) {
    setReceipt(file);
    setPreview(file ? URL.createObjectURL(file) : null);
    if (file) setError(undefined);
  }

  function clearReceipt() {
    chooseReceipt(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const input = { amount, sender, displayName, message, showName, receipt };
    const problem = donationProblem(input);
    if (problem) {
      setError(problem);
      return;
    }
    setSending(true);
    setError(undefined);
    const result = await submitDonation(input);
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSent();
  }

  return (
    <form onSubmit={send} noValidate className="space-y-4 rounded-3xl border border-line bg-white p-5 shadow-soft">
      <h3 className="text-sm font-bold text-gold-deep">٢. أرسل بيانات التحويل</h3>

      <fieldset>
        <legend className="mb-1.5 text-sm font-bold text-ink">المبلغ (جنيه)</legend>
        <div className="grid grid-cols-4 gap-2" role="radiogroup">
          {QUICK_AMOUNTS.map((value) => {
            const active = amount === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setAmountText(String(value))}
                className={cn(
                  "h-11 rounded-2xl border text-sm font-bold transition-colors",
                  active ? "border-emerald bg-emerald text-white" : "border-line bg-ivory text-ink hover:border-emerald/40",
                )}
              >
                {toArabicDigits(value)}
              </button>
            );
          })}
        </div>
        <Field
          label="أو اكتب المبلغ"
          name="amount"
          inputMode="numeric"
          autoComplete="off"
          value={amountText}
          onChange={(event) => setAmountText(event.target.value)}
          className="mt-3 [&_label]:sr-only"
          placeholder="أو اكتب المبلغ"
        />
      </fieldset>

      <Field
        label="اسمك"
        name="display_name"
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
        maxLength={60}
        autoComplete="name"
      />
      <Field
        label="اسم أو رقم المحوِّل في إنستاباي"
        name="sender"
        placeholder="كما يظهر في التحويل"
        value={sender}
        onChange={(event) => setSender(event.target.value)}
        maxLength={60}
        autoComplete="off"
      />
      <Field
        label="رسالة أو دعاء (اختياري)"
        name="message"
        placeholder="يظهر مع اسمك في الرئيسية"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        maxLength={140}
      />

      <label className="flex cursor-pointer items-center gap-3">
        <span className="flex-1">
          <span className="block text-sm font-bold text-ink">أظهر اسمي في قسم الداعمين</span>
          <span className="block text-xs text-muted">وإلا يظهر «فاعل خير». المبلغ لا يظهر أبدًا.</span>
        </span>
        <input type="checkbox" checked={showName} onChange={(event) => setShowName(event.target.checked)} className="peer sr-only" />
        <span
          aria-hidden
          className="relative h-7 w-12 shrink-0 rounded-full bg-line transition-colors after:absolute after:right-1 after:top-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-emerald peer-checked:after:-translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald/40"
        />
      </label>

      <input
        ref={fileRef}
        type="file"
        accept={RECEIPT_TYPES}
        className="sr-only"
        id="support-receipt"
        onChange={(event) => chooseReceipt(event.target.files?.[0] ?? null)}
      />
      {receipt && preview ? (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-ivory p-2.5">
          {/* A local object URL; next/image can't optimise it. */}
          <img src={preview} alt="صورة التحويل" className="h-18 w-14 rounded-xl object-cover" />
          <span className="flex-1 text-sm font-bold text-ink">صورة التحويل جاهزة</span>
          <button
            type="button"
            onClick={clearReceipt}
            className="grid size-9 place-items-center rounded-full text-muted hover:bg-white"
            aria-label="إزالة الصورة"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : (
        <label
          htmlFor="support-receipt"
          className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-emerald/50 bg-emerald-mist py-5 text-emerald-deep transition-colors hover:bg-emerald-soft"
        >
          <ImagePlus className="size-7" aria-hidden />
          <span className="text-sm font-bold">ارفع صورة التحويل</span>
        </label>
      )}

      <FormAlert error={error} />
      <button type="submit" disabled={sending} className={buttonClass("gold", "lg", "w-full")}>
        {sending ? <Loader2 className="animate-spin" aria-hidden /> : <HandHeart aria-hidden />}
        {sending ? "جارٍ الإرسال…" : "إرسال"}
      </button>
    </form>
  );
}

/** The signed-in user's latest request; the body mounts with the sheet, so this reloads on every open. */
function useMyDonation(userId: string | null) {
  const [state, setState] = useState<{ key: string; latest: MyDonation | null; supporter: boolean } | null>(null);
  const [version, setVersion] = useState(0);
  const key = userId ? `${userId}:${version}` : null;

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    loadMyDonation()
      .then((result) => !cancelled && setState({ key, ...result }))
      .catch(() => !cancelled && setState({ key, latest: null, supporter: false }));
    return () => {
      cancelled = true;
    };
  }, [key]);

  const current = state?.key === key ? state : null;
  return {
    loading: Boolean(key) && !current,
    latest: current?.latest ?? null,
    supporter: current?.supporter ?? false,
    reload: () => setVersion((v) => v + 1),
  };
}

function SupportBody() {
  const account = useAccount();
  const pathname = usePathname();
  const userId = account.status === "signed-in" ? account.account.id : null;
  const { loading, latest, supporter, reload } = useMyDonation(userId);
  const [sendAgain, setSendAgain] = useState(false);

  const signedIn = account.status === "signed-in";
  const pending = latest?.status === "pending";
  const showForm = signedIn && !loading && !pending && (sendAgain || latest?.status !== "rejected");
  const next = encodeURIComponent(`${pathname}?support`);

  return (
    // Wide screens: the number and the perks on one side, the form on the other.
    <div className="mx-auto grid max-w-6xl items-start gap-4 px-5 pb-8 pt-5 sm:px-7 lg:grid-cols-2 lg:gap-6">
      <div className="space-y-4 lg:sticky lg:top-5">
        {supporter && (
          <StatusCard icon={Sparkles} tone="done" title="أنت من داعمي المنارة ✓" body="جزاك الله خيرًا. يمكنك الدعم مرة أخرى متى شئت." />
        )}
        <InstaPayCard />
        <PerksCard />
      </div>

      <div className="space-y-4">
        {account.status === "disabled" ? (
          <p className="rounded-3xl border border-line bg-white p-5 text-sm leading-7 text-muted">
            بعد التحويل، أرسل صورة التحويل من تطبيق المنارة ليظهر اسمك ضمن الداعمين.
          </p>
        ) : account.status === "signed-out" ? (
          <section className="rounded-3xl border border-line bg-white p-5">
            <h3 className="font-bold text-ink">سجّل الدخول لإرسال دعمك</h3>
            <p className="mt-1 text-sm leading-6 text-muted">نحتاج حسابك لنربط التحويل بك ونرسل لك رسالة الشكر بعد التأكد منه.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link href={`/login?next=${next}`} onClick={closeSupportSheet} className={buttonClass("primary", "md", "w-full")}>
                <LogIn aria-hidden /> تسجيل الدخول
              </Link>
              <Link href="/register" onClick={closeSupportSheet} className={buttonClass("outline", "md", "w-full")}>
                <UserPlus aria-hidden /> حساب جديد
              </Link>
            </div>
          </section>
        ) : account.status === "loading" || loading ? (
          <div className="grid place-items-center py-8 text-emerald">
            <Loader2 className="size-7 animate-spin" aria-label="جارٍ التحميل" />
          </div>
        ) : pending ? (
          <StatusCard
            icon={Clock}
            tone="wait"
            title="طلبك قيد المراجعة"
            body="سنتأكد من التحويل ونرسل لك رسالة شكر على بريدك، ثم يظهر اسمك في قسم داعمي المنارة بإذن الله."
          />
        ) : latest?.status === "rejected" && !sendAgain ? (
          <div className="space-y-3">
            <StatusCard
              icon={X}
              tone="warn"
              title="لم نتمكن من تأكيد تحويلك"
              body={latest.reject_reason ?? "راجع بيانات التحويل والصورة ثم أرسلها مرة أخرى."}
            />
            <button type="button" onClick={() => setSendAgain(true)} className={buttonClass("outline", "md", "w-full")}>
              إرسال طلب جديد
            </button>
          </div>
        ) : null}

        {showForm && account.status === "signed-in" && (
          <DonationForm
            defaultName={account.account.name}
            onSent={() => {
              setSendAgain(false);
              reload();
            }}
          />
        )}
      </div>
    </div>
  );
}

function PerksCard() {
  return (
    <section className="rounded-3xl border border-line bg-white p-5">
      <h3 className="font-bold text-ink">ماذا يحصل الداعم؟</h3>
      <ul className="mt-3 space-y-2">
        {SUPPORTER_PERKS.map((perk) => (
          <li key={perk} className="flex items-start gap-2 text-sm leading-6 text-ink">
            <Check className="mt-1 size-4 shrink-0 text-emerald" aria-hidden />
            {perk}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * "ادعم المنارة" as a bottom sheet over any page: the InstaPay number, then the transfer details and
 * screenshot. Opened from openSupportSheet() or any link carrying ?support. Drag the handle down,
 * tap outside or press Escape to close.
 */
export function SupportSheet() {
  const open = useSupportSheetOpen();
  const dragControls = useDragControls();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const previous = { html: html.style.overflow, body: document.body.style.overflow };
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const returnTo = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && closeSupportSheet();
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = previous.html;
      document.body.style.overflow = previous.body;
      window.removeEventListener("keydown", onKey);
      returnTo?.focus?.({ preventScroll: true });
    };
  }, [open]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > CLOSE_OFFSET || info.velocity.y > CLOSE_VELOCITY) closeSupportSheet();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90]">
          <motion.button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="absolute inset-0 bg-emerald-night/55 backdrop-blur-sm"
            onClick={closeSupportSheet}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-title"
            className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[2rem] bg-ivory shadow-lift"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36, mass: 0.9 }}
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.9 }}
            onDragEnd={onDragEnd}
          >
            {/* The header is the drag handle, so scrolling the form never fights the drag. */}
            <header
              className="relative shrink-0 touch-none cursor-grab select-none bg-emerald-night px-6 pb-6 pt-3 text-white active:cursor-grabbing"
              onPointerDown={(event) => dragControls.start(event)}
            >
              <div className="pattern-stars-light absolute inset-0 opacity-60" aria-hidden />
              <div className="relative mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/30" aria-hidden />
              <button
                ref={closeRef}
                type="button"
                onClick={closeSupportSheet}
                onPointerDown={(event) => event.stopPropagation()}
                className="absolute left-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
              >
                <X className="size-5" aria-hidden />
                <span className="sr-only">إغلاق</span>
              </button>
              <div className="relative mx-auto max-w-6xl sm:px-1">
                <p className="inline-flex items-center gap-1.5 text-sm font-bold text-gold-soft">
                  <HandHeart className="size-4" aria-hidden /> صدقة جارية
                </p>
                <h2 id="support-title" className="mt-1 text-3xl font-bold">
                  ادعم المنارة
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-white/75">
                  المنارة مجانية لكل مسلم وبلا اشتراكات. دعمك يغطي الخوادم ويضيف قرّاءً وروايات ومحتوى للأطفال.
                </p>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <SupportBody />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
