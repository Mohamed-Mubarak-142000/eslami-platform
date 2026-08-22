# Dark header and tabless feed QA

- Clean browser contexts start with `data-theme="dark"`.
- No `.feed-tabs` element remains.
- Composer, stories, and feed ordering is preserved.
- Header prompt and reel/photo/video action order match the supplied reference.
- Search remains keyboard operable.
- Mobile/tablet/desktop overflow gates pass in Chromium, Firefox, and WebKit.
- Focused run: 18/18 passed.
