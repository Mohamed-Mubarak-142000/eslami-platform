# Frontend MVP release review

- Date: 2026-08-22
- Review base: `a62dae116718dd0515ffcc2bc3885721ecfb686f`
- Tasks: `REL-001`, `REL-002`, `REL-003`
- Decision: `CONDITIONAL_GO`
- Approved target: internal/stakeholder demonstration of the frontend mock MVP only
- Explicitly not approved: public production launch, real accounts, real private questions,
  verification documents, moderation actions, or religious-content publishing

## Executive decision

The frontend mock MVP is fit for a controlled demonstration. It compiles, passes its static and
unit/integration gates, and passes 54 Playwright checks across Chromium, Firefox, and WebKit. The
two former release-blocking defects are resolved. The implementation also has credible frontend
privacy defenses: private routes are dynamic and noindex, private metadata is generic, sensitive
fixtures are excluded from public discovery, and privileged member access is denied in the tested
mock session.

This is not production/backend ready. Authentication, authorization, persistence, uploads,
analytics, monitoring, server-side cache policy, audit logging, deployment, and rollback are
interfaces or mocks rather than operational systems. Product-defined expert, legal/privacy,
threat-model, usability, and assistive-technology gates have not been evidenced. Those are release
blockers for any public or real-data deployment, but do not block an explicitly labelled internal
mock demonstration.

## Independent evidence

| Lane | Evidence | Finding |
|---|---|---|
| Build quality | `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` | Pass; 28 tests and 29 routes |
| Browser journeys | `npx playwright test --config=e2e/playwright.cross-browser.config.ts` | Pass; 54/54 across three engines |
| Dependency audit | `npm audit --package-lock-only --omit=dev --audit-level=high` | Pass; 0 production vulnerabilities |
| Patch integrity | `git diff --check`; clean status at review start | Pass |
| QA defects | `reports/qa/defects.md` and original assertions | Both severity-2 defects resolved |
| Privacy | private layout/page metadata; discovery and permission E2E tests | Pass for mock frontend scope |
| RTL/accessibility | root `lang="ar" dir="rtl"`; skip link, landmark, heading and overflow E2E | Pass for automated scope |
| Scope | product scope, all accepted handoffs, route manifest | P0 surfaces represented; mock behavior is not full backend fulfillment |

## Review findings

### Acceptance traceability and scope

- Product, UX, design-system, feature, integration, and QA handoffs are accepted and traceable to
  P0 capabilities. The route manifest covers the declared public/member/scholar/admin surfaces.
- Automated coverage is selective, not one executable happy/error/offline/keyboard journey for
  every capability as requested in `docs/product/traceability.md`. Moderator/admin and scholar
  behavior is partly component/domain-level rather than authenticated end-to-end behavior.
- The UI is powered by deterministic fictional mocks. Forms and mutations demonstrate interaction
  contracts; they do not prove persistence, idempotency, conflict handling, email/reset, upload,
  notification delivery, or audit durability.
- Product Go/No-Go gates requiring religious/editorial expert approval, legal/privacy approval,
  usability sessions, and screen-reader testing have no recorded sign-off.

### Security and privacy

- Positive evidence: deny-by-default permission primitives; tested denial of scholar/admin controls
  for the member fixture; generic private-question metadata; private `noindex/noarchive`; telemetry
  shape guard; no production dependency vulnerabilities at high threshold.
- Production blocker: the session is a client-presented mock (`services.session`) and the repository
  explicitly states server authorization is still required. Client-side route denial is not a
  security boundary.
- Production blocker: no real upload service, signed evidence viewer, retention/deletion enforcement,
  threat model, secrets/session handling, CSRF strategy, rate limiting, CSP/security-header policy,
  or server cache verification exists in this frontend milestone.
- Production blocker: legal/privacy approval for private questions and verification evidence is not
  recorded. Real personal or religiously sensitive data must not be entered into this build.

### Accessibility, RTL, and content integrity

- Automated three-browser evidence confirms Arabic root semantics, RTL, skip-link focus, one primary
  landmark/heading, and no horizontal overflow at 360, 768, and 1280 widths.
- Semantic design contracts preserve source citations, trust-mark limitations, and equal-weight
  opinion groups. Mock content is fictional and avoids claiming real scholarly endorsement.
- Residual gap: no recorded manual screen-reader, 200%/400% zoom, forced-colors, full keyboard-flow,
  or rendered contrast audit. Storybook accessibility tooling is configured, but CI only builds
  Storybook and does not show an automated axe gate.
- Religious/editorial review of answer, disagreement, sourcing, and verification language remains a
  mandatory production gate.

### Performance, SEO, observability, and rollback

- The optimized build passes. Public metadata exists and private routes are noindex/dynamic.
- No Lighthouse/Core Web Vitals budgets, bundle budgets, load test, production telemetry, alerting,
  error ingestion, health checks, or SLOs are evidenced. The current analytics sink is a no-op and
  error reporting logs only during development.
- No production domain/configuration, sitemap/robots route, deployment manifest, environment matrix,
  release versioning, database compatibility plan, or tested rollback/runbook exists.
- CI runs lint, typecheck, unit tests, and Storybook build, but does not currently gate the application
  production build or Playwright suite.

## Conditions and residual risks

The following conditions apply to the approved internal demo:

1. Label the environment clearly as fictional mock data; do not collect or upload real user data.
2. Restrict access to stakeholders/testers; do not market it as an operational religious-answer or
   verification service.
3. Use the exact reviewed commit or a separately reviewed successor; rerun all gates after changes.
4. Do not interpret frontend permission states as server-side security.

Before public production, all of the following require evidence and approval:

1. Real backend authentication and server-side authorization, privacy-safe storage/cache/search,
   upload controls, signed evidence access, audit logs, retention/deletion, CSRF/rate limiting, and
   a documented threat model with security review.
2. Religious/editorial expert approval and legal/privacy approval of the policies and Arabic copy.
3. Usability testing required by product scope plus manual screen-reader, keyboard, zoom, contrast,
   and forced-colors verification.
4. Production analytics/error monitoring with sensitive-data filtering, alerts and ownership; Web
   Vitals and performance budgets; production SEO/canonical/robots/sitemap verification.
5. CI gates for application build and representative E2E; deployment environments, smoke checks,
   rollback procedure, and an exercised rollback rehearsal.
6. Close or explicitly supersede the partially resolved PowerShell boundary-guard request; the
   repository wrapper works, while the canonical documented command still needs a compatibility shim.

## Rollback and stop triggers

For the internal demo, stop distribution and return to the last reviewed commit if any of these occur:

- private content appears in a public DOM, URL, metadata, cache, search result, analytics event, or log;
- a member/guest can render scholar, moderator, verification, taxonomy, or admin decision controls;
- Arabic text corruption, loss of RTL, inaccessible primary navigation, or a severity-1/2 defect;
- any gate fails on the release commit, or the deployed artifact cannot be tied to that commit;
- real personal, verification, or private-question data is entered or retained.

No automated production rollback can be claimed because no deployment target/runbook exists. The safe
response for the mock is to remove access, preserve evidence, and redeploy the last reviewed artifact.

## Final recommendation

`CONDITIONAL_GO` for an internal, access-restricted, clearly labelled frontend mock MVP demonstration.

`NO_GO` for public production or any use involving real users/data until the production blockers and
product Go/No-Go approvals above are closed with evidence.
