"use client";

import { useActionState, useState, useTransition, type ReactNode } from "react";
import { Baby, BellRing, KeyRound, Mail, Pencil, Plus, Trash2, TriangleAlert, UserRound, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { Field, FormAlert, SubmitButton } from "@/features/auth/ui/AuthFields";
import type { FormState } from "@/features/auth/actions";
import type { LearnerRow } from "@/lib/supabase/database.types";
import { ReminderToggles, type ReminderPrefs } from "@/features/reminders/ReminderSettings";
import { useAccountContext } from "./AccountProvider";
import { EmailUpdatesToggle } from "@/features/announcements/AnnouncementSettings";
import {
  addChildAction,
  changePasswordAction,
  deleteAccountAction,
  removeChildAction,
  updateChildAction,
  updateProfileAction,
} from "./actions";

type Action = (state: FormState | undefined, formData: FormData) => Promise<FormState>;

function useForm(action: Action) {
  return useActionState<FormState | undefined, FormData>(action, undefined);
}

function Section({
  icon,
  title,
  description,
  children,
  tone = "default",
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <section className={cn("rounded-4xl border bg-white p-5 shadow-soft sm:p-7", tone === "danger" ? "border-rose/30" : "border-line")}>
      <div className="mb-5 flex items-start gap-3">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-2xl",
            tone === "danger" ? "bg-rose/10 text-rose" : "bg-gold-mist text-gold-deep",
          )}
        >
          {icon}
        </span>
        <div>
          <h2 className="text-xl font-bold text-emerald-deep">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function ProfileForm({ fullName, certificateName, email }: { fullName: string; certificateName: string; email: string }) {
  const [state, action] = useForm(updateProfileAction);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <FormAlert error={state?.error} message={state?.message} className="sm:col-span-2" />
      <Field className="sm:col-span-2" label="البريد الإلكتروني" name="email" value={email} readOnly dir="ltr" disabled />
      <Field label="الاسم" name="fullName" defaultValue={fullName} autoComplete="name" required error={state?.fieldErrors?.fullName} />
      <Field
        label="الاسم على الشهادات"
        name="certificateName"
        defaultValue={certificateName || fullName}
        required
        error={state?.fieldErrors?.certificateName}
        hint="اكتبه كاملًا كما تحب أن يُطبع على شهاداتك."
      />
      <div className="sm:col-span-2 sm:max-w-56">
        <SubmitButton>حفظ البيانات</SubmitButton>
      </div>
    </form>
  );
}

function ChildForm({ child, onDone }: { child?: LearnerRow; onDone?: () => void }) {
  const { refresh } = useAccountContext();
  const [state, action] = useForm(async (previous, formData) => {
    const result = await (child ? updateChildAction : addChildAction)(previous, formData);
    if (!result.error && !result.fieldErrors) {
      // The header's learner switcher reads the client-side account; reload it so the child shows at once.
      refresh();
      onDone?.();
    }
    return result;
  });
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-start" noValidate>
      {child && <input type="hidden" name="learnerId" value={child.id} />}
      <FormAlert error={state?.error} message={child ? undefined : state?.message} className="sm:col-span-3" />
      <Field
        label="اسم الطفل"
        name="displayName"
        defaultValue={child?.display_name ?? ""}
        required
        error={state?.fieldErrors?.displayName}
      />
      <Field
        label="سنة الميلاد (اختياري)"
        name="birthYear"
        defaultValue={child?.birth_year ? String(child.birth_year) : ""}
        inputMode="numeric"
        dir="ltr"
        error={state?.fieldErrors?.birthYear}
      />
      <div className="sm:pt-7">
        <SubmitButton className="h-12">{child ? "حفظ" : "إضافة"}</SubmitButton>
      </div>
    </form>
  );
}

function ChildRow({ child }: { child: LearnerRow }) {
  const { refresh } = useAccountContext();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [removing, startRemove] = useTransition();

  if (editing) {
    return (
      <li className="rounded-3xl border border-emerald/20 bg-emerald-mist/50 p-4">
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="grid size-8 place-items-center rounded-full text-muted hover:bg-white"
            aria-label="إلغاء التعديل"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <ChildForm child={child} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-3xl border border-line p-3 ps-4">
      <span className="grid size-10 place-items-center rounded-full bg-sky/15 font-display font-bold text-sky">
        {child.display_name.charAt(0)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{child.display_name}</p>
        {child.birth_year && <p className="text-xs text-muted">مواليد {toArabicDigits(child.birth_year)}</p>}
      </div>
      {error && <p className="w-full text-sm font-semibold text-rose">{error}</p>}
      {confirming ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-rose">سيُحذف كل تقدّمه، متأكد؟</span>
          <button
            type="button"
            disabled={removing}
            onClick={() =>
              startRemove(async () => {
                const result = await removeChildAction(child.id);
                if (result.error) setError(result.error);
                else refresh();
                setConfirming(false);
              })
            }
            className={buttonClass("primary", "sm", "bg-rose hover:bg-rose/90")}
          >
            نعم، احذف
          </button>
          <button type="button" onClick={() => setConfirming(false)} className={buttonClass("ghost", "sm")}>
            تراجع
          </button>
        </div>
      ) : (
        <div className="flex gap-1">
          <button type="button" onClick={() => setEditing(true)} className={buttonClass("ghost", "sm")}>
            <Pencil aria-hidden /> تعديل
          </button>
          <button type="button" onClick={() => setConfirming(true)} className={buttonClass("ghost", "sm", "text-rose hover:bg-rose/10")}>
            <Trash2 aria-hidden /> حذف
          </button>
        </div>
      )}
    </li>
  );
}

function ChildrenManager({ items }: { items: LearnerRow[] }) {
  const [adding, setAdding] = useState(items.length === 0);
  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <ul className="space-y-3">
          {items.map((child) => (
            <ChildRow key={child.id} child={child} />
          ))}
        </ul>
      )}
      {adding ? (
        <div className="rounded-3xl border border-dashed border-gold/50 bg-gold-mist/40 p-4">
          <ChildForm />
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className={buttonClass("outline")}>
          <Plus aria-hidden /> إضافة طفل
        </button>
      )}
    </div>
  );
}

function PasswordForm() {
  const [state, action] = useForm(changePasswordAction);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <FormAlert error={state?.error} message={state?.message} className="sm:col-span-2" />
      <Field
        label="كلمة المرور الجديدة"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        error={state?.fieldErrors?.password}
        hint="٨ أحرف على الأقل."
      />
      <Field
        label="تأكيد كلمة المرور"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        error={state?.fieldErrors?.confirm}
      />
      <div className="sm:col-span-2 sm:max-w-56">
        <SubmitButton>تغيير كلمة المرور</SubmitButton>
      </div>
    </form>
  );
}

function DeleteAccountForm() {
  const [state, action] = useForm(deleteAccountAction);
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormAlert error={state?.error} />
      <Field label='اكتب "حذف" للتأكيد' name="confirm" autoComplete="off" error={state?.fieldErrors?.confirm} className="sm:max-w-xs" />
      <div className="sm:max-w-56">
        <SubmitButton className="bg-rose hover:bg-rose/90">حذف حسابي نهائيًا</SubmitButton>
      </div>
    </form>
  );
}

interface AccountSettingsProps {
  email: string;
  fullName: string;
  certificateName: string;
  childLearners: LearnerRow[];
  emailUpdates: boolean;
  reminders: ReminderPrefs;
}

export function AccountSettings({ email, fullName, certificateName, childLearners, emailUpdates, reminders }: AccountSettingsProps) {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 py-10 sm:px-6">
      <Section icon={<UserRound aria-hidden />} title="بياناتي" description="الاسم على الشهادات يُثبَّت في كل شهادة لحظة إصدارها.">
        <ProfileForm fullName={fullName} certificateName={certificateName} email={email} />
      </Section>
      <Section
        icon={<Baby aria-hidden />}
        title="أطفالي"
        description="لكل طفل ملف مستقل بحفظه وألعابه وشهاداته، وتنتقل بينهم من حديقة الأطفال أو من رحلتي."
      >
        <ChildrenManager items={childLearners} />
      </Section>
      <Section
        icon={<KeyRound aria-hidden />}
        title="كلمة المرور"
        description="إن كنت تدخل بحساب جوجل، يمكنك هنا تعيين كلمة مرور للدخول بالبريد أيضًا."
      >
        <PasswordForm />
      </Section>
      <Section icon={<Mail aria-hidden />} title="رسائل التحديثات" description="رسائل قليلة على بريدك عند إضافة ميزة جديدة للمنارة.">
        <EmailUpdatesToggle enabled={emailUpdates} />
      </Section>
      <Section
        icon={<BellRing aria-hidden />}
        title="تذكيرات الأيام المميزة"
        description="رسالة على بريدك في الأيام الفاضلة: صباح الجمعة بسورة الكهف، وليلة أيام الصيام، ومواسم الخير."
      >
        <ReminderToggles prefs={reminders} />
      </Section>
      <Section
        tone="danger"
        icon={<TriangleAlert aria-hidden />}
        title="حذف الحساب"
        description="يُحذف حسابك وملفات أطفالك وكل التقدّم والشهادات نهائيًا، ولا يمكن التراجع."
      >
        <DeleteAccountForm />
      </Section>
    </div>
  );
}
