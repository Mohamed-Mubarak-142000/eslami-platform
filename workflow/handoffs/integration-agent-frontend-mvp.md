# Handoff: integration-agent / frontend-mvp

- Status: `review`
- Base ref: `92046361b81c60849e7d5d7e17d57b216fd2f972`
- Result ref: `working-tree marker`
- Tasks completed: `INT-001, INT-002, INT-003, INT-004, INT-005, FIX-QA-DEF-001`

## Delivered outputs

| Path | Purpose |
|---|---|
| `src/app/**` | Arabic-first public, member, scholar, and admin App Router composition for all accepted P0 surfaces |
| `src/app/(private)/layout.tsx` | Shared noindex, noarchive, dynamic, zero-revalidation privacy boundary |
| `src/app/(private)/me/questions/[id]/page.tsx` | Generic private-question metadata and no-store rendering without title/detail leakage |
| `src/app/routes.test.ts` | Route-presence and private-metadata smoke contracts |
| `src/integrations/adapters.ts` | Explicit DTO-to-domain transformations preserving exact optional contracts |
| `src/integrations/IntegrationProvider.tsx` | Session presentation context at the application boundary |
| `src/integrations/services.ts` | Mock-backed data, safe analytics, and error-monitoring interfaces |
| `src/integrations/SearchController.tsx` | URL-synchronized, shareable search query integration |
| `src/integrations/integrations.test.ts` | Adapter and sensitive-telemetry contract checks |
| `src/integrations/route-authorization.ts` | Deny-by-default mapping from admin routes to accepted permission actions |
| `src/app/(private)/admin/{moderation,verification}/[id]/page.tsx` | Route-boundary authorization before privileged case data or decision controls render |

## Acceptance evidence

| Criterion | Evidence/command | Result |
|---|---|---|
| Accepted P0 surfaces are reachable through Arabic routes/layouts | `npm run build` route manifest: 28 routes across public/member/scholar/admin | pass |
| Frozen features and shared contracts are composed unchanged | Git changed-path inspection from activation ref | pass |
| Session, adapters, analytics, monitoring, and mocks are wired | `src/integrations/**`; integration tests | pass |
| Search state is URL-shareable | `SearchController` canonical `q` serialization; typed route build | pass |
| Private content is excluded from metadata and public caches | private layout/page constants plus route privacy smoke test | pass |
| Strict compilation, lint, unit/smoke tests | `npm run typecheck`; `npm run lint`; `npm test` — 4 files, 24 tests | pass |
| Optimized production application compiles | `npm run build` | pass |
| Patch whitespace | `git diff --check` | pass |
| Member sessions cannot render moderation or verification decision controls | Targeted Chromium permission-boundary tests in `e2e/p0-journeys.e2e.ts` | pass — 2 tests |
| Unauthorized admin detail routes are non-disclosing | Both routes return the shared neutral `privacy` state before constructing `ReviewDecision` | pass |
| QA maintenance compilation and regression gates | `npm run typecheck`; `npm run lint`; `npm test`; `npm run build` | pass — 5 files / 28 tests; 29 routes built |

## Decisions and assumptions

- Public knowledge pages expose descriptive metadata; account and role surfaces inherit a noindex/noarchive boundary.
- Private-question metadata is deliberately generic and static. Question title/details are used only in the protected render body and never in URL, metadata, analytics, or public query keys.
- The accepted deterministic mock session represents a signed-in member for presentation. Real authentication and server authorization remain backend responsibilities; UI permission checks are not treated as security enforcement.
- Search serializes only the trimmed `q` parameter. Empty searches return the canonical `/search` URL, and telemetry records the action without the query text.
- Expected integration failures use the monitoring interface without sending request content; development logging is limited to error/context objects.
- Admin detail authorization is centralized in a closed route-to-action map. Unknown route keys and missing, inactive, or unauthorized sessions deny access; denial uses the neutral privacy state and does not construct case data or privileged controls.

## Open risks and deferred work

- A real API/auth transport, server-enforced authorization, durable mutations, signed evidence viewer, and backend cache tags are unavailable in the accepted contracts; current composition is deterministic and mock-backed.
- `next build` reports that `experimental.typedRoutes` moved to `typedRoutes`. `next.config.ts` belongs to Foundation and was not changed.
- Next 16 generates `next-env.d.ts` and reformats/adds an include to `tsconfig.json` during build because the generated declaration is not tracked. Both generated out-of-owner changes were removed/restored after successful build so this handoff remains boundary-clean.
- Full browser navigation, responsive visual, accessibility, and authorization matrix verification remain QA work.
- `QA-DEF-001` is fixed at the integration route boundary and its targeted Chromium regression now passes. QA still owns independent cross-browser rerun and defect closure.

## Cross-owner requests

- Foundation should migrate `experimental.typedRoutes` to `typedRoutes` and decide whether `next-env.d.ts` should be owned/tracked so production builds do not touch shared configuration.

## Boundary check

- Command: `./.github/scripts/Invoke-AgentBoundaryPS51.ps1 -AgentId integration-agent -BaseRef 92046361b81c60849e7d5d7e17d57b216fd2f972`
- Result: `pass — 4 owned paths checked`

The agent stops after creating this handoff. Only the orchestrator may accept it and activate
the successor.
