# QA defect round 1 — Facebook-inspired social layout

## Summary

Cross-browser suite: 57 passed, 9 failed. Three failures are one production defect repeated in Chromium, Firefox, and WebKit; six failures are two obsolete Stitch assertions repeated across browsers.

## FB-LAYOUT-001 — tablet horizontal overflow

- Severity: 2
- Owner: `foundation-agent`
- Viewport: 768×1024
- Actual: document overflow is 142px in all three engines.
- Expected: no more than 1px horizontal document overflow.
- Reproduction: `npx playwright test --config=e2e/playwright.cross-browser.config.ts -g "tablet layout"`
- Evidence: the 40rem breakpoint exposes five fixed-width top-navigation destinations while both header side groups remain present.
- Requested outcome: keep destinations available without exposing the desktop top strip until enough inline space exists.

## QA-CONTRACT-001 — obsolete RTL assertion

- Owner: `qa-agent`
- The test checks `dir=rtl` on `.app-shell`; the accepted application contract exposes `dir=rtl` on `html`, already covered by `quality-gates.e2e.ts`.
- Update the visual test to assert the page direction and the new leading/content/contextual rail ordering.

## QA-CONTRACT-002 — obsolete mobile-search assertion

- Owner: `qa-agent`
- The accepted UX explicitly allows the header search field to collapse on mobile; the visual test still requires it visible.
- Update the test to require hidden side rails, usable bottom navigation, and no overflow, without requiring the desktop search field.

## Unavailable evidence

- The in-app browser runtime had no connected browser, so no additional interactive screenshot session was available. The cross-browser suite still executed locally and produced traces/error contexts.
