# QA defect request: enforce admin route authorization

- Defect: `QA-DEF-001`
- Severity: 2 — release blocking
- Owner: `integration-agent`
- Routes: `/admin/verification/[id]`, `/admin/moderation/[id]`

Member sessions currently receive privileged decision controls. Add deny-by-default route-boundary
permission handling using the accepted session and permission contracts. Unauthorized responses
must use neutral, non-disclosing copy and render no privileged controls.

Acceptance: affected Chromium test passes; typecheck, lint, unit/integration, build, and integration
boundary pass. Do not change QA tests or feature/shared contracts.
