import { expect, test } from "@playwright/test";

test.describe("Mounir Stitch shell visual contract", () => {
  test("desktop RTL shell places navigation right, content center, and discovery rail left", async ({ page, browserName }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");

    const shell = page.locator(".app-shell");
    const navigation = page.locator(".app-shell__leading-rail");
    const content = page.locator(".app-shell__main");
    const rail = page.locator(".app-shell__rail");
    const search = page.locator(".app-shell__search");
    const actions = page.locator(".app-shell__actions");

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(search).toBeVisible();
    await expect(actions).toBeVisible();
    await expect(page.locator(".app-shell__topnav")).toBeHidden();
    await expect(actions.locator(".social-media-actions a")).toHaveCount(3);
    await expect(actions.locator("a[aria-label='فيديو مباشر']")).toBeVisible();
    await expect(actions.locator("a[aria-label='إضافة صورة']")).toBeVisible();
    await expect(actions.locator("a[aria-label='إنشاء مقطع']")).toBeVisible();
    await expect(actions.locator(".shell-actions, .shell-control, .app-shell__notifications")).toHaveCount(0);
    await expect(navigation).toBeVisible();
    await expect(rail).toBeVisible();
    await expect(page.locator(".feed-stories")).toBeVisible();
    const feedOrder = await page.locator(".social-feed").evaluate((element) =>
      [...element.children].map((child) => child.className),
    );
    expect(feedOrder.slice(1, 3)).toEqual(["feed-composer", "feed-stories"]);

    const [navBox, contentBox, railBox] = await Promise.all([
      navigation.boundingBox(),
      content.boundingBox(),
      rail.boundingBox(),
    ]);
    expect(navBox).not.toBeNull();
    expect(contentBox).not.toBeNull();
    expect(railBox).not.toBeNull();
    expect(navBox!.x).toBeGreaterThan(contentBox!.x);
    expect(contentBox!.x).toBeGreaterThan(railBox!.x);
    expect(navBox!.width).toBeGreaterThanOrEqual(220);
    expect(railBox!.width).toBeGreaterThanOrEqual(250);

    const style = await shell.evaluate((element) => {
      const computed = getComputedStyle(element);
      return { display: computed.display, background: computed.backgroundColor };
    });
    expect(style.display).toBe("grid");
    expect(style.background).not.toBe("rgba(0, 0, 0, 0)");

    if (browserName === "chromium") {
      await page.screenshot({ path: "reports/qa/screenshots/stitch-desktop-1440.png", fullPage: true });
    }
  });

  test("mobile shell hides discovery rail and keeps bottom navigation usable", async ({ page, browserName }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const navigation = page.locator(".app-shell__nav");
    await expect(page.locator(".app-shell__rail")).toBeHidden();
    await expect(page.locator(".app-shell__leading-rail")).toBeHidden();
    await expect(page.locator(".app-shell__search")).toBeHidden();
    await expect(page.locator(".app-shell__actions")).toBeVisible();
    await expect(navigation).toBeVisible();
    await expect(navigation.locator("a")).toHaveCount(5);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    const navStyle = await navigation.evaluate((element) => {
      const computed = getComputedStyle(element);
      return { position: computed.position, overflowX: computed.overflowX };
    });
    expect(navStyle.position).toBe("sticky");
    expect(["auto", "scroll"]).toContain(navStyle.overflowX);

    if (browserName === "chromium") {
      await page.screenshot({ path: "reports/qa/screenshots/stitch-mobile-390.png", fullPage: true });
    }
  });

  test("header search remains keyboard operable and preserves route query", async ({ page }) => {
    await page.goto("/");
    const query = page.locator("#shell-search-query");
    await query.focus();
    await expect(query).toBeFocused();
    await query.fill("مدخل");
    await query.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=%D9%85%D8%AF%D8%AE%D9%84$/);
    await expect(page.locator("main h1")).toBeVisible();
  });

  test("shell landmarks remain unique and public discovery excludes private fixtures", async ({ page }) => {
    for (const route of ["/", "/search", "/content/content-1", "/me/questions/question-private-1"]) {
      await page.goto(route);
      await expect(page.locator("header.app-shell__header")).toHaveCount(1);
      await expect(page.locator("nav.app-shell__nav")).toHaveCount(1);
      await expect(page.locator("main#main-content")).toHaveCount(1);
    }

    await page.goto("/");
    const railText = await page.locator(".app-shell__rail").innerText();
    expect(railText).not.toContain("question-private-1");
    expect(railText).not.toContain("سؤال خاص تجريبي");
  });
});
