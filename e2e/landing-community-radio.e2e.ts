import { expect, test } from "@playwright/test";

test.describe("public landing and member community", () => {
  test("landing is public, responsive, and exposes opt-in Quran radio", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("معرفة تُبصر بها");
    await expect(page.getByRole("link", { name: /انضم إلى مجتمع بصيرة|ادخل مجتمع بصيرة/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "إذاعة القرآن الكريم" })).toBeVisible();
    await expect(page.getByRole("button", { name: "تشغيل إذاعة القرآن" })).toBeVisible();
    await expect(page.locator("audio")).not.toHaveAttribute("autoplay", /.*/);
    await expect(page.locator(".app-shell__header")).toHaveCount(0);

    const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(pageWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test("community keeps the existing authenticated social feed", async ({ page }) => {
    await page.goto("/community");
    await expect(page).toHaveURL(/\/community$/);
    await expect(page.locator(".app-shell__header")).toBeVisible();
    await expect(page.locator("main")).toContainText("مدخل تجريبي إلى فقه العبادات");
  });
});
