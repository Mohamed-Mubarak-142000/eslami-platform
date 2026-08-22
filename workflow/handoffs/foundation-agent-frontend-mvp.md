# Handoff: foundation-agent / frontend-mvp

- Status: `review`
- Base ref: `778147728850ab6c75219963c04846f918742edc`
- Result ref: `working-tree marker`
- Tasks completed: `FOUND-001, FOUND-002, FOUND-003, FOUND-004, FOUND-005, FOUND-006`

## Delivered outputs

| Path | Purpose |
|---|---|
| `package.json`, `package-lock.json` | Reproducible Next.js 16 / React 19 / strict TypeScript toolchain and commands |
| `*.config.*`, `tsconfig.json` | Next, ESLint, PostCSS, Vitest, and Playwright configuration |
| `.storybook/**` | RTL design-system wiring, accessibility addon, mobile/desktop viewports |
| `.github/workflows/ci.yml` | Clean-install lint, typecheck, unit-test, and Storybook-build gate |
| `.github/scripts/Invoke-AgentBoundaryPS51.ps1` | Owned PS5.1-compatible entrypoint delegating to the canonical boundary guard |
| `.github/BOUNDARY_GUARD.md` | Reproducible compatibility invocation and ownership rationale |
| `src/domain/**` | Stable domain models and deny-by-default permission primitives |
| `src/lib/**` | API/result, auth, safe-return, error, query-key, analytics, and test contracts |
| `src/mocks/**` | Deterministic fictional Arabic fixtures and in-memory API gateway |
| `src/components/layout/**` | Responsive RTL AppShell/AdminShell importing the accepted design system |

## Acceptance evidence

| Criterion | Evidence/command | Result |
|---|---|---|
| Reproducible strict foundation | clean `npm ci`; `node_modules/.bin/tsc.cmd` exists (323 bytes); `npm run typecheck` | pass |
| Lint and unit contracts | `npm run lint`; `npm test` (4/4) | pass |
| Accepted design-system sources render | `npm run build-storybook` (10.5.10) | pass |
| CI commands and production dependency audit | CI workflow inspection; `npm audit --package-lock-only --omit=dev --audit-level=high` | pass — 0 production vulnerabilities |
| PS5.1 compatibility success/failure behavior | wrapper with active agent/base; separate-process unknown agent and invalid ref | pass — success 0, failures 1/1 |
| Foundation ownership | compatibility wrapper against exact activation ref after preserving installed dependencies | pass — 35 owned source files including handoff; generated artifacts excluded |

## Decisions and assumptions

- The package uses npm and pins exact versions; Node 22+ is the supported baseline.
- API adapters return discriminated results rather than throwing expected HTTP failures.
- Permission presentation is advisory only; server authorization remains mandatory.
- Private question text/details are excluded from analytics contracts and public query keys.
- Existing design-system files are imported unchanged by Storybook and AppShell.
- Application `next build` and Playwright smoke execution are deferred because route creation belongs exclusively to `integration-agent`; no placeholder `src/app` route was created.

## Open risks and deferred work

- Storybook's current Next/Vite adapter has three development-only high advisories through `image-size`, with no upstream fix available in the installed release; production dependency audit is clean. Recheck on the next Storybook release.
- `node_modules` now remains installed in the shared workspace after the clean-install verification. `.github/git-excludes` excludes only reproducible install/build/test artifacts for the compatibility guard because the repository has no owner-assigned root `.gitignore`.
- The requested canonical `workflow/scripts/Test-AgentBoundary.ps1` edit is outside Foundation ownership. The owned wrapper supplies PS5.1 compatibility without changing it.
- An out-of-owner failure fixture was not created in this working tree because doing so would itself violate the active agent contract; unknown-agent and invalid-ref failures were verified, and the canonical guard's current changed-file set validates the owned-path success case.
- Pre-commit hook files and root `.gitignore` are not assigned to Foundation ownership. CI is the committed quality gate; later orchestration should assign an owner before adding hooks or ignore rules.

## Cross-owner requests

- `workflow/requests/20260822-orchestrator-to-foundation-powershell-guard.md` remains only partially resolved: use `.github/scripts/Invoke-AgentBoundaryPS51.ps1`, or have the workflow owner port the canonical script.

## Boundary check

- Command: `./.github/scripts/Invoke-AgentBoundaryPS51.ps1 -AgentId foundation-agent -BaseRef 778147728850ab6c75219963c04846f918742edc`
- Result: `pass — 35 owned source files checked including this handoff; node_modules remains installed`

The agent stops after creating this handoff. Only the orchestrator may accept it and activate
the successor.

## Maintenance — FOUND-MAINT-001/002

- Reactivated base: `d953f666286cda52b3ab0c2ee245879753e0f084`
- Status: `review`
- `next.config.ts`: moved `typedRoutes` from the deprecated experimental namespace to the
  supported Next.js 16 root option.
- `tsconfig.json`: accepted both `.next/types/**/*.ts` and `.next/dev/types/**/*.ts`, so Next
  no longer rewrites the tracked configuration.
- `.github/git-excludes`: added generated root `next-env.d.ts`; the file exists locally for
  Next/TypeScript but is excluded from source status through the repository-configured owned
  exclusion file.

### Maintenance evidence

| Criterion | Evidence | Result |
|---|---|---|
| Static quality gates | `npm run typecheck`; `npm run lint`; `npm test` | pass — 24/24 tests |
| Production build | `npm run build` with Next.js 16.3.2 | pass — 8 static outputs and all dynamic routes compiled |
| Supported typed routes | captured build output checked for `experimental.typedRoutes` / moved-option warning | pass — warning absent |
| Build does not mutate tracked files | SHA-1 of `git diff --binary <base>` before and after build | pass — identical |
| Generated types stay local | `git status --short -- next-env.d.ts .next tsconfig.tsbuildinfo`; `git check-ignore -v next-env.d.ts` | pass — status empty; owned exclusion line 8 matched |
| Maintenance ownership | `./.github/scripts/Invoke-AgentBoundaryPS51.ps1 -AgentId foundation-agent -BaseRef d953f666286cda52b3ab0c2ee245879753e0f084` | pass — 4 owned files including this handoff |

No integration/app file or generated `next-env.d.ts` was edited. No commit, push, workflow
state change, or QA activation was performed.

## Maintenance — FIX-QA-DEF-002

- Reactivated base: `43e8dd142736e90319b52871e87a17a300bc2fa0`
- Status: `review`
- `AppShell` now exposes an optional `nested` composition mode. The document-level default
  retains the skip link, focus target, and single `<main>`; nested shells render their content
  container as a semantic-neutral `<div>` and do not duplicate the document skip link.
- `AdminShell` opts into nested composition because the root application `AppShell` already
  owns the document's primary landmark.
- Storybook includes a nested-shell scenario documenting the public composition contract.

### FIX-QA-DEF-002 evidence

| Criterion | Evidence | Result |
|---|---|---|
| Admin page has one primary landmark | `npx playwright test --config=e2e/playwright.cross-browser.config.ts --grep "admin route exposes exactly one main landmark"` | pass — Chromium, Firefox, WebKit (3/3) |
| Shared compilation and regression gates | `npm run typecheck`; `npm run lint`; `npm test` | pass — 28/28 tests |
| Integrated production composition | `npm run build` with Next.js 16.3.2 | pass — 29 routes built |
| Layout documentation render | `npm run build-storybook` | pass |
| Patch integrity | `git diff --check` | pass |
| Fix ownership | `./.github/scripts/Invoke-AgentBoundaryPS51.ps1 -AgentId foundation-agent -BaseRef 43e8dd142736e90319b52871e87a17a300bc2fa0` | pass — 4 owned files including this handoff |

The implementation follows the installed Next.js nested-layout guidance: nested layouts wrap
inside the root layout, so only the outer shell owns the document-level main landmark. No app
route, QA test/evidence, workflow state, or other owner's output was edited.
