import type { ReactNode } from "react";
import { Button } from "@/components/ui";
import { StatePanel, type StateKind } from "@/components/patterns";

export type FeatureStatus = "ready" | StateKind;

const copy: Record<StateKind, { title: string; message: string }> = {
  loading: { title: "جارٍ التحميل", message: "جارٍ تحميل المحتوى…" },
  empty: { title: "لا توجد نتائج", message: "لا يوجد محتوى هنا بعد." },
  error: { title: "تعذر التحميل", message: "تعذر تحميل هذه الصفحة. حاول مرة أخرى." },
  offline: { title: "أنت غير متصل", message: "لا يوجد اتصال بالإنترنت. تحقق من الشبكة ثم أعد المحاولة." },
  permission: { title: "الوصول غير متاح", message: "لا تملك صلاحية الوصول إلى هذه الصفحة." },
  privacy: { title: "الصفحة غير متاحة", message: "تعذر العثور على الصفحة أو لا يمكنك الوصول إليها." },
  conflict: { title: "تغيّرت الحالة", message: "حفظنا مسودتك؛ راجع التحديث ثم أعد الإرسال." },
};

export function FeatureState({ status, children, onRetry }: { status?: FeatureStatus; children: ReactNode; onRetry?: () => void }) {
  if (!status || status === "ready") return <>{children}</>;
  const value = copy[status];
  return <StatePanel kind={status} title={value.title} message={value.message} action={onRetry && (status === "error" || status === "offline") ? <Button onClick={onRetry}>إعادة المحاولة</Button> : undefined} />;
}

export function OfflineNotice({ cachedAt }: { cachedAt?: string }) {
  return <aside role="status" aria-live="polite">تعرض نسخة محفوظة وقد لا تشمل أحدث التغييرات.{cachedAt && <> آخر نسخة: <time dateTime={cachedAt}>{cachedAt}</time></>}</aside>;
}
