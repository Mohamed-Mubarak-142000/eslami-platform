# Social UI and auth v2 design contract

## Direction

The system is socially familiar through predictable structure—persistent header, central feed, navigation rail, contextual rail, composer, and action row—while remaining visually original. It does not reproduce Facebook assets, blue palette, iconography, proportions, copy, or trade dress.

The Mounir palette remains authoritative: emerald communicates trust and primary action, aged gold communicates selection and citation, parchment provides calm depth, and ink carries content. Feed surfaces are crisp paper sheets with thin borders and restrained emerald shadows. Auth screens use an asymmetric emerald promise panel and a focused parchment form card.

## Component contracts

### shadcn-compatible primitives

`Button`, `TextField`, `Card`, `Textarea`, `Checkbox`, `Alert`, `Skeleton`, and `IconButton` accept native element props and `className`. Relevant roots expose shadcn-style `data-slot` values. They require no Radix dependency, and Foundation may compose them with `cn()` without changing their APIs.

- `Button`: primary, secondary, danger, ghost; loading disables duplicate submission and sets `aria-busy`.
- `TextField` / `Textarea`: visible labels are the consumer's responsibility; errors use `aria-invalid` and described-by text.
- `Checkbox`: one large label target, optional description, native keyboard and forced-colors behavior.
- `Alert`: info/success/warning are polite status; error is an alert.
- `Skeleton`: decorative, fixed, no shimmer or animation.
- `IconButton`: requires a text `label`; icon content remains decorative.

### social/auth patterns

- `AuthShell`: responsive promise panel + one form card. It owns presentation and landmarks, never authentication or redirects.
- `ErrorSummary`: focusable summary with fragment links to invalid fields.
- `TopicHighlights`: permanent curated topics with scroll-snap; not stories and never ephemeral.
- `ComposerCard`: author, labelled textarea, privacy slot, inline error, and busy submit. Draft persistence remains feature-owned.
- `SocialContentCard`: author/trust before content, citation before actions, then helpful/comment/save. Async state arrives through props; rollback remains feature-owned.

## Tailwind mapping

`tokens.css` publishes standard shadcn aliases (`--background`, `--foreground`, `--card`, `--primary`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`). `tailwind-theme.css` maps these through Tailwind v4 `@theme inline`. Foundation must add/import Tailwind; feature code must use semantic utilities such as `bg-card` and `text-muted-foreground`, never raw palette values.

## Motion contract

CSS handles hover, focus, pressed, disabled, and loading. `motion.ts` provides dependency-neutral values for Motion:

| Surface | Allowed motion | Budget |
|---|---|---:|
| Sheet | 8% logical-axis translation + opacity | 180ms |
| Dialog | 8px block-axis translation + opacity | 180ms |
| Onboarding step | 4% logical-axis translation + opacity | 220ms |
| Helpful/save confirmation | opacity only | 120ms |

No card entrance cascade, parallax, autoplay, continuous shimmer, or focus delay is allowed. Under `prefers-reduced-motion`, use the exported `reduced` state: zero duration, no translation/scale/stagger, identical DOM and focus behavior.

GSAP is excluded from P0. A later exception requires a unique branded sequence that Motion/CSS cannot reasonably express, named ownership, cleanup on unmount, no ScrollTrigger pinning of reading content, a reduced-motion branch, and a main-thread budget under 50ms.

## Responsive and accessibility gates

- 360/390: single feed column, bottom navigation, no page-level horizontal overflow.
- 768: single feed plus sheets.
- 1024: start-side navigation + feed; context moves to a sheet.
- 1280/1440: three columns, feed remains visually dominant.
- 200% zoom: reflow to a smaller layout without hiding actions.
- Interactive targets are at least 44px; logical properties preserve RTL; focus remains visible in forced colors.
- Light-theme contrast evidence: emerald/parchment 13.94:1, ink/parchment 15.95:1, muted/parchment 5.33:1, ink/gold-container 11.28:1.
- Loading, error, disabled, pressed, empty, offline, permission, and success must have text or semantic state; color is supplementary.
