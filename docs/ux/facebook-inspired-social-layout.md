# Social home UX specification

## Landmark order

1. Skip link.
2. Sticky banner/header.
3. Primary navigation.
4. Main feed.
5. Shortcuts complementary region.
6. Contacts complementary region.

DOM order keeps `main` before optional asides; CSS performs desktop placement. Each complementary region has a unique accessible label.

## Desktop wireframe (≥1280px)

```text
┌──────────────── sticky header: brand/search | destinations | account controls ────────────────┐
│ shortcuts (280) │            main feed (min 0, max 680)             │ contacts (280)          │
│ profile         │ stories: create + horizontal cards                │ sponsored/announcement  │
│ home/saved/...  │ composer                                           │ birthdays               │
│ recent topics   │ tabs                                               │ contacts + online state  │
│                 │ post cards                                         │                         │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

Side regions remain sticky below the header and scroll internally when necessary. The document itself owns the primary scroll.

## Tablet (768–1279px)

- Hide contacts first.
- Keep shortcuts at 240px when at least 1024px is available; hide below that.
- Center the feed and keep story overflow horizontal.
- Header search may collapse to an icon/short field; destinations remain available.

## Mobile (<768px)

- One-column main feed, edge padding 8–12px.
- Hide both side regions and desktop primary destination strip.
- Provide fixed bottom navigation; add safe-area and bottom content padding.
- Stories scroll inline with 112–128px cards and scroll snapping.
- Composer action labels may shorten, but every icon retains an accessible name.

## Story behavior

- First card is “create story”; activating it announces a demo-only status.
- Story cards are links/buttons with name, creator, and unread state conveyed without color alone.
- Gradient overlays protect text contrast; images are decorative unless their content is essential.

## Composer behavior

- The prompt opens an inline mock editor; image/video/activity buttons select a mock attachment type.
- Submit is disabled for empty text and returns a polite live-region confirmation in the demo.
- No selected local file is read or uploaded.

## Feed behavior

- Header menu has an accessible label.
- Helpful/save are toggle buttons (`aria-pressed`); comment controls expand a labelled region.
- Media uses a stable aspect ratio, `object-fit: cover`, and an informative alt when present.
- Long text wraps; source card and actions remain inside the post width.

## Focus and motion

- Logical keyboard order follows the DOM and never enters hidden sidebars.
- Every interactive element shows a 2px focus ring with offset.
- Horizontal story containers remain reachable without trapping focus.
- `prefers-reduced-motion` removes entrance translation/stagger and uses instant state changes.

## States

- Loading: fixed-height skeletons for stories and posts.
- Empty: retain composer and show a single explanatory feed card.
- Error: preserve navigation/composer and show retry in main.
- Missing media: omit the media container.
- No contacts: labelled “لا توجد جهات اتصال متاحة الآن”.
