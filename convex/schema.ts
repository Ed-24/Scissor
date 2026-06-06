import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  links: defineTable({
    originalUrl: v.string(),
    slug: v.string(),
    userId: v.optional(v.string()),
    anonymousClientId: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
    status: v.string(), // "active" | "expired"
    clickCount: v.number(),
  })
  .index("by_slug", ["slug"])
  .index("by_userId", ["userId"])
  .index("by_anonymousClientId", ["anonymousClientId"]),

  clicks: defineTable({
    linkId: v.id("links"),
    timestamp: v.number(),
    referrer: v.string(),
    country: v.string(),
    device: v.string(),
    visitorKey: v.optional(v.string()),
  })
    .index("by_linkId", ["linkId"])
    .index("by_linkId_timestamp", ["linkId", "timestamp"]),
});
