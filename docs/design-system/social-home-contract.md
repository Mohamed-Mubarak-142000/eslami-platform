# Social home visual contract

- Reuse semantic `background`, `card`, `border`, `foreground`, `muted`, `primary`, and status tokens; no Facebook brand token is introduced.
- Feed cards use the existing raised surface, 12–16px radius, 1px semantic border, and restrained shadow.
- Story cards use a 9:16 crop, 12px radius, a bottom scrim, a 3px primary unread ring, and high-contrast overlaid type.
- Side sections use transparent surfaces with row hover states; avoid stacking large card boxes in the rails.
- Avatar sizes: 40px rows, 44px composer, 48px story rings. Online state includes accessible text and is not color-only.
- Icon-only controls have a minimum 44px hit area, accessible names, and existing focus-visible ring treatment.
- Media reserves space with `aspect-ratio`; use gradients and existing public mock media, never copied Facebook imagery.
- Motion uses existing motion presets and is removed under `prefers-reduced-motion`.
- Desktop feed max width is 680px. Rail widths are 240–280px. Gaps scale from 16px to 32px.
