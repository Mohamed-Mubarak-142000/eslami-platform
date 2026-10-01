import type { Metadata } from "next";
import { MailX } from "lucide-react";
import { UnsubscribeButton } from "@/features/announcements/AnnouncementSettings";
import { isValidUnsubscribeToken, parseMailingList } from "@/features/announcements/links";

export const metadata: Metadata = { title: "إيقاف الرسائل", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const COPY = {
  updates: {
    title: "إيقاف رسائل التحديثات",
    body: "لن تصلك بعد الآن رسائل عن الميزات الجديدة. ستبقى رسائل الحساب المهمة، مثل أكواد الدخول، تصلك كالمعتاد.",
  },
  reminders: {
    title: "إيقاف تذكيرات الأيام المميزة",
    body: "لن تصلك بعد الآن تذكيرات الجمعة والصيام والمواسم. ستبقى رسائل الحساب المهمة، مثل أكواد الدخول، تصلك كالمعتاد.",
  },
};

export default async function UnsubscribePage({ searchParams }: PageProps<"/unsubscribe">) {
  const params = await searchParams;
  const userId = typeof params.u === "string" ? params.u : "";
  const token = typeof params.t === "string" ? params.t : "";
  const list = parseMailingList(params.list);
  const valid = UUID.test(userId) && token.length > 0 && isValidUnsubscribeToken(userId, token, list);
  const copy = COPY[list];

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <span className="grid size-16 place-items-center rounded-3xl bg-gold-mist text-gold-deep">
        <MailX className="size-8" aria-hidden />
      </span>
      <h1 className="mt-6 text-3xl font-bold text-emerald-deep">{copy.title}</h1>
      {valid ? (
        <>
          <p className="mt-3 text-muted">{copy.body}</p>
          <div className="mt-8 w-full max-w-xs">
            <UnsubscribeButton userId={userId} token={token} list={list} label={copy.title} />
          </div>
          <p className="mt-6 text-xs text-muted">يمكنك إعادة تفعيلها في أي وقت من صفحة «حسابي».</p>
        </>
      ) : (
        <p className="mt-3 text-muted">هذا الرابط غير صالح. يمكنك إيقاف الرسائل من صفحة «حسابي» بعد تسجيل الدخول.</p>
      )}
    </div>
  );
}
