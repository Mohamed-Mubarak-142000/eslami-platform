# Discovery topics removal release review

## Recommendation

`GO`

The suggested-topics block is removed from the left discovery rail without affecting the
library banner, follow suggestions, scholars, RTL layout, or mobile behavior. Typecheck,
32 unit tests, ownership guards, and focused three-browser QA pass.

## Risk and rollback

- No privacy, security, or API behavior changed.
- Roll back `68e2e50` if the discovery rail content order regresses.

## Blockers

- none
