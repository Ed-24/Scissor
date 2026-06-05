import { expect, test } from "@playwright/test";

test.describe("Scissor URL Shortener - End-to-End Tests", () => {
  test.beforeEach(async ({ page }) => {
    // 1. Enable mock Convex client in the browser before page load
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
    });

    // 2. Load the page and clear storage to run in a clean sandbox
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("1. should shorten a long URL and display the shortened link and actions", async ({ page }) => {
    // Fill in target URL
    const originalUrl = "https://www.google.com/search?q=playwright+testing+tutorial";
    await page.fill("#original-url-input", originalUrl);

    // Verify submit button is active
    const submitBtn = page.locator("#shorten-submit-btn");
    await expect(submitBtn).toBeEnabled();

    // Click submit and wait for generated result
    await submitBtn.click();

    // Verify success UI
    await expect(page.locator("text=Your Link is Ready!")).toBeVisible();
    await expect(page.locator("#copy-short-url")).toBeVisible();
    await expect(page.locator("#shorten-another-btn")).toBeVisible();

    // Check that QR Code controls are visible
    await expect(page.locator("text=Customize QR Code")).toBeVisible();
  });

  test("2. should validate and prevent slug collisions for custom slugs", async ({ page }) => {
    // Enable custom slug option
    await page.click("#custom-slug-toggle");

    // Input destination and custom slug
    await page.fill("#original-url-input", "https://news.ycombinator.com");
    await page.fill("#custom-slug-input", "hn-brand");

    // Wait for debounce availability check
    await page.waitForTimeout(500);
    await expect(page.locator("#slug-feedback")).toHaveText("Available!");

    // Shorten first link
    await page.click("#shorten-submit-btn");
    await expect(page.locator("text=Your Link is Ready!")).toBeVisible();

    // Reset form to shorten another
    await page.click("#shorten-another-btn");

    // Try creating another link with the exact same custom slug
    await page.click("#custom-slug-toggle");
    await page.fill("#original-url-input", "https://github.com");
    await page.fill("#custom-slug-input", "hn-brand");

    // Wait for debounce and verify collision feedback
    await page.waitForTimeout(500);
    await expect(page.locator("#slug-feedback")).toHaveText("Taken or reserved.");

    // Submit button should be disabled due to collision
    await expect(page.locator("#shorten-submit-btn")).toBeDisabled();
  });

  test("3. should allow customized colors and downloading QR codes", async ({ page }) => {
    await page.fill("#original-url-input", "https://stackoverflow.com");
    await page.click("#shorten-submit-btn");
    await expect(page.locator("text=Your Link is Ready!")).toBeVisible();

    // Verify color pickers exist
    const fgColorPicker = page.locator("#qr-fg-color");
    const bgColorPicker = page.locator("#qr-bg-color");
    await expect(fgColorPicker).toBeVisible();
    await expect(bgColorPicker).toBeVisible();

    // Change QR Code foreground and background colors
    await fgColorPicker.fill("#3b82f6"); // custom blue
    await bgColorPicker.fill("#ffffff"); // white background

    // Wait for canvas or downloads
    const downloadPngPromise = page.waitForEvent("download");
    await page.click("#download-png-btn");
    const pngDownload = await downloadPngPromise;
    expect(pngDownload.suggestedFilename()).toContain("hn-qr-code"); // slug or generic name fallback

    const downloadSvgPromise = page.waitForEvent("download");
    await page.click("#download-svg-btn");
    const svgDownload = await downloadSvgPromise;
    expect(svgDownload.suggestedFilename()).toContain(".svg");
  });

  test("4. should log a click and redirect correctly when visiting the short link", async ({ page }) => {
    // 1. Create a short link with a custom slug
    await page.click("#custom-slug-toggle");
    await page.fill("#original-url-input", "https://wikipedia.org");
    await page.fill("#custom-slug-input", "wiki");
    await page.waitForTimeout(500);
    await page.click("#shorten-submit-btn");
    await expect(page.locator("text=Your Link is Ready!")).toBeVisible();

    // 2. Access the short link locally (simulate redirect action)
    // In our mocked routing, navigating to /s/wiki should capture, log a click, and redirect to wikipedia.org
    await page.goto("/s/wiki");

    // 3. Verify it redirects successfully to the destination page
    await expect(page).toHaveURL(/.*wikipedia.org.*/);
  });

  test("5. should support bulk deletion of multiple links via the dashboard", async ({ page }) => {
    // Setup Native Confirm Dialog listener to accept automatically
    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    // 1. Sign In to view dashboard
    await page.click("#sign-in-btn");
    await page.click("#login-quick-btn");
    await expect(page.locator("#nav-dashboard")).toBeVisible();

    // 2. Create first link
    await page.fill("#original-url-input", "https://apple.com");
    await page.click("#shorten-submit-btn");
    await expect(page.locator("text=Your Link is Ready!")).toBeVisible();
    await page.click("#shorten-another-btn");

    // 3. Create second link
    await page.fill("#original-url-input", "https://microsoft.com");
    await page.click("#shorten-submit-btn");
    await expect(page.locator("text=Your Link is Ready!")).toBeVisible();

    // 4. Navigate to dashboard
    await page.click("#nav-dashboard");
    await expect(page.locator("#links-table-container")).toBeVisible();

    // Verify both links are listed in the table
    await expect(page.locator("text=apple.com")).toBeVisible();
    await expect(page.locator("text=microsoft.com")).toBeVisible();

    // Select all links using header checkbox
    await page.click("#select-all-checkbox");

    // Verify bulk delete button appears showing correct count
    const bulkDeleteBtn = page.locator("#bulk-delete-btn");
    await expect(bulkDeleteBtn).toHaveText(/Delete Selected \(2\)/);

    // Trigger bulk delete click and confirm in modal
    await bulkDeleteBtn.click();
    await expect(page.locator("#bulk-delete-modal")).toBeVisible();
    await page.click("#confirm-bulk-delete");

    // Verify dashboard is empty
    await expect(page.locator("text=No short links found")).toBeVisible();
  });
});
