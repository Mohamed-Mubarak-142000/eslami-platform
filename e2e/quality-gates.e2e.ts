import { expect, test } from "@playwright/test";

const mojibake = /(?:Ø.|Ù.){2,}/;
const routes = ["/", "/search", "/ask/1", "/content/content-1", "/scholars/sample-researcher"];

test.describe("Arabic, RTL, accessibility, and responsive gates", () => {
  for (const route of routes) {
    test(`${route} is Arabic-first without encoding corruption`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("html")).toHaveAttribute("lang", "ar");
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      expect(await page.locator("body").innerText()).not.toMatch(mojibake);
    });
  }

  test("keyboard skip link moves focus to main content", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.locator("a[href='#main-content']");
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("admin route exposes exactly one main landmark", async ({ page }) => {
    await page.goto("/admin/moderation");
    await expect(page.locator("main")).toHaveCount(1);
  });

  for (const viewport of [
    { name: "mobile", width: 360, height: 800 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1280, height: 800 },
  ]) {
    test(`${viewport.name} layout has no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test("pages expose one main landmark and a visible primary heading", async ({ page }) => {
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main")).toHaveCount(1);
      await expect(page.locator("main h1").first()).toBeVisible();
    }
  });
});
