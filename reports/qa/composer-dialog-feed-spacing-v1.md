# Composer dialog and feed spacing QA

- Prompt opens a labelled modal with initial textarea focus.
- Publish is disabled until content is present; Escape closes the modal.
- Stories remain horizontally scrollable and Firefox reports `scrollbar-width: none`.
- Social-feed main padding is at most 16px; document overflow passes at mobile/tablet/desktop.
- Localhost cross-browser run: 18/18 passed.
