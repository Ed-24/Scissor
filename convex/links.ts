import { customAlphabet } from "nanoid";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

const RESERVED_SLUGS = new Set([
  "api",
  "dashboard",
  "admin",
  "login",
  "s",
  "r",
  "index",
  "assets",
  "public",
  "docs",
  "status",
  "expired",
  "health",
  "cron",
  "auth",
]);

const PHISHING_BLOCKLIST = [
  "phishing.com",
  "malicious-site.net",
  "get-free-money.xyz",
  "login-paypal-verify.com",
  "steal-creds.org",
];

const SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

type LinkDoc = Doc<"links">;
type LinkWithClickCount = LinkDoc & { clickCount: number };

function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

function canAccessLink(link: LinkDoc, userId: string | undefined, anonymousClientId: string | undefined): boolean {
  if (userId) {
    return link.userId === userId;
  }

  return !!anonymousClientId && link.anonymousClientId === anonymousClientId;
}

export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    const hostname = url.hostname.toLowerCase();
    for (const blocked of PHISHING_BLOCKLIST) {
      if (hostname === blocked || hostname.endsWith(`.${blocked}`)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

export function generateSlug(length: number = 6): string {
  return customAlphabet(SLUG_ALPHABET, length)();
}

export const checkSlugAvailable = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const slug = args.slug.trim();

    if (slug.length < 3 || slug.length > 50) {
      return false;
    }
    if (!/^[a-zA-Z0-9-]+$/.test(slug)) {
      return false;
    }
    if (isReservedSlug(slug)) {
      return false;
    }

    const existing = await ctx.db
      .query("links")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    return existing === null;
  },
});

export const getLinkBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("links")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug.trim()))
      .first();
  },
});

export const create = mutation({
  args: {
    originalUrl: v.string(),
    customSlug: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    anonymousClientId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const originalUrl = args.originalUrl.trim();

    if (!isValidUrl(originalUrl)) {
      throw new Error("Invalid URL or domain is flagged as phishing.");
    }

    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    if (!userId) {
      if (!args.anonymousClientId) {
        throw new Error("Client ID is required for guest shortening.");
      }

      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recentLinks = await ctx.db
        .query("links")
        .withIndex("by_anonymousClientId", (q) => q.eq("anonymousClientId", args.anonymousClientId))
        .filter((q) => q.gt(q.field("createdAt"), oneDayAgo))
        .collect();

      if (recentLinks.length >= 5) {
        throw new Error(
          "Rate limit reached. Anonymous users are limited to 5 links per 24 hours. Please sign in for unlimited links."
        );
      }
    }

    let slug = "";
    if (args.customSlug) {
      slug = args.customSlug.trim();

      if (slug.length < 3 || slug.length > 50) {
        throw new Error("Custom slug must be between 3 and 50 characters.");
      }
      if (!/^[a-zA-Z0-9-]+$/.test(slug)) {
        throw new Error("Custom slug can only contain letters, numbers, and hyphens.");
      }
      if (isReservedSlug(slug)) {
        throw new Error("This custom slug is reserved and cannot be used.");
      }

      const existing = await ctx.db
        .query("links")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();
      if (existing) {
        throw new Error("This custom slug is already taken.");
      }
    } else {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const generatedSlug = generateSlug();
        const existing = await ctx.db
          .query("links")
          .withIndex("by_slug", (q) => q.eq("slug", generatedSlug))
          .first();

        if (!existing) {
          slug = generatedSlug;
          break;
        }
      }

      if (!slug) {
        throw new Error("Failed to generate a unique short slug. Please try again.");
      }
    }

    if (args.expiresAt && args.expiresAt <= Date.now()) {
      throw new Error("Expiration date must be in the future.");
    }

    const newLinkId = await ctx.db.insert("links", {
      originalUrl,
      slug,
      userId,
      anonymousClientId: userId ? undefined : args.anonymousClientId,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
      status: "active",
    });

    if (args.expiresAt) {
      await ctx.scheduler.runAt(args.expiresAt, internal.links.expireLink, {
        slug,
      });
    }

    return { linkId: newLinkId, slug };
  },
});

export const expireLink = internalMutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("links")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (link && link.status === "active") {
      await ctx.db.patch(link._id, { status: "expired" });
    }
  },
});

export const listUserLinks = query({
  args: { anonymousClientId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    let links: LinkDoc[] = [];
    if (userId) {
      links = await ctx.db
        .query("links")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .order("desc")
        .collect();
    } else if (args.anonymousClientId) {
      links = await ctx.db
        .query("links")
        .withIndex("by_anonymousClientId", (q) => q.eq("anonymousClientId", args.anonymousClientId))
        .order("desc")
        .collect();
    }

    const results: LinkWithClickCount[] = [];
    for (const link of links) {
      const clicks = await ctx.db
        .query("clicks")
        .withIndex("by_linkId", (q) => q.eq("linkId", link._id))
        .collect();

      results.push({
        ...link,
        clickCount: clicks.length,
      });
    }

    return results;
  },
});

export const deleteLink = mutation({
  args: {
    id: v.id("links"),
    anonymousClientId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Link not found.");
    }

    if (!canAccessLink(existing, userId, args.anonymousClientId)) {
      throw new Error("Unauthorized.");
    }

    const clicks = await ctx.db
      .query("clicks")
      .withIndex("by_linkId", (q) => q.eq("linkId", args.id))
      .collect();

    for (const click of clicks) {
      await ctx.db.delete(click._id);
    }

    await ctx.db.delete(args.id);
  },
});

export const bulkDelete = mutation({
  args: {
    ids: v.array(v.id("links")),
    anonymousClientId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    for (const id of args.ids) {
      const existing = await ctx.db.get(id);
      if (!existing) {
        continue;
      }

      if (!canAccessLink(existing, userId, args.anonymousClientId)) {
        continue;
      }

      const clicks = await ctx.db
        .query("clicks")
        .withIndex("by_linkId", (q) => q.eq("linkId", id))
        .collect();

      for (const click of clicks) {
        await ctx.db.delete(click._id);
      }

      await ctx.db.delete(id);
    }
  },
});
