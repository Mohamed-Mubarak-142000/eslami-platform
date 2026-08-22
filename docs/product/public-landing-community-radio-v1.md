# Public landing, protected community, and Quran radio v1

## Outcome

Give first-time visitors a public, credible introduction to Basira before asking them to
register, while keeping the social community available only to authenticated active members.

## P0 scope

- `/` is a public Arabic-first landing page explaining the product value, trust model,
  knowledge categories, and community experience.
- Primary calls to action lead to `/register` and `/login`; authenticated members can enter
  `/community` directly.
- The existing home feed becomes `/community` without changing its content model.
- An unauthenticated, expired, suspended, or closed session cannot render community content
  and is redirected to `/login?next=/community`.
- The landing page includes a Quran radio player with explicit user-initiated playback,
  play/pause state, volume, station/source attribution, and an unavailable state.
- The landing page works in Arabic RTL, English LTR, light/dark themes, keyboard navigation,
  reduced motion, and mobile/desktop viewports.

## Exclusions

- No reverse engineering of undocumented radio endpoints.
- No background autoplay, recording, downloads, playlists, or account persistence for radio.
- No change to religious content governance, ranking, moderation, or the feed data model.
- No production identity provider is introduced in this milestone; protection consumes the
  existing session integration contract.

## Users and permissions

| User state | Landing | Community | Primary action |
|---|---|---|---|
| Guest / expired | View | Redirect to login | Create account |
| Active member | View | View | Enter community |
| Suspended / closed | View | Redirect to login | Contact support / login |

## Acceptance criteria

1. A guest can understand Basira's purpose and reach registration or login without seeing
   private community content.
2. `/community` renders the existing feed only for an active account with a non-expired
   session and otherwise redirects with a safe relative `next` destination.
3. Radio never starts without a user gesture, exposes an accessible play/pause control and
   volume control, identifies the provider, and reports playback/network failure in Arabic.
4. The landing page has one H1, meaningful landmarks, visible focus, non-color-only states,
   responsive layout, and no horizontal page overflow at 320 CSS pixels.
5. Public metadata describes the landing page; community content is not included in public
   sitemap/SEO discovery.

## Analytics outcomes

- Landing CTA intent: register, login, enter community.
- Radio intent: play and pause only; never send stream URL, listening history, or account data.

## Decisions

- Radio uses a documented public provider or a locally configured stream; an unverified live
  endpoint is not a release dependency.
- Audio playback is always opt-in and pauses when the component is unmounted.
- The pasted restaurant brief is unrelated to Basira and is excluded from product scope.
