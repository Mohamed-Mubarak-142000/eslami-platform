# Frontend MVP QA defects

## QA-DEF-001 — Member can access privileged admin decision surfaces

- Severity: `2 — release blocking`
- Owner: `integration-agent`
- Affected routes: `/admin/verification/verification-1`, `/admin/moderation/case-1`
- Browsers: Chromium, Firefox, WebKit
- Requirement: `US-VER-02`, `US-MOD-02`, permission matrix (`manage_verification`, `moderate`)

### Reproduction

1. Start the application with its default fixture session (`member`).
2. Open either affected route directly.
3. Inspect the decision surface.

### Expected

The member receives a non-disclosing permission state and no decision form or privileged
controls are rendered.

### Actual

Both routes render the privileged decision-reason textarea and decision button. The route
pages instantiate `ReviewDecision` without evaluating the current session permission.

### Evidence

- `e2e/p0-journeys.e2e.ts`, permission boundary tests.
- Cross-browser run: the same two assertions fail in all three browser engines.
- Playwright observed one `textarea` where the expected count is zero.

### Release impact

Resolved by `c93b623`. Retested from activation base
`4e68e2e21566a6a4c494fe00299636b65d90256c` on 2026-08-22. Both permission-boundary tests pass
in Chromium, Firefox, and WebKit: member sessions receive a neutral permission state with zero
decision textareas. The full 54-test E2E suite showed no regression.

## QA-DEF-002 — Admin pages expose nested main landmarks

- Severity: `2 — release blocking`
- Owner: `foundation-agent`
- Affected routes: all routes wrapped by the admin shell
- Browsers: Chromium, Firefox, WebKit
- Requirement: `GEN-01`, accessible landmark semantics

### Reproduction

1. Open `/admin/moderation`.
2. Count `main` landmarks using browser accessibility semantics or `document.querySelectorAll`.

### Expected

Exactly one `main` landmark exists for the document.

### Actual

Two nested `main` elements are rendered: the root `AppShell` main and the `AdminShell` main.

### Evidence

- `e2e/quality-gates.e2e.ts`, `admin route exposes exactly one main landmark`.
- Cross-browser run: expected `1`, received `2` in Chromium, Firefox, and WebKit.

### Release impact

Resolved by `5fd4304`. Retested from activation base
`4e68e2e21566a6a4c494fe00299636b65d90256c` on 2026-08-22. The admin landmark assertion receives
exactly one `main` in Chromium, Firefox, and WebKit. The full 54-test E2E suite showed no regression.
