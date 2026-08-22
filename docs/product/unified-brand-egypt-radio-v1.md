# Unified brand and Egyptian Quran Radio v1

## Scope

- Use the user-supplied Basira logo on the landing header/footer and authenticated shell.
- Promote the landing palette—deep green, gold, warm canvas, mint accents—into shared semantic
  tokens so all routes retain one brand identity in light and dark modes.
- Replace the general recitation stream with the official Egyptian Quran Radio from Cairo.
- After explicit playback begins, show a full-viewport-width fixed bottom player only when the
  original radio section is no longer visible. It provides pause/resume, volume, station name,
  live status, and dismiss/stop without restarting playback during the transition.

## Acceptance criteria

1. The supplied logo is crisp, proportionate, has useful alternative text, and never causes
   layout shift or overflow.
2. Shared surfaces, navigation, focus, buttons, borders, and accents use the landing identity
   without reducing WCAG AA contrast in either theme.
3. Radio identifies “إذاعة القرآن الكريم من القاهرة — مصر” and links to the official station.
4. Playback remains continuous when the dock appears; no second audio element is created.
5. The dock is fixed above mobile safe areas, spans the viewport, is keyboard accessible, and
   does not obscure the final page content.

## Exclusions

- No autoplay, recording, rebroadcast caching, background service worker, or station selector.
- No modification of the supplied raster artwork beyond responsive display optimization.
