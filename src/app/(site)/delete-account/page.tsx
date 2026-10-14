import type { Metadata } from "next";
import { UserX } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LegalDocument, type LegalSection } from "@/features/legal/LegalDocument";

/**
 * The public page app stores ask for: how to delete an Al-Manara account and everything tied to it,
 * reachable without signing in or installing the app (Google Play's "Delete account URL").
 */
export const metadata: Metadata = {
  title: "حذف الحساب والبيانات",
  description: "كيف تحذف حسابك في المنارة (الموقع وتطبيق المنارة) وكل البيانات المرتبطة به.",
  alternates: { canonical: "/delete-account" },
};

const CONTACT = "almanaraapp14@gmail.com";

const SECTIONS: LegalSection[] = [
  {
    title: "عن هذه الصفحة",
    body: (
      <p>
        هذه الصفحة تشرح كيف تحذف حسابك في <strong>المنارة</strong> (منصة المنارة وتطبيق «المنارة - قرآن وأذان وأذكار» على Android)، وما
        البيانات التي تُحذف معه. الحساب واحد للموقع والتطبيق، فحذفه من أيٍّ منهما يحذفه من الاثنين.
      </p>
    ),
  },
  {
    title: "الطريقة الأولى: من التطبيق",
    body: (
      <ol className="list-decimal space-y-1 ps-5">
        <li>افتح تطبيق المنارة وسجّل الدخول.</li>
        <li>اذهب إلى «المزيد» ثم اضغط على بطاقة حسابك.</li>
        <li>في آخر الصفحة، في قسم «حذف الحساب»، اكتب كلمة «حذف» ثم اضغط «حذف حسابي نهائيًا».</li>
      </ol>
    ),
  },
  {
    title: "الطريقة الثانية: من الموقع",
    body: (
      <ol className="list-decimal space-y-1 ps-5">
        <li>
          سجّل الدخول في الموقع ثم افتح صفحة <a href="/account">الحساب</a>.
        </li>
        <li>في قسم «حذف الحساب»، اكتب كلمة «حذف» ثم اضغط زر الحذف.</li>
      </ol>
    ),
  },
  {
    title: "الطريقة الثالثة: بالبريد الإلكتروني",
    body: (
      <p>
        إن لم تستطع الدخول إلى حسابك، راسلنا من البريد الإلكتروني المسجّل به الحساب على{" "}
        <a href={`mailto:${CONTACT}?subject=${encodeURIComponent("طلب حذف حساب المنارة")}`}>{CONTACT}</a> بعنوان «طلب حذف حساب»، وسنحذفه
        خلال 7 أيام ونؤكّد لك ذلك بالبريد.
      </p>
    ),
  },
  {
    title: "ما الذي يُحذف",
    body: (
      <>
        <p>يُحذف نهائيًا وفورًا عند حذف الحساب:</p>
        <ul className="list-disc space-y-1 ps-5">
          <li>بيانات الحساب: الاسم والبريد الإلكتروني وكلمة المرور.</li>
          <li>ملفات الأطفال المرتبطة بالحساب وكل تقدّمهم في قسم الأطفال.</li>
          <li>تقدّم الحفظ والمراجعة، وجلسات التسميع، والاختبارات والشهادات.</li>
          <li>الختمات وخطط الحفظ وآخر موضع قراءة والإعدادات المحفوظة.</li>
          <li>اشتراكات التذكير بالبريد وإشعارات الجهاز، وأي طلب دعم أو رسالة شكر مرتبطة بالحساب.</li>
        </ul>
      </>
    ),
  },
  {
    title: "ما الذي لا يُحذف",
    body: (
      <p>
        لا نحتفظ بأي بيانات شخصية بعد الحذف. قد تبقى نسخ احتياطية مشفّرة لقاعدة البيانات لدى مزوّد الاستضافة لمدة أقصاها 7 أيام ثم تُمحى
        تلقائيًا. البيانات المحفوظة على جهازك فقط (مثل التسجيلات والمحفوظات المنزّلة) تُحذف بحذف التطبيق من الجهاز.
      </p>
    ),
  },
];

export default function DeleteAccountPage() {
  return (
    <>
      <PageHeader
        kicker="الخصوصية"
        icon={<UserX className="size-4" aria-hidden />}
        title="حذف الحساب والبيانات"
        description="احذف حسابك في المنارة وكل ما يرتبط به، من التطبيق أو الموقع أو بالبريد."
      />
      <LegalDocument updated="14 أكتوبر 2026" sections={SECTIONS} />
    </>
  );
}
