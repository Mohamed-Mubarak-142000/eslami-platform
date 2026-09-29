"use client";

import { useActionState, useEffect, useId, useMemo, useRef, useState, type ReactNode, type TextareaHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { Check, ChevronDown, FlaskConical, Loader2, Search, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { Field, FormAlert } from "@/features/auth/ui/AuthFields";
import type { FormState } from "@/features/auth/actions";
import { renderAnnouncementEmail } from "@/lib/mail/announcementEmail";
import { sendAnnouncementAction, sendTestAnnouncementAction } from "./actions";
import { MAX_RECIPIENTS } from "./limits";

export interface ComposerUser {
  id: string;
  name: string;
  email: string;
  /** False when the user switched off update emails; shown but not selectable. */
  acceptsUpdates: boolean;
}

interface Props {
  users: ComposerUser[];
  siteUrl: string;
  facebookUrl: string | null;
  adminName: string;
}

const EMPTY = {
  subject: "",
  preheader: "",
  title: "",
  intro: "",
  what: "",
  steps: "",
  benefits: "",
  ctaLabel: "",
  ctaUrl: "",
};
type Draft = typeof EMPTY;

function TextArea({
  label,
  name,
  error,
  hint,
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; name: string; error?: string | undefined; hint?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-ink">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        className={cn(
          "min-h-28 w-full rounded-2xl border bg-white px-4 py-3 text-base leading-relaxed text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-emerald/50 focus:shadow-soft",
          error ? "border-rose" : "border-line",
        )}
        {...rest}
      />
      {error ? (
        <p className="mt-1.5 text-sm font-semibold text-rose">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

/** "Everyone" or a hand-picked list, in a dropdown with search and select-all. */
function RecipientPicker({
  users,
  selected,
  onChange,
}: {
  users: ComposerUser[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const reachable = users.filter((user) => user.acceptsUpdates);
  const allSelected = selected.size === reachable.length && reachable.length > 0;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const term = query.trim().toLowerCase();
  const visible = term ? users.filter((user) => user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)) : users;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  const label = allSelected
    ? `كل المستخدمين (${toArabicDigits(reachable.length)})`
    : selected.size === 0
      ? "لم يُختر أحد"
      : `${toArabicDigits(selected.size)} من ${toArabicDigits(reachable.length)} مستخدم`;

  return (
    <div ref={box} className="relative">
      <span className="mb-1.5 block text-sm font-bold text-ink">المستلمون</span>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-12 w-full items-center justify-between rounded-2xl border border-line bg-white px-4 text-start text-base text-ink focus:border-emerald/50"
      >
        <span className={cn(selected.size === 0 && "text-rose")}>{label}</span>
        <ChevronDown className={cn("size-4 text-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-white shadow-lift">
          <div className="border-b border-line p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ابحث بالاسم أو البريد"
                aria-label="بحث عن مستلم"
                autoFocus
                className="h-10 w-full rounded-xl border border-line bg-ivory pe-3 ps-9 text-sm outline-none focus:border-emerald/50"
              />
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-bold text-ink">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => onChange(allSelected ? new Set() : new Set(reachable.map((user) => user.id)))}
                className="size-4 accent-emerald"
              />
              تحديد الكل ({toArabicDigits(reachable.length)})
            </label>
          </div>
          <ul role="listbox" aria-multiselectable="true" className="max-h-72 overflow-y-auto overscroll-contain p-2">
            {visible.map((user) => (
              <li key={user.id}>
                <label
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-2 py-2",
                    user.acceptsUpdates ? "cursor-pointer hover:bg-emerald-mist" : "cursor-not-allowed opacity-55",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(user.id)}
                    disabled={!user.acceptsUpdates}
                    onChange={() => toggle(user.id)}
                    className="size-4 shrink-0 accent-emerald"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{user.name || "—"}</span>
                    <span className="block truncate text-xs text-muted" dir="ltr">
                      {user.email}
                    </span>
                  </span>
                  {!user.acceptsUpdates && <span className="shrink-0 text-[0.7rem] font-bold text-muted">أوقف الرسائل</span>}
                </label>
              </li>
            ))}
            {visible.length === 0 && <li className="p-4 text-center text-sm text-muted">لا نتائج.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

function ActionButton({
  formAction,
  variant,
  icon,
  children,
  onConfirm,
}: {
  formAction: (formData: FormData) => void;
  variant: "primary" | "outline";
  icon: ReactNode;
  children: ReactNode;
  onConfirm?: () => boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending}
      onClick={(event) => {
        if (onConfirm && !onConfirm()) event.preventDefault();
      }}
      className={buttonClass(variant, "lg", "w-full sm:w-auto")}
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export function AnnouncementComposer({ users, siteUrl, facebookUrl, adminName }: Props) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(users.filter((user) => user.acceptsUpdates).map((user) => user.id)));
  const [sendState, sendAction] = useActionState<FormState | undefined, FormData>(sendAnnouncementAction, undefined);
  const [testState, testAction] = useActionState<FormState | undefined, FormData>(sendTestAnnouncementAction, undefined);
  const [lastResult, setLastResult] = useState<"send" | "test" | null>(null);

  const reachable = users.filter((user) => user.acceptsUpdates).length;
  const everyone = selected.size === reachable;
  const errors = (lastResult === "send" ? sendState : testState)?.fieldErrors;
  const alert = lastResult === "send" ? sendState : lastResult === "test" ? testState : undefined;

  const set = (key: keyof Draft) => (event: { target: { value: string } }) =>
    setDraft((current) => ({ ...current, [key]: event.target.value }));

  const preview = useMemo(
    () =>
      renderAnnouncementEmail(
        {
          title: draft.title || "عنوان الميزة الجديدة",
          intro: draft.intro || "اكتب هنا مقدمة قصيرة تشرح الميزة الجديدة ولماذا أضفناها.",
          preheader: draft.preheader,
          what: draft.what,
          steps: draft.steps.split("\n"),
          benefits: draft.benefits.split("\n"),
          ctaLabel: draft.ctaLabel,
          ctaUrl: draft.ctaUrl,
        },
        { subject: draft.subject || "معاينة", siteUrl, recipientName: adminName, facebookUrl, unsubscribeUrl: `${siteUrl}/account` },
      ).html,
    [draft, siteUrl, adminName, facebookUrl],
  );

  return (
    <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" noValidate>
      <div className="space-y-4">
        <FormAlert error={alert?.error} message={alert?.message} />
        <RecipientPicker users={users} selected={selected} onChange={setSelected} />
        <input type="hidden" name="audience" value={everyone ? "all" : "selected"} />
        {!everyone && [...selected].map((id) => <input key={id} type="hidden" name="recipient" value={id} />)}

        <Field
          label="عنوان الرسالة (Subject)"
          name="subject"
          value={draft.subject}
          onChange={set("subject")}
          placeholder="جديد في المنارة: ثبّت المنارة كتطبيق على جهازك"
          error={errors?.subject}
        />
        <Field
          label="سطر المعاينة (اختياري)"
          name="preheader"
          value={draft.preheader}
          onChange={set("preheader")}
          placeholder="يظهر بجانب العنوان في صندوق الوارد"
          error={errors?.preheader}
        />
        <Field
          label="العنوان الرئيسي داخل الرسالة"
          name="title"
          value={draft.title}
          onChange={set("title")}
          placeholder="ثبّت المنارة كتطبيق على جهازك"
          error={errors?.title}
        />
        <TextArea
          label="المقدمة"
          name="intro"
          value={draft.intro}
          onChange={set("intro")}
          placeholder="يسعدنا أن نخبرك أن..."
          error={errors?.intro}
        />
        <TextArea label="ما هي الميزة؟ (اختياري)" name="what" value={draft.what} onChange={set("what")} error={errors?.what} />
        <TextArea
          label="كيف تحصل عليها؟ (اختياري)"
          name="steps"
          value={draft.steps}
          onChange={set("steps")}
          hint="كل سطر خطوة مرقّمة."
          error={errors?.steps}
        />
        <TextArea
          label="ما الفائدة؟ (اختياري)"
          name="benefits"
          value={draft.benefits}
          onChange={set("benefits")}
          hint="كل سطر نقطة."
          error={errors?.benefits}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="نص الزر"
            name="ctaLabel"
            value={draft.ctaLabel}
            onChange={set("ctaLabel")}
            placeholder="جرّب الميزة الآن"
            error={errors?.ctaLabel}
          />
          <Field
            label="رابط الزر"
            name="ctaUrl"
            value={draft.ctaUrl}
            onChange={set("ctaUrl")}
            dir="ltr"
            placeholder={siteUrl}
            hint="فارغ = الصفحة الرئيسية."
            error={errors?.ctaUrl}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row">
          <ActionButton
            formAction={(formData) => {
              setLastResult("send");
              sendAction(formData);
            }}
            variant="primary"
            icon={<Send aria-hidden />}
            onConfirm={() =>
              selected.size > 0 &&
              window.confirm(`إرسال الرسالة إلى ${toArabicDigits(selected.size)} مستخدم الآن؟ لا يمكن التراجع بعد الإرسال.`)
            }
          >
            إرسال إلى {toArabicDigits(selected.size)} مستخدم
          </ActionButton>
          <ActionButton
            formAction={(formData) => {
              setLastResult("test");
              testAction(formData);
            }}
            variant="outline"
            icon={<FlaskConical aria-hidden />}
          >
            نسخة تجريبية لي
          </ActionButton>
        </div>
        <p className="flex items-start gap-2 text-xs text-muted">
          <Check className="mt-0.5 size-3.5 shrink-0 text-emerald" aria-hidden />
          تصل كل رسالة لصاحبها وحده باسمه، ولا يرى أحد بريد غيره. الحد {toArabicDigits(MAX_RECIPIENTS)} مستلم في المرة بسبب حد Gmail اليومي.
        </p>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 text-sm font-bold text-ink">معاينة مباشرة</p>
        <iframe
          title="معاينة الرسالة"
          srcDoc={preview}
          sandbox=""
          className="h-[70vh] min-h-[32rem] w-full rounded-3xl border border-line bg-[#f3ecdc]"
        />
      </div>
    </form>
  );
}
