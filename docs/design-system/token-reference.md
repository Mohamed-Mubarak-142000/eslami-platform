# مرجع الـtokens

الأسماء دلالية حتى يمكن تبديل الثيم دون تغيير features. يمنع استعمال hex خارج
`tokens.css` في كود المنتج.

| المجموعة | tokens |
|---|---|
| surfaces | `canvas`, `surface`, `surface-subtle`, `overlay` |
| content | `text`, `text-muted`, `on-primary` |
| actions | `primary`, `primary-hover`, `focus` |
| feedback | `success`, `warning`, `danger`, `info` |
| structure | `border`, spacing 1–16، radii sm–pill، raised/overlay shadows |
| type | UI/reading families، xs–4xl، UI/reading leading |
| motion | fast 120، normal 180، slow 220، standard easing |
| measure | reading 720px، app 1440px، touch target 44px |

الثيم الداكن يعيد تعريف المعنى نفسه فقط. `tokens.ts` يصدر أسماء CSS variables بطريقة
typed كي يستخدمها code-generated styles أو inline styles دون تكرار القيم.
