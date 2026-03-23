import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("home renders main landmark and Rewind chrome", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByText("Rewind", { exact: true }).first()).toBeVisible();
  });

  test("demo index has typographic entry link", async ({ page }) => {
    await page.goto("/");
    const artist = page.locator("main a.indexArtistLink").first();
    await expect(artist).toBeVisible();
    await expect(artist).toHaveAttribute("href", /\/entry\//);
  });
});
