# Frontend MVP QA evidence

- Date: 2026-08-22
- Activation base: `f2fb1aa20185cc8cf3c0d7bb8f852cd29d5e2e5b`
- Scope: `QA-001..QA-005`
- Overall result: `FAIL — 2 unresolved severity-2 defects`

## Automated gates

| Gate | Command | Result |
|---|---|---|
| TypeScript | `npm run typecheck` | Pass |
| ESLint | `npm run lint` | Pass |
| Unit/integration | `npm test` | Pass: 5 files, 28 tests |
| Production build | `npm run build` | Pass: 29 application routes built |
| Cross-browser E2E | `npx playwright test --config=e2e/playwright.cross-browser.config.ts` | Fail: 45 passed, 9 failed |

The nine E2E failures are three repetitions per browser of two unique blocking defects. No
flaky retry was used to turn a failure green.

## Coverage evidence

| Area | Evidence | Result |
|---|---|---|
| Public/member | Search URL state, private-question selection, metadata privacy, discovery non-leakage | Pass across 3 engines |
| Scholar | Member denial at integrated route; verified in-specialty answer action in integration test | Pass |
| Moderator | Permission contract and queue integration test | Pass at component/domain level |
| Admin | Permission contract and reason/version decision integration test | Pass at component/domain level |
| Integrated admin boundary | Direct member access to moderation and verification decisions | Fail: `QA-DEF-001` |
| Accessibility | Arabic `lang`, RTL `dir`, skip-link activation, one primary heading/main on public routes | Pass across 3 engines |
| Admin semantics | Single-main landmark | Fail: `QA-DEF-002` |
| Responsive | 360×800, 768×1024, 1280×800 without horizontal overflow | Pass across 3 engines |
| Encoding | No repeated Arabic mojibake pattern on representative routes | Pass across 3 engines |
| Privacy | Private fixture absent from public DOM; private metadata is noindex and redacted | Pass across 3 engines |

## Browser matrix

| Browser | Passing checks | Blocking failures |
|---|---:|---:|
| Chromium | 15 | 3 |
| Firefox | 15 | 3 |
| WebKit | 15 | 3 |

## Notes

- Playwright browser binaries for Chromium, Firefox, and WebKit installed successfully.
- Tests use the existing development server contract because production configuration is owned
  by another agent; the production compilation itself passed independently.
- Next.js emitted development-only cross-origin warnings for `127.0.0.1`; tested pages and
  assertions still executed. No config change was made by QA.
