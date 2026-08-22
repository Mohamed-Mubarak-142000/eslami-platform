# UX — unified identity and persistent Egyptian radio

## Logo placement

- Landing header: symbol at 44px with “بصيرة”; footer at 40px.
- Member shell: symbol replaces the text-only mark while retaining the accessible brand name.
- At narrow widths the symbol remains visible and the wordmark may compact before controls.

## Persistent radio flow

1. Radio section begins paused with the full player.
2. User presses play; the same audio instance starts.
3. While the radio section intersects the viewport, only the full player is shown.
4. Once it leaves the viewport, a fixed full-width dock slides in at the viewport bottom.
5. Dock controls the same audio instance: pause/resume, volume, and stop/close.
6. Scrolling back to the radio section hides the dock without interrupting playback.

The dock reserves safe-area padding, has a visible focus ring, reports errors, and leaves enough
page-end padding that footer content is not hidden while active.

## Visual consistency

- Shared canvas uses warm ivory rather than cold gray.
- Primary navigation/actions use deep green; selection/focus uses mint; premium/accent details
  use gold sparingly.
- Dark mode uses near-black green surfaces with warm off-white text and muted gold accents.
- Semantic status colors remain status colors and are not recolored as brand accents.
