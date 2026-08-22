# UX specification — landing, community, and Quran radio

## Information architecture

- `/`: public marketing landing, rendered without the authenticated application rails.
- `/community`: member feed inside the existing application shell.
- `/login?next=/community`: safe recovery path for guests requesting community access.
- `/register`: account creation from the landing primary CTA.

## Landing sequence

1. Compact header: Basira brand, section anchors, login, and prominent registration CTA.
2. Hero: one H1, short trust-oriented explanation, registration and login/community actions,
   plus a product preview that conveys sources and verified identities.
3. Trust strip: documented sources, clear identities, constructive dialogue.
4. Category cards: Quran studies, Hadith, jurisprudence, family and contemporary questions.
5. Community preview: explains saved knowledge, following specialists, and sourced discussion
   without exposing member-only feed records.
6. Quran radio: station identity, now-playing state, play/pause, volume, provider attribution,
   and inline unavailable status.
7. Final CTA and footer links to about, contact, categories, login, and registration.

## Interaction states

### Community authorization

- Valid active member: render feed.
- Missing/expired/non-active account: server redirect before feed markup is returned.
- `next` is a fixed internal path, never copied from arbitrary external input.

### Radio

- Initial: paused, duration unknown, controls available.
- Loading: control announces connection attempt and remains keyboard operable.
- Playing: play button becomes pause; live status text updates.
- Failure: pause audio, show polite Arabic status, retain a retry action.
- Unmount/navigation: audio is paused and released.

## Responsive behavior

- 320–767px: single-column content, compact header, full-width CTAs, no decorative overflow.
- 768–1099px: two-column hero and balanced cards.
- 1100px+: constrained 1200px canvas; hero and radio use asymmetric editorial grids.
- Motion is limited to opacity/transform and disabled under `prefers-reduced-motion`.

## Accessibility and content

- Skip link targets landing main content.
- Radio control has a stateful accessible label; volume has a visible label and value.
- Decorative artwork is hidden from assistive tech; informative images have Arabic alt text.
- Focus order follows DOM order in RTL; no positive tabindex.
- Use “انضم إلى مجتمع بصيرة” for primary CTA and “تسجيل الدخول” for secondary CTA.
