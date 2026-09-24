import type { Banner } from "@/domain/twister";

const placeholderImage = "/images/placeholder-banner.svg";

/** business-facts.md: real hero/promo photography is missing — placeholder banner art only. */
export const banners: readonly Banner[] = [
  { id: "banner-hero", image: placeholderImage, headline: "توستر كريبس آند بيتزا", ctaHref: "/menu", order: 1 },
  { id: "banner-grand-opening", image: placeholderImage, headline: "افتتاح كبير — خصم لفترة محدودة", ctaHref: "/offers", order: 2 },
];
