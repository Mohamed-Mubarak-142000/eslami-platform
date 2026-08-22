# Story matrix

Foundation wires `tokens.css`, `foundations.css`, and Storybook global direction/theme controls.
The story source intentionally has no Storybook package imports, so it can exist before scaffold.

| Contract | Required variants | Viewports | Accessibility assertion |
|---|---|---|---|
| Button/TextField | default, hover, focus, disabled, pending, error | 360, 768, 1280 | name, described-by, focus visible, 44px target |
| PAT-01/02 | approved, unverified, suspended, missing image, long Arabic | 360, 1280 | status is text; disclosure keyboard-operable |
| PAT-03 | link, no link, long/mixed content | 360, 768 | landmark has numbered accessible name |
| PAT-04 | two and three equal groups | 360, 1280 | no winner/count styling; headings preserve outline |
| PAT-05 | idle, pending, success, rollback error, uncertain | 360, 768 | pending announced; one submit; persistent result |
| PAT-06 | short, long, actor omitted | 360, 1280 | ordered semantic list; status not color-only |
| STA panel | loading, empty, error, offline, permission, privacy, conflict | 360, 768 | alert only when urgent; privacy wording does not disclose existence |

Run every story in light/dark, RTL/LTR, `prefers-reduced-motion`, forced colors, 200% zoom,
keyboard-only, and an automated WCAG scan. Baseline names are
`<contract>--<state>--<theme>--<direction>--<viewport>`; freeze screenshots only after font
loading is deterministic.
