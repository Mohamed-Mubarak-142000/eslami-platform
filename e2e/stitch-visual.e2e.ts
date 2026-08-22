import { expect, test } from "@playwright/test";

test.describe("Mounir Stitch shell visual contract", () => {
  test("secondary routes share the responsive social page contract", async ({ page }) => {
    test.setTimeout(60_000);
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: width > 600 ? 900 : 844 });
      for (const route of ["/explore", "/search", "/ask/1", "/saved"]) {
        await page.goto(route);
        await expect(page.locator(".social-page")).toBeVisible();
        await expect(page.locator(".social-page__hero h1")).toBeVisible();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(1);
      }
    }

    await page.goto("/explore");
    await expect(page.locator(".topic-grid a")).toHaveCount(1);
    await expect(page.locator(".scholar-grid")).toBeVisible();
    await page.goto("/search");
    await expect(page.locator(".social-search__form")).toBeVisible();
    await page.goto("/ask/1");
    await expect(page.locator(".visibility-picker label")).toHaveCount(2);
    await page.goto("/saved");
    await expect(page.locator(".saved-collections .feed-post").first()).toBeVisible();
  });

  test("brand logo and public SEO metadata are exposed", async ({ page, request }) => {
    await page.goto("/");
    const brand = page.locator(".app-shell__brand");
    await expect(brand).toHaveAttribute("aria-label", /الصفحة الرئيسية/);
    await expect(brand.locator("img")).toBeVisible();
    await expect(page.locator("head link[rel='canonical']")).toHaveCount(1);
    await expect(page.locator("head meta[property='og:title']")).toHaveCount(1);
    await expect(page.locator("head meta[name='twitter:card']")).toHaveAttribute("content", "summary_large_image");

    for (const endpoint of ["/icon.png", "/apple-icon.png", "/opengraph-image.png", "/robots.txt", "/sitemap.xml"]) {
      const response = await request.get(endpoint);
      expect(response.ok(), `${endpoint} should respond successfully`).toBe(true);
    }
  });

  test("desktop RTL shell places navigation right, content center, and discovery rail left", async ({ page, browserName }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    const shell = page.locator(".app-shell");
    const navigation = page.locator(".app-shell__leading-rail");
    const content = page.locator(".app-shell__main");
    const rail = page.locator(".app-shell__rail");
    const search = page.locator(".app-shell__search");
    const actions = page.locator(".app-shell__actions");

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(search).toBeVisible();
    await expect(actions).toBeVisible();
    await expect(page.locator(".app-shell__topnav")).toBeVisible();
    await expect(actions.locator(".social-media-actions")).toHaveCount(0);
    const accountMenu = actions.locator(".account-menu");
    await expect(accountMenu).toHaveCount(1);
    await expect(accountMenu.locator(".account-menu__panel")).toBeHidden();
    await expect(actions.locator(".shell-control")).toHaveCount(1);
    await expect(actions.locator(".app-shell__notifications")).toHaveCount(1);
    await accountMenu.locator("summary").focus();
    await accountMenu.locator("summary").press("Enter");
    await expect(accountMenu.locator(".account-menu__panel")).toBeVisible();
    await expect(accountMenu.locator("[role='menuitem']")).toHaveCount(3);
    await expect(accountMenu.locator("a[role='menuitem'][href='/me/questions']")).toBeVisible();
    await expect(accountMenu.locator("a[role='menuitem'][href='/settings/privacy']")).toBeVisible();
    await expect(page.locator("#shell-search-query")).toHaveAttribute("placeholder", /ابحث/);
    await expect(page.locator(".feed-composer__prompt")).toHaveText("بم تفكر يا Mohamed؟");
    await expect(page.locator(".feed-composer__quick-actions button")).toHaveCount(3);
    await expect(page.locator(".feed-composer__quick-actions button[aria-label='إنشاء مقطع']")).toBeVisible();
    await expect(page.locator(".feed-composer__quick-actions button[aria-label='إضافة صورة']")).toBeVisible();
    await expect(page.locator(".feed-composer__quick-actions button[aria-label='فيديو مباشر']")).toBeVisible();
    await expect(page.locator(".feed-tabs")).toHaveCount(0);
    await expect(navigation).toBeVisible();
    await expect(rail).toBeVisible();
    const libraryBanner = rail.getByRole("link", { name: "زيارة الموقع الرسمي للمكتبة الشاملة" });
    await expect(libraryBanner).toBeVisible();
    await expect(libraryBanner).toHaveAttribute("href", "https://shamela.ws/");
    await expect(libraryBanner).toHaveAttribute("target", "_blank");
    await expect(libraryBanner.locator("img")).toBeVisible();
    await expect(rail.locator("header")).toHaveCount(0);
    await expect(rail.locator(".discovery-rail__topics")).toHaveCount(0);
    await expect(rail.getByRole("heading", { name: "موضوعات مقترحة" })).toHaveCount(0);
    await expect(rail.locator(".discovery-rail__suggestions")).toBeVisible();
    await expect(rail.locator(".discovery-rail__scholars")).toBeVisible();
    await expect(navigation.locator(".shortcuts-rail nav a > span svg")).toHaveCount(5);
    await expect(navigation.locator(".shortcuts-rail__profile > span svg")).toHaveCount(1);
    await expect(navigation.locator(".shortcuts-rail__tile svg")).toHaveCount(1);
    const suggestions = rail.locator(".discovery-rail__suggestions");
    const scholars = rail.locator(".discovery-rail__scholars");
    await expect(suggestions).toBeVisible();
    await expect(suggestions.getByRole("button", { name: /متابعة/ })).toHaveCount(3);
    const suggestionOrder = await rail.locator("section").evaluateAll((sections) =>
      sections.map((section) => section.className),
    );
    expect(suggestionOrder.indexOf("discovery-rail__suggestions")).toBeLessThan(
      suggestionOrder.indexOf("discovery-rail__scholars"),
    );
    await expect(scholars).toBeVisible();
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

  test("composer prompt opens an accessible dialog and stories scroll without visible chrome", async ({ page, browserName }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");

    const prompt = page.locator(".feed-composer__prompt");
    await prompt.click();
    const dialog = page.getByRole("dialog", { name: "إنشاء منشور" });
    await expect(dialog).toBeVisible();
    const editor = dialog.locator("#feed-composer-input");
    await expect(editor).toBeFocused();
    await expect(dialog.getByRole("button", { name: "نشر" })).toBeDisabled();
    await editor.fill("مشاركة معرفية تجريبية للاختبار");
    await expect(dialog.getByRole("button", { name: "نشر" })).toBeEnabled();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    const stories = page.locator(".feed-stories__track");
    const storyStyle = await stories.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        overflowX: style.overflowX,
        scrollbarWidth: style.scrollbarWidth,
        canScroll: element.scrollWidth > element.clientWidth,
      };
    });
    expect(storyStyle.overflowX).toBe("auto");
    expect(storyStyle.canScroll).toBe(true);
    if (browserName === "firefox") expect(storyStyle.scrollbarWidth).toBe("none");

    const padding = await page.locator(".app-shell__main").evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).paddingInlineStart),
    );
    expect(padding).toBeLessThanOrEqual(16);
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
