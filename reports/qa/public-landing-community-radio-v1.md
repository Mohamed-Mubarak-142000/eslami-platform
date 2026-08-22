# QA report — public landing, community, and Quran radio

## Scope

- Public landing composition and responsive overflow.
- Quran radio discoverability and opt-in playback contract.
- Community route composition and session predicate edge cases.
- Regression: typecheck, lint, unit suite, and production build.

## Notes

- The local integration fixture is intentionally an active member, so browser QA validates the
  allowed community branch. Unit coverage validates guest, expired, and suspended rejection.
- Live audio availability is provider/network dependent; automation validates that it never
  autoplays and exposes the accessible user-gesture control.

## Results

- Unit/integration: 34/34 passed across 7 files.
- Focused E2E: 6/6 passed across Chromium, Firefox, and WebKit.
- Production build, typecheck, and lint passed during integration handoff.
