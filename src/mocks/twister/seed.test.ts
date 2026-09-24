import { describe, expect, it } from "vitest";
import {
  AnnouncementSchema,
  BannerSchema,
  BusinessInfoSchema,
  CategorySchema,
  CouponSchema,
  FaqSchema,
  OfferSchema,
  ProductSchema,
  ReviewSchema,
  ZoneSchema,
} from "@/domain/twister";
import { announcements, banners, businessInfo, categories, coupons, faqs, offers, products, reviews, zones } from "./index";

describe("twister seed data", () => {
  it("matches the category schema and menu-catalog.md's 10 categories", () => {
    expect(categories).toHaveLength(10);
    for (const category of categories) expect(() => CategorySchema.parse(category)).not.toThrow();
  });

  it("matches the product schema for every menu-catalog.md item", () => {
    expect(products.length).toBeGreaterThan(0);
    const categoryIds = new Set(categories.map((category) => category.id));
    for (const product of products) {
      expect(() => ProductSchema.parse(product)).not.toThrow();
      expect(categoryIds.has(product.categoryId)).toBe(true);
      expect(product.verified).toBe(false); // owner-confirm placeholders per business-facts.md
    }
  });

  it("matches the zone schema", () => {
    for (const zone of zones) expect(() => ZoneSchema.parse(zone)).not.toThrow();
    expect(zones.some((zone) => !zone.isServed)).toBe(true);
  });

  it("matches the coupon schema", () => {
    for (const coupon of coupons) expect(() => CouponSchema.parse(coupon)).not.toThrow();
  });

  it("matches the offer schema and covers all three offers.md entries", () => {
    expect(offers.map((offer) => offer.id).sort()).toEqual(["free-fries", "grand-opening", "thursday-offer"]);
    for (const offer of offers) expect(() => OfferSchema.parse(offer)).not.toThrow();
  });

  it("matches the business info schema and is marked unverified", () => {
    expect(() => BusinessInfoSchema.parse(businessInfo)).not.toThrow();
    expect(businessInfo.verified).toBe(false);
    expect(businessInfo.hours).toHaveLength(7);
  });

  it("matches the review schema and never presents a placeholder as real", () => {
    for (const review of reviews) {
      expect(() => ReviewSchema.parse(review)).not.toThrow();
      expect(review.source).toBe("placeholder");
    }
  });

  it("matches the faq schema", () => {
    for (const faq of faqs) expect(() => FaqSchema.parse(faq)).not.toThrow();
  });

  it("matches the banner schema", () => {
    for (const banner of banners) expect(() => BannerSchema.parse(banner)).not.toThrow();
  });

  it("matches the announcement schema", () => {
    for (const announcement of announcements) expect(() => AnnouncementSchema.parse(announcement)).not.toThrow();
  });
});
