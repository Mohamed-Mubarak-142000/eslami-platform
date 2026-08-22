import { expect, test } from "@playwright/test";

test.describe("public landing and member community", () => {
  test("landing is public, responsive, and exposes opt-in Quran radio", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("معرفة تُبصر بها");
    await expect(page.locator(".landing-hero__actions a[href='/community'], .landing-hero__actions a[href='/register']").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "إذاعة القرآن الكريم" })).toBeVisible();
    await expect(page.getByRole("button", { name: "تشغيل إذاعة القرآن" })).toBeVisible();
    await expect(page.locator("audio")).not.toHaveAttribute("autoplay", /.*/);
    await expect(page.locator(".app-shell__header")).toHaveCount(0);

    const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(pageWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test("community keeps the existing authenticated social feed", async ({ page }) => {
    await page.goto("/community", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/community$/);
    await expect(page.locator(".app-shell__header")).toBeVisible();
    await expect(page.locator("main")).toContainText("مدخل تجريبي إلى فقه العبادات");
  });

  test("uses the supplied logo and keeps one Egyptian radio player in a fixed dock", async ({ page }) => {
    await page.addInitScript(() => {
      HTMLMediaElement.prototype.play = async function play() { this.dispatchEvent(new Event("play")); };
      HTMLMediaElement.prototype.pause = function pause() { this.dispatchEvent(new Event("pause")); };
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".landing-header .brand-logo img")).toBeVisible();
    await expect(page.locator(".radio-player__station")).toContainText("القاهرة");
    await page.locator("#radio").scrollIntoViewIfNeeded();
    await page.locator(".radio-player__play").click();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(page.locator(".radio-dock")).toBeVisible();
    await expect(page.locator("audio")).toHaveCount(1);
    await expect(page.locator(".radio-dock")).toHaveCSS("position", "fixed");
    const [dockWidth, viewportWidth] = await page.evaluate(() => [
      document.querySelector(".radio-dock")?.getBoundingClientRect().width ?? 0,
      document.documentElement.clientWidth,
    ]);
    expect(Math.abs(dockWidth - viewportWidth)).toBeLessThanOrEqual(1);
  });

  test("applies the Basira green identity to the member shell", async ({ page }) => {
    await page.goto("/community", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".app-shell__brand .brand-logo img")).toBeVisible();
    const primary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--ds-color-primary").trim());
    expect(["#176f62", "#73cbb2"]).toContain(primary);
  });
});
