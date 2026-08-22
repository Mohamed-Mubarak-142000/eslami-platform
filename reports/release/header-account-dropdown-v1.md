# Header account dropdown release review

## Recommendation

`GO`

Language, settings, and account are grouped in one keyboard-operable native disclosure while
notification and theme remain independent. Typecheck, 32 unit tests, ownership guards, and
desktop/mobile testing across three browsers pass.

## Risk and rollback

- No authentication, privacy, or service behavior changed.
- Roll back `3a3307a` if header navigation or language switching regresses.

## Blockers

- none
