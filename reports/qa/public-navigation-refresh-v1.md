# Public navigation refresh QA

- `/explore`, `/search`, `/ask/1`, and `/ask/review` return 404.
- `/about`, `/contact`, and `/categories` render responsive dark RTL pages.
- Header search is absent and top/mobile navigation expose four destinations.
- Focused cross-browser shell and route suite passed 12/12; Chromium P0/quality passed 18/18 after a strict-locator correction.
- Theme is the fourth dropdown action, toggles in both directions, closes the menu, and no
  independent theme button remains; desktop/mobile coverage passed on all three engines.
