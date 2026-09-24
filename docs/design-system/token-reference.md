# مرجع الـtokens — Twister Crepes & Pizza

الأسماء دلالية حتى يمكن تبديل القيم دون تغيير features. يُمنع استعمال hex خارج
`tokens.css` في كود المنتج. هذا معلم **dark-only** — لا `[data-theme="dark"]`
منفصل، القيم في `:root` هي القيم الوحيدة.

| المجموعة | tokens |
|---|---|
| surfaces | `canvas` (#0F0F0F), `surface`, `surface-subtle`, `surface-raised`, `overlay` |
| content | `text` (#FFFFFF), `text-muted`, `on-primary`, `on-accent-container` |
| العلامة | `primary` (#D62828)، `primary-hover`، `accent` (#F4B400)، `accent-hover`، **`on-accent-solid`** (نص غامق لأزرار/شارات الذهبي الصلب) |
| قنوات خاصة | `whatsapp` (#25D366)، `on-whatsapp` |
| زخرفة سينمائية | `glow-primary`، `glow-accent` (`box-shadow` جاهزة لـ`.ds-glow-primary`/`.ds-glow-accent`) |
| feedback | `success`, `warning`, `danger` (منفصل عن `primary` عمدًا لتمييز الإجراء التخريبي عن CTA العلامة), `info` |
| structure | `border`, spacing 1–16، radii sm–pill، raised/overlay shadows |
| type | `--ds-font-ui`/`--ds-font-reading` = Cairo، `--ds-font-heading` = Alexandria، xs–4xl |
| motion | fast 120، normal 180، slow 220، standard easing؛ تُصفَّر تلقائيًا عند `prefers-reduced-motion` |
| measure | reading 720px، app 1280px، touch target 44px |

## قيود تباين معروفة (Foundation/Feature يجب الالتزام بها)

- **نص أحمر (`--ds-color-primary`) على الخلفية الأساسية**: تباين ~3.8:1 —
  مقبول لعناصر UI كبيرة (عناوين/أزرار) وليس لنص فقرات طويل.
- **نص أبيض على خلفية ذهبية صلبة**: تباين فاشل (~1.9:1). أي سطح خلفيته
  `--ds-color-accent` الصلب **يجب** أن يستخدم `--ds-color-on-accent-solid`
  (غامق) للنص، لا `--ds-color-text`. `Button` variant `accent` يطبّق هذا
  تلقائيًا؛ لا تُنشئ سطحًا ذهبيًا جديدًا بنص أبيض يدويًا.
- `on-accent-container` (نص فاتح على حاوية ذهبية خافتة، لا سطح صلب) يبقى
  مقبولًا لأن الخلفية معتمة جدًا (`--ds-color-accent-container`).

`tokens.ts` يصدر أسماء CSS variables بطريقة typed كي يستخدمها كود منتج أو
inline styles دون تكرار القيم أو hex جديد.
