import type { Announcement, Banner, Coupon, Offer, Order, Product, Zone, BusinessInfo } from "@/domain/twister";
import { announcements, banners, businessInfo, coupons, offers, products, zones } from "@/mocks/twister";
import { createLocalCrudRepository } from "./local-crud-repository";
import { createLocalLogRepository } from "./local-log-repository";
import { createLocalSingletonRepository } from "./local-singleton-repository";

/**
 * Local-sandbox repositories for the admin CRUD resources (admin-requirements.md: 6 resources,
 * `localStorage` only, no real backend). Every key is namespaced under `twister:` to avoid
 * clashing with unrelated app storage.
 */
export const productsRepository = createLocalCrudRepository<Product>("twister:products", products);
export const offersRepository = createLocalCrudRepository<Offer>("twister:offers", offers);
export const zonesRepository = createLocalCrudRepository<Zone>("twister:zones", zones);
export const couponsRepository = createLocalCrudRepository<Coupon & { id: string }>(
  "twister:coupons",
  coupons.map((coupon) => ({ ...coupon, id: coupon.code })),
);
export const bannersRepository = createLocalCrudRepository<Banner>("twister:banners", banners);
export const announcementsRepository = createLocalCrudRepository<Announcement>("twister:announcements", announcements);

export const businessInfoRepository = createLocalSingletonRepository<BusinessInfo>("twister:business-info", businessInfo);

/** Orders "submitted from this admin browser only" — a demo log, not a real order backend. */
export const ordersRepository = createLocalLogRepository<Order>("twister:orders");
