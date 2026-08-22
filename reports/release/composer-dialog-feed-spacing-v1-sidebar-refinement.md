# Release review — sidebar refinement

## Recommendation

`GO`

The right shortcut rail now uses semantic Lucide icons instead of letter placeholders. The
discovery rail presents three notable-profile follow suggestions before scholars and
researchers. The existing dark RTL shell, responsive visibility, composer dialog, story
scrolling, and feed spacing remain intact.

## Evidence

- TypeScript completed without errors.
- Unit/integration suite passed: 32/32.
- Focused desktop RTL browser QA passed: 3/3 across Chromium, Firefox, and WebKit.
- Integration and QA ownership boundary guards passed.
- Decorative icons are hidden from assistive technology; each follow button has a
  profile-specific accessible name.

## Security and privacy

- No credentials, private fixtures, network writes, or new external dependencies were added.
- Follow actions are presentation-only pending an approved service contract.

## Residual risk and rollback

- The suggested people are static mock content. Replace them through an approved data adapter
  when the follow API is introduced.
- Roll back commit `fc9c5e5` if the sidebar order, icons, or desktop layout regress.

## Blockers

- none
