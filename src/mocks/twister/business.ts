import type { BusinessInfo } from "@/domain/twister";

/** business-facts.md: every field below is a placeholder pending the restaurant owner. */
export const businessInfo: BusinessInfo = {
  address: "القاهرة، مصر — العنوان الكامل قريبًا",
  phone: "201233326848",
  whatsappNumber: "201233326848",
  socials: {},
  hours: [
    { weekday: 0, opensAt: "13:00", closesAt: "02:00" },
    { weekday: 1, opensAt: "13:00", closesAt: "02:00" },
    { weekday: 2, opensAt: "13:00", closesAt: "02:00" },
    { weekday: 3, opensAt: "13:00", closesAt: "02:00" },
    { weekday: 4, opensAt: "13:00", closesAt: "02:00" },
    { weekday: 5, opensAt: "13:00", closesAt: "02:00" },
    { weekday: 6, opensAt: "13:00", closesAt: "02:00" },
  ],
  verified: false,
};
