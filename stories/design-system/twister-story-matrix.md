# Twister story matrix

Companion to the legacy `story-matrix.md` (Al-Manara contracts, kept until the
reverse sweep). This matrix covers every component added in
`twister.stories.tsx`. Single dark theme — no light/dark toggle to test.

| Contract | Required variants | Viewports | Accessibility assertion |
|---|---|---|---|
| Button (all variants) | primary, secondary, ghost, danger, accent, whatsapp, disabled, loading | 360, 768, 1280 | accent/whatsapp text passes contrast (dark-on-gold/dark-on-green); 44px target |
| Tabs | selected, unselected, sticky, scrollable overflow | 360, 1280 | roving tabindex, arrow-key navigation, `aria-selected` |
| Accordion / FaqList | closed, open, long Arabic content | 360, 768 | `aria-expanded`, panel `role="region"` |
| Dialog | open, with footer, long content scroll | 360, 1280 | focus trap, Escape closes, focus returns to trigger |
| Sheet | open (mobile full-height), open (desktop fixed width) | 360, 1280 | same focus-trap guarantees as Dialog; opens from RTL end |
| QuantityStepper | min boundary, max boundary, mid-range | 360 | `aria-live` value, labelled +/- buttons |
| RatingStars | display-only, interactive | 360 | `role="img"` vs `role="radiogroup"`, per-star `aria-label` |
| CountdownDisplay | multi-day, under 1 hour | 360, 768 | `role="timer"`, `aria-live="polite"` (not per-second flooding) |
| Carousel | few items (no scroll), many items (scrollable) | 360, 1280 | region landmark, prev/next buttons keyboard-operable |
| ToastRegion | success, error, stacked | 360 | `aria-live="polite"`, `aria-atomic` |
| ProductCard | available, unavailable, bestseller, no image | 360, 768 | availability conveyed by text/badge, not color alone |
| CategoryChip | active, inactive, with/without image | 360 | `aria-current` |
| OfferBanner | with countdown, without | 360, 1280 | sparkle decoration disabled under reduced-motion (inherits `.ds-sparkle`) |
| TestimonialCard | real, placeholder-badged | 360, 768 | placeholder badge is text, not color-only |
| ZoneCard | served, not served | 360 | not-served conveyed by text + badge |
| SectionHeading / CtaSection | with/without subtitle | 360, 1280 | heading level correctness (h2) |
| StatCounter | short label, long Arabic label | 360 | value/label both readable by screen reader (no icon-only) |
| Admin DataTable | empty, populated, long cell content | 360 (as cards, per UX spec — story documents desktop table only), 1280 | header cells associated via `<th>` |
| Admin FormLayout | empty, with field error | 768 | submit button inside form, native validation preserved |
| Admin StatTile / LocalDataNotice | — | 360, 1280 | notice `role="status"`, never dismissible |

Run every story RTL-only (this milestone ships Arabic-only), `prefers-reduced-motion`,
forced-colors, and an automated WCAG scan (Storybook a11y addon). Baseline names:
`twister--<component>--<state>--<viewport>`.
