# Twister Crepes & Pizza storefront v1

## Scope

Pivot this repository from the retired "Al-Manara" Islamic content platform to
a premium dark-luxury Arabic (RTL) restaurant ordering site for "Twister
Crepes & Pizza": cinematic hero, homepage sections, full menu with product
customization, cart, guest checkout that generates a WhatsApp order message,
an offers page, a reviews page, a contact page, and a local-browser-only admin
sandbox (no real backend in this milestone). Full requirement detail lives in
the sibling docs indexed in [README.md](README.md).

## Acceptance criteria

1. Every P0 capability in [scope.md](scope.md) has a working screen/flow with
   the states specified in [p0-requirements.md](p0-requirements.md).
2. Cart pricing (base price, size delta, extras, coupon, free-fries auto-gift,
   delivery fee, optional tax) matches [business-rules.md](business-rules.md)
   exactly, verified by unit tests.
3. The generated WhatsApp message and `wa.me` URL match
   [whatsapp-order-message.md](whatsapp-order-message.md) exactly, verified by
   a snapshot test.
4. The menu renders the full catalog from [menu-catalog.md](menu-catalog.md)
   with every placeholder price/asset visibly distinguishable from confirmed
   data (no placeholder presented as final).
5. The admin sandbox supports CRUD on all 6 resources in
   [admin-requirements.md](admin-requirements.md), persists to `localStorage`
   only, and offers a working "Export JSON" action.
6. No fabricated review, rating, or testimonial is presented as real, per
   [reviews-policy.md](reviews-policy.md); no `AggregateRating` schema ships
   while review data is placeholder.
7. No customer PII reaches analytics or any of our servers, per
   [analytics-privacy.md](analytics-privacy.md).
8. Old Al-Manara routes/features are fully retired from the shipped app (see
   the reverse-sweep plan) with `almanara-final` as the git rollback point.

## Exclusions (this milestone)

- Real web push notifications, a real multi-user backend/database for the
  admin panel, an English UI toggle, and real customer accounts are explicitly
  out of scope — see [scope.md](scope.md) P1/deferred list.
- Real menu prices, food photography, logo, address, delivery zones/fees,
  hours, and real reviews/videos are pending the business owner — see
  [business-facts.md](business-facts.md). The build proceeds with labelled
  placeholders; this milestone ships as a **conditional go** pending that
  input, not a final production launch.
