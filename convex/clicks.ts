import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function canAccessLink(
  link: { userId?: string; anonymousClientId?: string },
  userId: string | undefined,
  anonymousClientId: string | undefined
): boolean {
  if (link.userId) {
    return link.userId === userId;
  }

  return !!anonymousClientId && link.anonymousClientId === anonymousClientId;
}

export const trackClick = mutation({
  args: {
    linkId: v.id("links"),
    referrer: v.string(),
    country: v.string(),
    device: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("clicks", {
      linkId: args.linkId,
      timestamp: Date.now(),
      referrer: args.referrer,
      country: args.country,
      device: args.device,
    });
  },
});

export const getLinkAnalytics = query({
  args: {
    linkId: v.id("links"),
    anonymousClientId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    const link = await ctx.db.get(args.linkId);
    if (!link) {
      throw new Error("Link not found.");
    }

    if (!canAccessLink(link, userId, args.anonymousClientId)) {
      throw new Error("Unauthorized access to link analytics.");
    }

    const clicks = await ctx.db
      .query("clicks")
      .withIndex("by_linkId", (q) => q.eq("linkId", args.linkId))
      .collect();

    const clicksByDate: Record<string, number> = {};
    const referrersCount: Record<string, number> = {};
    const devicesCount: Record<string, number> = {};
    const countriesCount: Record<string, number> = {};

    for (const click of clicks) {
      const dateStr = new Date(click.timestamp).toISOString().split("T")[0];
      clicksByDate[dateStr] = (clicksByDate[dateStr] || 0) + 1;

      const referrer = click.referrer || "Direct";
      referrersCount[referrer] = (referrersCount[referrer] || 0) + 1;

      const device = click.device || "Other";
      devicesCount[device] = (devicesCount[device] || 0) + 1;

      const country = click.country || "Unknown";
      countriesCount[country] = (countriesCount[country] || 0) + 1;
    }

    const clicksOverTime = Object.entries(clicksByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const referrers = Object.entries(referrersCount)
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const devices = Object.entries(devicesCount)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);

    const countries = Object.entries(countriesCount)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalClicks: clicks.length,
      clicksOverTime,
      referrers,
      devices,
      countries,
    };
  },
});
