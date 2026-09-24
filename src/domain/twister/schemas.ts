import { z } from "zod";

/**
 * Zod contracts for the Twister Crepes & Pizza storefront domain.
 * Field names and semantics follow `docs/product/domain-model.md` and
 * `docs/product/business-rules.md` exactly — this file is the single source of truth for
 * shapes consumed by mocks, repositories, and feature UI.
 */

export const IsoDateTimeSchema = z.iso.datetime();
export type IsoDateTime = z.infer<typeof IsoDateTimeSchema>;

export const CategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  order: z.number().int().nonnegative(),
});
export type Category = z.infer<typeof CategorySchema>;

export const SizeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /** Difference from the product's basePrice — never an absolute price. */
  priceDelta: z.number().int(),
});
export type Size = z.infer<typeof SizeSchema>;

export const ExtraSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  price: z.number().int().nonnegative(),
  /** Absent means compatible with every size. */
  compatibleSizes: z.array(z.string().min(1)).optional(),
});
export type Extra = z.infer<typeof ExtraSchema>;

export const SpicyLevelSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  order: z.number().int().nonnegative(),
});
export type SpicyLevel = z.infer<typeof SpicyLevelSchema>;

export const ProductSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  images: z.array(z.string().min(1)),
  basePrice: z.number().int().nonnegative(),
  sizes: z.array(SizeSchema).optional(),
  extras: z.array(ExtraSchema).optional(),
  spicyLevels: z.array(SpicyLevelSchema).optional(),
  /** Optional and only ever populated from a confirmed real value — see business-facts.md. */
  calories: z.number().int().nonnegative().optional(),
  isBestseller: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  /** false = placeholder content (price/photo/description not yet owner-confirmed). */
  verified: z.boolean().default(false),
});
export type Product = z.infer<typeof ProductSchema>;

export const CartLineSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  sizeId: z.string().min(1).optional(),
  extraIds: z.array(z.string().min(1)).default([]),
  spicyLevelId: z.string().min(1).optional(),
  quantity: z.number().int().min(1),
  notes: z.string().optional(),
  /** Auto-gift lines (e.g. free fries): price is always 0, not manually removable. */
  isGift: z.boolean().default(false),
});
export type CartLine = z.infer<typeof CartLineSchema>;

/** `weekly-thursday` recurs every Cairo-local Thursday; `none` uses startAt/endAt literally. */
export const OfferRecurrenceSchema = z.enum(["none", "weekly-thursday"]);
export type OfferRecurrence = z.infer<typeof OfferRecurrenceSchema>;

export const OfferSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  startAt: IsoDateTimeSchema,
  endAt: IsoDateTimeSchema,
  bannerImage: z.string().min(1),
  linkedCategoryId: z.string().min(1).optional(),
  recurrence: OfferRecurrenceSchema.default("none"),
});
export type Offer = z.infer<typeof OfferSchema>;
export type OfferStatus = "scheduled" | "active" | "expired";

export const CouponKindSchema = z.enum(["percent", "fixed", "freeItem"]);
export type CouponKind = z.infer<typeof CouponKindSchema>;

export const CouponSchema = z.object({
  code: z.string().min(1),
  kind: CouponKindSchema,
  /** percent: 0-100; fixed: EGP amount; freeItem: the productId given free. */
  value: z.union([z.number(), z.string()]),
  minSubtotal: z.number().int().nonnegative().default(0),
  expiresAt: IsoDateTimeSchema.optional(),
  stackable: z.boolean().default(false),
});
export type Coupon = z.infer<typeof CouponSchema>;

export const ZoneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  deliveryFee: z.number().int().nonnegative(),
  minOrder: z.number().int().nonnegative(),
  isServed: z.boolean().default(true),
});
export type Zone = z.infer<typeof ZoneSchema>;

export const ReviewSchema = z.object({
  id: z.string().min(1),
  authorName: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1),
  source: z.enum(["real", "placeholder"]),
});
export type Review = z.infer<typeof ReviewSchema>;

export const FaqSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  order: z.number().int().nonnegative(),
});
export type Faq = z.infer<typeof FaqSchema>;

export const BannerSchema = z.object({
  id: z.string().min(1),
  image: z.string().min(1),
  headline: z.string().min(1),
  ctaHref: z.string().min(1),
  order: z.number().int().nonnegative(),
});
export type Banner = z.infer<typeof BannerSchema>;

export const AnnouncementSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  isActive: z.boolean().default(false),
});
export type Announcement = z.infer<typeof AnnouncementSchema>;

export const WeeklyHoursSchema = z.object({
  /** 0 = Sunday .. 6 = Saturday, matching Cairo-local weekday numbering used across this module. */
  weekday: z.number().int().min(0).max(6),
  /** "HH:MM" 24h, Africa/Cairo local time. `closesAt` may be earlier than `opensAt` (crosses midnight). */
  opensAt: z.string().regex(/^\d{2}:\d{2}$/),
  closesAt: z.string().regex(/^\d{2}:\d{2}$/),
});
export type WeeklyHours = z.infer<typeof WeeklyHoursSchema>;

export const BusinessInfoSchema = z.object({
  address: z.string().min(1),
  phone: z.string().min(1),
  whatsappNumber: z.string().min(1),
  socials: z.record(z.string(), z.string().min(1)).default({}),
  hours: z.array(WeeklyHoursSchema),
  /** false = placeholder pending the restaurant owner's confirmation (business-facts.md). */
  verified: z.boolean().default(false),
});
export type BusinessInfo = z.infer<typeof BusinessInfoSchema>;

export const PaymentMethodSchema = z.enum(["cash", "vodafone-cash"]);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const CustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  zoneId: z.string().min(1),
  landmark: z.string().optional(),
});
export type Customer = z.infer<typeof CustomerSchema>;

export const OrderDraftSchema = z.object({
  customer: CustomerSchema,
  lines: z.array(CartLineSchema).min(1),
  couponCode: z.string().optional(),
  paymentMethod: PaymentMethodSchema,
  notes: z.string().optional(),
});
export type OrderDraft = z.infer<typeof OrderDraftSchema>;

export const CartTotalsSchema = z.object({
  subtotal: z.number().int(),
  discount: z.number().int().nonnegative(),
  deliveryFee: z.number().int().nonnegative(),
  total: z.number().int(),
});
export type CartTotals = z.infer<typeof CartTotalsSchema>;

export const OrderSchema = z.object({
  orderRef: z.string().min(1),
  draft: OrderDraftSchema,
  totals: CartTotalsSchema,
  createdAt: IsoDateTimeSchema,
  /** Only local-log state exists in this milestone — real confirmation happens over WhatsApp. */
  status: z.literal("submitted"),
});
export type Order = z.infer<typeof OrderSchema>;
