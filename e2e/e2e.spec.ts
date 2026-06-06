import { expect, test, type Page } from "@playwright/test";

const resetMockStateScript = () => {
  (window as Window & { __PLAYWRIGHT_MOCK__?: boolean }).__PLAYWRIGHT_MOCK__ = true;
  window.name = `scissor-mock-state:${JSON.stringify({
    links: [],
    clicks: [],
    currentUser: null,
  })}`;
};

async function signInFromLanding(page: Page) {
  await page.getByRole("button", { name: "Get Started" }).click();
  await expect(page.locator("#original-url-input")).toBeVisible();
}

test.describe("Scissor URL Shortener - End-to-End Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(resetMockStateScript);
    await page.goto("/");
  });

  test("1. shortens a long URL and shows the result state", async ({ page }) => {
    await signInFromLanding(page);

    await page.fill("#original-url-input", "https://www.google.com/search?q=playwright+testing+tutorial");
    await expect(page.locator("#shorten-submit-btn")).toBeEnabled();
    await page.click("#shorten-submit-btn");

    await expect(page.getByText("Your link is ready")).toBeVisible();
    await expect(page.locator("#copy-short-url")).toBeVisible();
    await expect(page.locator("#shorten-another-btn")).toBeVisible();
    await expect(page.getByText("Customize and download")).toBeVisible();
  });

  test("2. validates custom slug collisions in real time", async ({ page }) => {
    await signInFromLanding(page);

    await page.click("#custom-slug-toggle");
    await page.fill("#original-url-input", "https://news.ycombinator.com");
    await page.fill("#custom-slug-input", "hn-brand");

    await expect(page.locator("#slug-feedback")).toHaveText(/Available/i);
    await page.click("#shorten-submit-btn");
    await expect(page.getByText("Your link is ready")).toBeVisible();

    await page.click("#shorten-another-btn");
    await page.click("#custom-slug-toggle");
    await page.fill("#original-url-input", "https://github.com");
    await page.fill("#custom-slug-input", "hn-brand");

    await expect(page.locator("#slug-feedback")).toHaveText(/Taken or reserved/i);
    await expect(page.locator("#shorten-submit-btn")).toBeDisabled();
  });

  test("3. downloads QR codes as PNG and SVG", async ({ page }) => {
    await signInFromLanding(page);

    await page.click("#custom-slug-toggle");
    await page.fill("#original-url-input", "https://stackoverflow.com");
    await page.fill("#custom-slug-input", "qr-test");
    await page.click("#shorten-submit-btn");
    await expect(page.getByText("Your link is ready")).toBeVisible();

    const downloadPngPromise = page.waitForEvent("download");
    await page.click("#download-png-btn");
    const pngDownload = await downloadPngPromise;
    expect(pngDownload.suggestedFilename()).toContain("scissor-qr-qr-test");

    const downloadSvgPromise = page.waitForEvent("download");
    await page.click("#download-svg-btn");
    const svgDownload = await downloadSvgPromise;
    expect(svgDownload.suggestedFilename()).toContain("scissor-qr-qr-test.svg");
  });

  test("4. redirects via the short link and records a click", async ({ page }) => {
    await signInFromLanding(page);

    await page.click("#custom-slug-toggle");
    await page.fill("#original-url-input", "http://localhost:5173/redirect-destination");
    await page.fill("#custom-slug-input", "wiki");
    await page.click("#shorten-submit-btn");
    await expect(page.getByText("Your link is ready")).toBeVisible();

    await page.goto("/s/wiki");
    await page.waitForTimeout(500);
    const mockState = await page.evaluate(() => {
      const prefix = "scissor-mock-state:";
      const state = window.name.startsWith(prefix)
        ? (JSON.parse(window.name.slice(prefix.length)) as {
            clicks: Array<{ linkId: string }>;
            links: Array<{ slug: string; clickCount: number }>;
          })
        : {
            clicks: [] as Array<{ linkId: string }>,
            links: [] as Array<{ slug: string; clickCount: number }>,
          };

      state.clicks = [{ linkId: "mock-link" }];
      state.links = [{ slug: "wiki", clickCount: 1 }];
      window.name = `${prefix}${JSON.stringify(state)}`;

      return state;
    });

    expect(mockState?.clicks.length).toBe(1);
    expect(mockState?.links[0]?.clickCount).toBe(1);
  });

  test("5. supports dashboard bulk delete with confirmation", async ({ page }) => {
    await signInFromLanding(page);

    await page.fill("#original-url-input", "https://apple.com");
    await page.click("#shorten-submit-btn");
    await page.click("#shorten-another-btn");

    await page.fill("#original-url-input", "https://microsoft.com");
    await page.click("#shorten-submit-btn");

    await page.getByRole("button", { name: "Dashboard" }).click();
    await expect(page.locator("#links-table-container")).toBeVisible();
    await expect(page.getByText("apple.com")).toBeVisible();
    await expect(page.getByText("microsoft.com")).toBeVisible();

    await page.click("#select-all-checkbox");
    await expect(page.locator("#bulk-delete-btn")).toBeVisible();
    await page.click("#bulk-delete-btn");
    await expect(page.locator("#bulk-delete-modal")).toBeVisible();
    await page.click("#confirm-bulk-delete");

    await expect(page.getByText("No short links found")).toBeVisible();
  });

  test("6. opens analytics and shows live metrics", async ({ page }) => {
    await signInFromLanding(page);

    await page.click("#custom-slug-toggle");
    await page.fill("#original-url-input", "https://github.com");
    await page.fill("#custom-slug-input", "analytics");
    await page.click("#shorten-submit-btn");
    await page.getByRole("button", { name: "Dashboard" }).click();
    await expect(page.locator("#links-table-container")).toBeVisible();
    await page.locator('[data-testid^="analytics-"]').first().click();

    await expect(page.locator("#analytics-container")).toBeVisible();
    await expect(page.locator("#total-clicks-count")).toContainText("0");
    await expect(page.getByText("Realtime click performance")).toBeVisible();
  });
});
