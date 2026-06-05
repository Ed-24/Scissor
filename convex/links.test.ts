import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { create, checkSlugAvailable, generateSlug, isValidUrl } from "./links";

function createTestEnv() {
  return convexTest({
    schema,
    modules: {
      "convex/_generated/api": () => import("./_generated/api"),
    },
  });
}

describe("Scissor Backend - Unit & Integration Tests", () => {
  test("URL validation logic", () => {
    expect(isValidUrl("https://google.com")).toBe(true);
    expect(isValidUrl("http://my-subdomain.coolsite.org/path?query=1")).toBe(true);

    expect(isValidUrl("google.com")).toBe(false);
    expect(isValidUrl("ftp://google.com")).toBe(false);
    expect(isValidUrl("invalid-url")).toBe(false);

    expect(isValidUrl("https://phishing.com")).toBe(false);
    expect(isValidUrl("https://login-paypal-verify.com/login")).toBe(false);
    expect(isValidUrl("https://sub.steal-creds.org")).toBe(false);
  });

  test("Slug generation logic", () => {
    const slug1 = generateSlug();
    const slug2 = generateSlug(10);

    expect(slug1).toHaveLength(6);
    expect(slug2).toHaveLength(10);
    expect(/^[a-zA-Z0-9]+$/.test(slug1)).toBe(true);
    expect(/^[a-zA-Z0-9]+$/.test(slug2)).toBe(true);
    expect(slug1).not.toBe(slug2);
  });

  test("Slug collision detection and availability", async () => {
    const t = createTestEnv();

    await t.mutation(create, {
      originalUrl: "https://example.com",
      customSlug: "test-slug",
      anonymousClientId: "test-client",
    });

    const available1 = await t.query(checkSlugAvailable, {
      slug: "test-slug",
    });
    expect(available1).toBe(false);

    const available2 = await t.query(checkSlugAvailable, {
      slug: "fresh-slug",
    });
    expect(available2).toBe(true);

    await expect(
      t.mutation(create, {
        originalUrl: "https://another.com",
        customSlug: "test-slug",
        anonymousClientId: "test-client",
      })
    ).rejects.toThrow("This custom slug is already taken.");
  });

  test("Anonymous rate limiting and expiry configuration", async () => {
    const t = createTestEnv();

    const futureTime = Date.now() + 1000 * 60 * 60;
    const link = await t.mutation(create, {
      originalUrl: "https://valid.com",
      expiresAt: futureTime,
      anonymousClientId: "test-guest-client",
    });

    expect(link.slug).toHaveLength(6);

    for (let i = 0; i < 4; i += 1) {
      await t.mutation(create, {
        originalUrl: `https://valid-${i}.com`,
        anonymousClientId: "test-guest-client",
      });
    }

    await expect(
      t.mutation(create, {
        originalUrl: "https://sixth-link.com",
        anonymousClientId: "test-guest-client",
      })
    ).rejects.toThrow("Rate limit reached.");
  });
});
