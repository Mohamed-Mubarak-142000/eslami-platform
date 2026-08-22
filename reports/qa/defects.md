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

Unresolved. This is a release blocker because authorization is absent at the integrated route
boundary. QA did not modify production code.

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

Unresolved. The duplicate primary landmark can make document navigation ambiguous for assistive
technology. QA did not modify the shared layout.
