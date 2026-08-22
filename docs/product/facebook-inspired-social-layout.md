# Facebook-inspired social home

## Outcome

Create an Arabic-first social home that feels immediately familiar without copying Facebook branding, proprietary assets, or exact content. The platform remains a trusted knowledge network.

## P0 scope

- Sticky global header with brand, search, primary destinations, notifications, profile, language, and theme controls.
- Desktop three-column home: shortcuts/navigation on the right, centered feed, contacts and discovery on the left.
- Stories row with a create-story card and at least five content-led story cards.
- Post composer with text, image, video, and feeling/activity affordances.
- Feed cards with identity, timestamp, audience, text, optional media, sources, reactions, comments, save, and share.
- Responsive behavior: two columns on tablet, one feed column plus bottom navigation on mobile.
- Arabic RTL and English LTR, keyboard access, visible focus, reduced motion, and no horizontal page overflow.

## Exclusions

- Facebook name, logo, screenshots, proprietary icons, private content, or pixel-for-pixel duplication.
- Real chat, uploads, notifications, authentication, or persistence.
- Algorithmic ranking claims and production privacy/security claims.

## Acceptance criteria

1. At 1280px and above, the home exposes two complementary side regions around a feed no wider than 680px.
2. Stories are horizontally scrollable, have accessible names, and retain readable overlays in light and dark themes.
3. The composer and every feed action are keyboard reachable and provide pressed/expanded state where applicable.
4. At 768–1279px, secondary contacts collapse while the feed remains centered and unobscured.
5. Below 768px, sidebars disappear, cards use the available width, and the bottom navigation does not cover content.
6. Seed content uses public mock data and locally generated decorative surfaces only.

## Edge cases

- Empty contacts or stories leave a labelled empty state rather than collapsing the page structure.
- Long Arabic titles wrap without pushing actions outside cards.
- Missing media renders the text/source card without a broken placeholder.
- Reduced-motion users receive no staggered entrance movement.

## Success signals

- Users can recognize stories, composer, feed, navigation, and contacts without instruction.
- No critical accessibility, RTL, responsive-overflow, or privacy defect in QA.
