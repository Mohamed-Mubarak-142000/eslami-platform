# Stitch visual baseline QA evidence

- Date: 2026-08-22
- Activation base: `5cd2cec`
- Task: `QA-STITCH-VISUAL-001`
- Disposition: `superseded baseline`

## Verified baseline

The accepted Mounir/Stitch shell was independently rendered at 1440×1000 and 390×844 before
the user replaced this iteration with a broader Facebook-inspired UI/auth redesign request.

| Check | Evidence | Result |
|---|---|---|
| Desktop RTL composition | Geometric browser assertions: right navigation, center content, left discovery rail | Pass across Chromium, Firefox, WebKit |
| Header composition | Search and account actions visible; search keyboard submission preserves `q` route state | Pass across 3 engines |
| Mobile composition | Discovery rail hidden, five-item sticky bottom navigation visible, no horizontal overflow | Pass across 3 engines |
| Landmarks and keyboard | Unique header/nav/main landmarks and keyboard-operable search | Pass across 3 engines |
| Privacy | Public discovery rail excludes private question ID and title | Pass across 3 engines |
| Targeted visual suite | `npx playwright test --config=e2e/playwright.cross-browser.config.ts e2e/stitch-visual.e2e.ts` | Pass: 12/12 |
| TypeScript | `npm run typecheck` | Pass |
| ESLint | `npm run lint` | Pass |
| Unit/integration | `npm test` | Pass: 28/28 |
| Production build | `npm run build` | Pass: 29 routes |

## Rendered evidence

- `reports/qa/screenshots/stitch-desktop-1440.png`
- `reports/qa/screenshots/stitch-mobile-390.png`

The screenshots were visually inspected. They show the expected parchment/emerald Mounir styling,
desktop three-column RTL shell, populated header, mobile single-column content, and bottom nav.

## Supersession note

The complete 66-test regression run was interrupted after the user superseded this visual target.
All 49 checks reported before interruption passed, but the incomplete run is not represented as a
full regression pass. The targeted 12-test visual suite completed independently and passed.

No defect was filed against this baseline. This evidence must not be treated as acceptance of the
new Facebook-inspired redesign; that redesign requires its own contracts and QA activation.
