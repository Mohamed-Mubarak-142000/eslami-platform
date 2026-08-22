# Public navigation and dropdown theme release review

## Recommendation

`GO`

Explore, search, and ask routes are removed and replaced by home, about, contact, and all
categories. The sitemap and shell match the new information architecture. Theme mode now
lives inside the account dropdown. Production build, 32 unit tests, ownership guards, route
404 checks, and cross-browser responsive QA pass.

## Risk and rollback

- Old bookmarked URLs return 404 by explicit product request.
- Contact addresses use the placeholder domain and must be replaced before production support.
- Roll back `b5c0777` for route/navigation regressions and `de1df30` for theme-menu regressions.

## Blockers

- none
