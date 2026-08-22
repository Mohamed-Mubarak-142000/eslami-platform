# Mounir Stitch visual refresh

This iteration aligns the implementation with the approved Mounir digital-library direction while preserving every existing component API.

## Visual anchors

| Role | Light value | Purpose |
|---|---:|---|
| Deep emerald | `#002d29` | Brand, primary actions, headings |
| Emerald container | `#1a433f` | Hover and tonal emphasis |
| Aged gold | `#c5a059` / `#775a19` | Citation rails and restrained accents |
| Gold container | `#fed488` | Selected navigation and quiet emphasis |
| Parchment | `#f9f7f2` / `#fcf9f8` | Canvas and reading surfaces |
| Ink | `#1b1c1c` | Primary content |

Headings and long-form reading use an Arabic-first `Amiri` stack with `Source Serif 4` as the Latin companion. UI copy uses `IBM Plex Sans Arabic`. Font files remain a Foundation concern; the stacks degrade to locally available Arabic and system faces without blocking rendering.

## Composition rules

- RTL is the default; all structural CSS uses logical properties.
- The spacing system remains a 4px scale whose dominant layout rhythm is 8px.
- Controls use conservative 4px corners, with 6px for cards and pills only for metadata.
- Thin tonal borders establish hierarchy. Emerald-tinted shadows are reserved for raised state panels and overlays.
- Desktop keeps a quiet library rail and a reading measure of 720px inside a 1280px application measure.
- Mobile retains 44px targets, horizontal tab overflow, and table scrolling.

## Accessibility

- Primary emerald on white and parchment exceeds WCAG AA for normal text.
- Ink on parchment exceeds WCAG AAA; muted copy remains suitable for normal body text.
- Gold is never the sole state signal and is paired with text, border, or semantic markup.
- Focus uses a visible 2px aged-gold outline, with forced-colors fallback.
- Motion is limited to 120–220ms functional transitions and disabled under `prefers-reduced-motion`.

## Implementation map

- `src/styles/tokens.css`: Mounir color, type, radius, elevation, measure, dark-theme semantics.
- `src/styles/application.css`: shell, feed-like content surfaces, tabs, forms, lists, and responsive composition.
- `src/components/ui/primitives.css`: primary/secondary actions, fields, badges.
- `src/components/patterns/patterns.css`: scholars, trust, citations, opinions, timelines, and state panels.
