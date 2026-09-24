import { useState, type ReactNode } from "react";
import {
  Button,
  Carousel,
  CountdownDisplay,
  Dialog,
  QuantityStepper,
  RatingStars,
  Sheet,
  Tabs,
  ToastRegion,
} from "../../src/components/ui";
import {
  AdminDataTable,
  AdminFormLayout,
  AdminLocalDataNotice,
  AdminStatTile,
  CategoryChip,
  CtaSection,
  FaqList,
  OfferBanner,
  ProductCard,
  SectionHeading,
  StatCounter,
  TestimonialCard,
  ZoneCard,
} from "../../src/components/patterns";

export default { title: "Twister", parameters: { layout: "padded" } };

const Frame = ({ children }: { children: ReactNode }) => (
  <div dir="rtl" lang="ar" style={{ background: "var(--ds-color-canvas)", color: "var(--ds-color-text)", padding: 24 }}>
    {children}
  </div>
);

export const Buttons = () => (
  <Frame>
    <div className="ds-cluster">
      <Button variant="primary">اطلب الآن</Button>
      <Button variant="accent">أضف للسلة</Button>
      <Button variant="whatsapp">إرسال عبر واتساب</Button>
      <Button variant="secondary">إجراء ثانوي</Button>
      <Button variant="ghost">إجراء خفيف</Button>
      <Button variant="danger">حذف</Button>
      <Button loading>جارٍ الحفظ</Button>
      <Button disabled>غير متاح</Button>
    </div>
  </Frame>
);

export const StickyTabs = () => {
  const [value, setValue] = useState("pizza");
  return (
    <Frame>
      <Tabs
        aria-label="تصنيفات المنيو"
        items={[
          { id: "pizza", label: "بيتزا" },
          { id: "burger", label: "برجر" },
          { id: "syrian", label: "سوري" },
          { id: "crepe-chicken", label: "كريب فراخ" },
        ]}
        value={value}
        onChange={setValue}
      />
    </Frame>
  );
};

export const FaqAccordion = () => (
  <Frame>
    <FaqList
      items={[
        { id: "1", title: "هل التوصيل متاح لكل المناطق؟", content: "التوصيل متاح حاليًا لمناطق محددة، تقدر تشوفها في صفحة اتصل بنا." },
        { id: "2", title: "إزاي أطلب؟", content: "تقدر تطلب من المنيو مباشرة وهيتفتح واتساب برسالة طلبك جاهزة." },
      ]}
    />
  </Frame>
);

export const DialogExample = () => {
  const [open, setOpen] = useState(true);
  return (
    <Frame>
      <Button onClick={() => setOpen(true)}>فتح المعاينة السريعة</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="بيتزا سوبريم">
        <p>فراخ مشوية، فلفل، ذرة، مشروم.</p>
      </Dialog>
    </Frame>
  );
};

export const SheetExample = () => {
  const [open, setOpen] = useState(true);
  return (
    <Frame>
      <Button onClick={() => setOpen(true)}>فتح السلة</Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="سلتك">
        <p>سلتك فاضية لسه!</p>
      </Sheet>
    </Frame>
  );
};

export const Stepper = () => {
  const [value, setValue] = useState(1);
  return <Frame><QuantityStepper value={value} onChange={setValue} /></Frame>;
};

export const Rating = () => (
  <Frame>
    <div className="ds-stack">
      <RatingStars value={4} label="تقييم توضيحي" />
      <RatingStars value={2} onChange={() => undefined} label="قيّم تجربتك" />
    </div>
  </Frame>
);

export const Countdown = () => (
  <Frame><CountdownDisplay value={{ days: 1, hours: 4, minutes: 32, seconds: 9 }} aria-label="ينتهي عرض الخميس بعد" /></Frame>
);

export const BestsellerCarousel = () => (
  <Frame>
    <Carousel aria-label="الأكثر طلبًا">
      {["بيتزا سوبريم", "برجر تشيز دبل", "كريب فراخ باربكيو"].map((name) => (
        <div key={name} style={{ minWidth: 220 }}>
          <ProductCard name={name} priceFromLabel="يبدأ من 95 ج.م" isBestseller onAdd={() => undefined} />
        </div>
      ))}
    </Carousel>
  </Frame>
);

export const Toasts = () => (
  <Frame>
    <ToastRegion items={[{ id: "1", tone: "success", message: "تمت الإضافة للسلة" }, { id: "2", tone: "error", message: "الكود منتهي" }]} />
  </Frame>
);

export const ProductCardStates = () => (
  <Frame>
    <div className="ds-cluster">
      <ProductCard name="بيتزا مارجريتا" priceFromLabel="يبدأ من 110 ج.م" onAdd={() => undefined} />
      <ProductCard name="بيتزا سوبريم" priceFromLabel="يبدأ من 140 ج.م" isBestseller onAdd={() => undefined} />
      <ProductCard name="بيتزا فور تشيز" priceFromLabel="يبدأ من 155 ج.م" isAvailable={false} />
    </div>
  </Frame>
);

export const CategoryChips = () => (
  <Frame>
    <div className="ds-cluster">
      <CategoryChip label="بيتزا" active onClick={() => undefined} />
      <CategoryChip label="برجر" onClick={() => undefined} />
      <CategoryChip label="سوري" onClick={() => undefined} />
    </div>
  </Frame>
);

export const OfferBannerExample = () => (
  <Frame>
    <OfferBanner title="الافتتاح الكبير" description="خصم لفترة محدودة على كل المنيو" countdown={<CountdownDisplay value={{ days: 2, hours: 0, minutes: 0, seconds: 0 }} aria-label="ينتهي العرض بعد" />} />
  </Frame>
);

export const Testimonials = () => (
  <Frame>
    <div className="ds-cluster">
      <TestimonialCard authorName="أحمد" rating={5} text="الأكل جامد جدًا والتوصيل سريع" isPlaceholder />
    </div>
  </Frame>
);

export const ZoneCards = () => (
  <Frame>
    <div className="ds-stack">
      <ZoneCard name="مدينة نصر" deliveryFeeLabel="20 ج.م" minOrderLabel="100 ج.م" />
      <ZoneCard name="التجمع" deliveryFeeLabel="—" minOrderLabel="—" isServed={false} />
    </div>
  </Frame>
);

export const SectionHeadingExample = () => <Frame><SectionHeading title="ليه تختار Twister؟" subtitle="جودة، سرعة، وطعم مختلف" /></Frame>;
export const CtaSectionExample = () => <Frame><CtaSection title="جعان دلوقتي؟" ctaLabel="اطلب الآن" onCtaClick={() => undefined} /></Frame>;
export const StatCounters = () => (
  <Frame>
    <div className="ds-cluster">
      <StatCounter value="+500" label="طلب شهريًا" />
      <StatCounter value="15 دقيقة" label="متوسط وقت التحضير" />
    </div>
  </Frame>
);

export const DataTableExample = () => (
  <Frame>
    <AdminDataTable
      columns={[{ key: "name", header: "الاسم", render: (row: { name: string }) => row.name }]}
      rows={[{ name: "بيتزا مارجريتا" }]}
      getRowKey={(row) => row.name}
      emptyMessage="لا يوجد منتجات بعد"
    />
  </Frame>
);

export const FormLayoutExample = () => (
  <Frame>
    <AdminFormLayout onSubmit={(event) => event.preventDefault()} submitLabel="حفظ المنتج">
      <p>حقول النموذج تُبنى بواسطة feature-ui-agent باستخدام React Hook Form.</p>
    </AdminFormLayout>
  </Frame>
);

export const StatTiles = () => (
  <Frame>
    <div className="ds-cluster">
      <AdminStatTile label="عدد الطلبات" value="12" hint="محلي على هذا المتصفح فقط" />
    </div>
  </Frame>
);

export const LocalDataNotice = () => <Frame><AdminLocalDataNotice /></Frame>;
