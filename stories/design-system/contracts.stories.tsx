import type { ReactNode } from "react";
import { AsyncAction, OpinionGroup, ScholarIdentity, SourceCitation, StatePanel, StatusTimeline, TrustMark } from "../../src/components/patterns";
import { Button, TextField } from "../../src/components/ui";

export default { title: "Design System/Contracts", parameters: { layout: "padded" } };

const Frame = ({ children, dir = "rtl", theme = "light" }: { children: ReactNode; dir?: "rtl" | "ltr"; theme?: "light" | "dark" }) => <div dir={dir} data-theme={theme} style={{ background: "var(--ds-color-canvas)", color: "var(--ds-color-text)", padding: 24 }}>{children}</div>;

export const Primitives = () => <Frame><div className="ds-stack"><Button>إجراء أساسي</Button><Button variant="secondary">إجراء ثانوي</Button><Button loading>حفظ</Button><TextField id="question" label="عنوان السؤال" hint="من 10 إلى 160 حرفًا" error="أكمل عنوان السؤال." /></div></Frame>;
export const TrustAndSources = () => <Frame><div className="ds-stack"><ScholarIdentity name="د. عبد الرحمن بن محمد الطويل" specialty="أصول الفقه ومقاصد الشريعة" status="approved" initials="عم" /><TrustMark status="approved" verifiedAt="2026-08-22" /><SourceCitation index={1} type="كتاب" title="عنوان مرجع عربي طويل لاختبار الالتفاف في المساحات الضيقة" authorOrOrg="جهة علمية" locator="ج 2، ص 41" /></div></Frame>;
export const DisagreementEqualWeight = () => <Frame><div className="ds-opinion-list"><p>في هذه المسألة آراء معتبرة موثقة بالمصادر.</p>{["الرأي الأول", "الرأي الآخر"].map((label, i) => <OpinionGroup key={label} id={`opinion-${i}`} label={label} summary="ملخص محايد للرأي دون ترتيب أو دلالة فوز." applicability="يعتمد التطبيق على سياق السؤال." evidence={<SourceCitation index={i + 1} type="بحث" title="مرجع منظم" />} />)}</div></Frame>;
export const AsyncStates = () => <Frame><div className="ds-stack"><AsyncAction state="pending" label="إرسال" onAction={() => undefined} /><AsyncAction state="uncertain" label="إرسال" message="لم نتمكن من تأكيد النتيجة. تحقق من الحالة قبل إعادة الإرسال." onAction={() => undefined} onRetry={() => undefined} /></div></Frame>;
export const StatusHistory = () => <Frame><StatusTimeline items={[{ id: "1", status: "قيد المراجعة", description: "استلمنا الطلب.", timestamp: "2026-08-22" }, { id: "2", status: "معلومات مطلوبة", description: "نحتاج مستندًا إضافيًا.", timestamp: "2026-08-23", actorLabel: "فريق المراجعة" }]} /></Frame>;
export const SharedState = () => <Frame><StatePanel kind="privacy" title="تعذر الوصول" message="تعذر العثور على الصفحة أو لا يمكنك الوصول إليها." /></Frame>;
export const DarkRtl = () => <Frame theme="dark"><TrustAndSources /></Frame>;
export const LtrMixedContent = () => <Frame dir="ltr"><SourceCitation index={3} type="Paper" title="Arabic العربية and English mixed reference" /></Frame>;
