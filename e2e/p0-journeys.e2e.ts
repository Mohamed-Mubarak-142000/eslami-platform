import { expect, test } from "@playwright/test";

test.describe("P0 public and member journeys", () => {
  test("new public navigation pages are available", async ({ page }) => {
    for (const route of ["/about", "/contact", "/categories"]) {
      await page.goto(route);
      await expect(page.locator("main h1")).toBeVisible();
    }
  });

  test("private question never leaks its content into URL or document metadata", async ({ page }) => {
    await page.goto("/me/questions/question-private-1");
    const title = await page.title();
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(page.url()).not.toContain("Ø³Ø¤Ø§Ù„");
    expect(title).not.toContain("Ø³Ø¤Ø§Ù„ Ø®Ø§Øµ ØªØ¬Ø±ÙŠØ¨ÙŠ");
    expect(description).not.toContain("ØªÙØ§ØµÙŠÙ„ Ù„Ø§ ØªØ¯Ø®Ù„");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("private question fixture is absent from public discovery surfaces", async ({ page }) => {
    for (const route of ["/", "/about", "/categories"]) {
      await page.goto(route);
      const documentText = await page.locator("html").innerText();
      expect(documentText).not.toContain("question-private-1");
      expect(documentText).not.toContain("سؤال خاص تجريبي");
    }
  });
});

test.describe("P0 permission boundaries", () => {
  test("member session is denied scholar answer controls", async ({ page }) => {
    await page.goto("/scholar/questions/question-private-1/answer");
    await expect(page.locator("textarea")).toHaveCount(0);
    await expect(page.locator('[role="status"], [role="alert"]' ).first()).toBeVisible();
  });

  test("member session is denied admin verification decisions", async ({ page }) => {
    await page.goto("/admin/verification/verification-1");
    await expect(page.locator("textarea")).toHaveCount(0);
    await expect(page.locator('[role="status"], [role="alert"]' ).first()).toBeVisible();
  });

  test("member session is denied moderation decisions", async ({ page }) => {
    await page.goto("/admin/moderation/case-1");
    await expect(page.locator("textarea")).toHaveCount(0);
    await expect(page.locator('[role="status"], [role="alert"]' ).first()).toBeVisible();
  });
});
