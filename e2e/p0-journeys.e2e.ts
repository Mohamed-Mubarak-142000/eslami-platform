import { expect, test } from "@playwright/test";

test.describe("P0 public and member journeys", () => {
  test("public search keeps the query shareable and exposes results", async ({ page }) => {
    await page.goto("/search?q=%D9%85%D8%AF%D8%AE%D9%84");
    await expect(page).toHaveURL(/\/search\?q=/);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator("main article, main li").first()).toBeVisible();
  });

  test("member can select private question visibility and sees a privacy notice", async ({ page }) => {
    await page.goto("/ask/1");
    const radios = page.getByRole("radio");
    await expect(radios).toHaveCount(2);
    await radios.nth(1).check();
    await expect(radios.nth(1)).toBeChecked();
    await expect(page.getByRole("note")).toBeVisible();
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
    for (const route of ["/", "/explore", "/search?q=question-private-1"]) {
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
    await expect(page.locator('[role="status"], [role="alert"]')).toBeVisible();
  });

  test("member session is denied admin verification decisions", async ({ page }) => {
    await page.goto("/admin/verification/verification-1");
    await expect(page.locator("textarea")).toHaveCount(0);
    await expect(page.locator('[role="status"], [role="alert"]')).toBeVisible();
  });

  test("member session is denied moderation decisions", async ({ page }) => {
    await page.goto("/admin/moderation/case-1");
    await expect(page.locator("textarea")).toHaveCount(0);
    await expect(page.locator('[role="status"], [role="alert"]')).toBeVisible();
  });
});
