# Frontend MVP QA evidence

- Date: 2026-08-22
- Activation base: `4e68e2e21566a6a4c494fe00299636b65d90256c`
- Scope: `QA-001..QA-005`, `QA-RETEST-001`, `QA-RETEST-002`
- Overall result: `PASS — zero unresolved severity-1/2 defects`

## Automated gates

| Gate | Command | Result |
|---|---|---|
| TypeScript | `npm run typecheck` | Pass |
| ESLint | `npm run lint` | Pass |
| Unit/integration | `npm test` | Pass: 5 files, 28 tests |
| Production build | `npm run build` | Pass: 29 application routes built |
| Cross-browser E2E | `npx playwright test --config=e2e/playwright.cross-browser.config.ts` | Pass: 54 tests |

The complete suite passed without retrying failures into green. Both former blocking defects were
explicitly exercised on all three browser engines.

## Coverage evidence

| Area | Evidence | Result |
|---|---|---|
| Public/member | Search URL state, private-question selection, metadata privacy, discovery non-leakage | Pass across 3 engines |
| Scholar | Member denial at integrated route; verified in-specialty answer action in integration test | Pass |
| Moderator | Permission contract and queue integration test | Pass at component/domain level |
| Admin | Permission contract and reason/version decision integration test | Pass at component/domain level |
| Integrated admin boundary | Direct member access to moderation and verification decisions | Pass; `QA-DEF-001` resolved |
| Accessibility | Arabic `lang`, RTL `dir`, skip-link activation, one primary heading/main on public routes | Pass across 3 engines |
| Admin semantics | Single-main landmark | Pass; `QA-DEF-002` resolved |
| Responsive | 360×800, 768×1024, 1280×800 without horizontal overflow | Pass across 3 engines |
| Encoding | No repeated Arabic mojibake pattern on representative routes | Pass across 3 engines |
| Privacy | Private fixture absent from public DOM; private metadata is noindex and redacted | Pass across 3 engines |

## Browser matrix

| Browser | Passing checks | Blocking failures |
|---|---:|---:|
| Chromium | 18 | 0 |
| Firefox | 18 | 0 |
| WebKit | 18 | 0 |

## Defect dispositions

- `QA-DEF-001`: resolved by `c93b623`; direct member access is denied in all three engines.
- `QA-DEF-002`: resolved by `5fd4304`; one primary `main` remains in all three engines.

## Notes

- Playwright browser binaries for Chromium, Firefox, and WebKit were available.
- Tests use the existing development server contract; production compilation passed separately.
- The final retest found no release-blocking regression and is ready for independent release review.
