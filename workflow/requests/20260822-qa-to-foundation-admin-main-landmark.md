# QA defect request: remove nested admin main landmark

- Defect: `QA-DEF-002`
- Severity: 2 — release blocking
- Owner: `foundation-agent`
- Surface: `AdminShell` composed inside `AppShell`

Admin routes render two nested `<main>` landmarks. Adjust the owned layout contract so a composed
admin page exposes exactly one primary main landmark without changing route or feature files.

Acceptance: affected three-browser landmark test passes; typecheck, lint, tests, Storybook/build,
and foundation boundary pass.
