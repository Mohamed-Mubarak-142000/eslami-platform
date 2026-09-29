import type { Metadata } from "next";
import { MailX } from "lucide-react";
import { UnsubscribeButton } from "@/features/announcements/AnnouncementSettings";
import { isValidUnsubscribeToken } from "@/features/announcements/links";

export const metadata: Metadata = { title: "إيقاف رسائل التحديثات", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function UnsubscribePage({ searchParams }: PageProps<"/unsubscribe">) {
  const params = await searchParams;
  const userId = typeof params.u === "string" ? params.u : "";
  const token = typeof params.t === "string" ? params.t : "";
  const valid = UUID.test(userId) && token.length > 0 && isValidUnsubscribeToken(userId, token);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <span className="grid size-16 place-items-center rounded-3xl bg-gold-mist text-gold-deep">
        <MailX className="size-8" aria-hidden />
      </span>
      <h1 className="mt-6 text-3xl font-bold text-emerald-deep">إيقاف رسائل التحديثات</h1>
      {valid ? (
        <>
          <p className="mt-3 text-muted">
            لن تصلك بعد الآن رسائل عن الميزات الجديدة. ستبقى رسائل الحساب المهمة، مثل أكواد الدخول، تصلك كالمعتاد.
          </p>
          <div className="mt-8 w-full max-w-xs">
            <UnsubscribeButton userId={userId} token={token} />
          </div>
          <p className="mt-6 text-xs text-muted">يمكنك إعادة تفعيلها في أي وقت من صفحة «حسابي».</p>
        </>
      ) : (
        <p className="mt-3 text-muted">هذا الرابط غير صالح. يمكنك إيقاف الرسائل من صفحة «حسابي» بعد تسجيل الدخول.</p>
      )}
    </div>
  );
}
