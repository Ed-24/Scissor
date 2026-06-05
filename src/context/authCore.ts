import { createContext } from "react";
import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL || "http://localhost:3210";

export const convexClient = new ConvexReactClient(convexUrl);

export interface AuthUser {
  id: string;
  fullName: string | null;
  primaryEmailAddress: string | null;
}

export interface AuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: AuthUser | null;
  anonymousId: string;
  signOut: () => Promise<void>;
  signInMock: (username: string) => void;
  isMock: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getOrCreateAnonymousId(): string {
  let id = localStorage.getItem("scissor_anon_id");
  if (!id) {
    id = `guest_${Math.random().toString(36).slice(2, 15)}${Math.random().toString(36).slice(2, 15)}`;
    localStorage.setItem("scissor_anon_id", id);
  }
  return id;
}

export function loadMockUser(): AuthUser | null {
  const savedUser = localStorage.getItem("scissor_mock_user");
  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser) as AuthUser;
  } catch {
    localStorage.removeItem("scissor_mock_user");
    return null;
  }
}

export function createMockUser(username: string): AuthUser {
  const safeUsername = username.trim();
  const normalizedId = safeUsername.toLowerCase().replace(/[^a-z0-9]/g, "_");

  return {
    id: `mock_${normalizedId}`,
    fullName: safeUsername,
    primaryEmailAddress: `${safeUsername.toLowerCase().replace(/[^a-z0-9]/g, "") || "user"}@example.com`,
  };
}

// Mock Convex client functionality for E2E testing
function setupConvexMock(client: any) {
  const getLinks = (): any[] => {
    try {
      return JSON.parse(localStorage.getItem("mock_convex_links") || "[]");
    } catch {
      return [];
    }
  };

  const saveLinks = (links: any[]) => {
    localStorage.setItem("mock_convex_links", JSON.stringify(links));
  };

  const getClicks = (): any[] => {
    try {
      return JSON.parse(localStorage.getItem("mock_convex_clicks") || "[]");
    } catch {
      return [];
    }
  };

  const saveClicks = (clicks: any[]) => {
    localStorage.setItem("mock_convex_clicks", JSON.stringify(clicks));
  };

  const listeners = new Set<() => void>();
  const triggerQueries = () => {
    listeners.forEach((l) => l());
  };

  client.mutation = async (funcRef: any, args: any) => {
    const path = funcRef._toApiString || funcRef.name || String(funcRef);

    if (path.includes("create")) {
      const links = getLinks();
      const slug = args.customSlug || Math.random().toString(36).slice(2, 8);

      if (args.customSlug && links.some((l: any) => l.slug === args.customSlug)) {
        throw new Error("Slug is already taken.");
      }

      const newLink = {
        _id: `link_${Math.random().toString(36).slice(2, 9)}`,
        slug,
        originalUrl: args.originalUrl,
        expiresAt: args.expiresAt,
        anonymousClientId: args.anonymousClientId,
        createdAt: Date.now(),
        status: "active",
      };

      links.push(newLink);
      saveLinks(links);
      triggerQueries();
      return newLink;
    }

    if (path.includes("deleteLink")) {
      let links = getLinks();
      links = links.filter((l: any) => l._id !== args.id);
      saveLinks(links);
      triggerQueries();
      return null;
    }

    if (path.includes("bulkDelete")) {
      let links = getLinks();
      const idsToDelete = new Set(args.ids);
      links = links.filter((l: any) => !idsToDelete.has(l._id));
      saveLinks(links);
      triggerQueries();
      return null;
    }

    if (path.includes("trackClick")) {
      const clicks = getClicks();
      const newClick = {
        _id: `click_${Math.random().toString(36).slice(2, 9)}`,
        linkId: args.linkId,
        referrer: args.referrer || "Direct",
        country: args.country || "US",
        device: args.device || "Desktop",
        createdAt: Date.now(),
      };
      clicks.push(newClick);
      saveClicks(clicks);
      triggerQueries();
      return null;
    }

    throw new Error(`Unknown mock mutation: ${path}`);
  };

  client.watchQuery = (funcRef: any, args: any) => {
    const path = funcRef._toApiString || funcRef.name || String(funcRef);

    return {
      localQueryResult: () => {
        if (args === "skip") return undefined;

        if (path.includes("checkSlugAvailable")) {
          const links = getLinks();
          const taken = links.some((l: any) => l.slug === args.slug);
          return !taken;
        }

        if (path.includes("listUserLinks")) {
          const links = getLinks();
          const clicks = getClicks();

          const userLinks = links.filter((l: any) => {
            if (args.anonymousClientId) {
              return l.anonymousClientId === args.anonymousClientId;
            }
            return true;
          });

          return userLinks.map((l: any) => {
            const count = clicks.filter((c: any) => c.linkId === l._id).length;
            return {
              ...l,
              clickCount: count,
            };
          });
        }

        if (path.includes("getLinkAnalytics")) {
          const clicks = getClicks();
          const linkClicks = clicks.filter((c: any) => c.linkId === args.linkId);

          const refMap: Record<string, number> = {};
          const devMap: Record<string, number> = {};
          const countryMap: Record<string, number> = {};
          const timeMap: Record<string, number> = {};

          linkClicks.forEach((c: any) => {
            refMap[c.referrer] = (refMap[c.referrer] || 0) + 1;
            devMap[c.device] = (devMap[c.device] || 0) + 1;
            countryMap[c.country] = (countryMap[c.country] || 0) + 1;

            const dateStr = new Date(c.createdAt).toISOString().split("T")[0];
            timeMap[dateStr] = (timeMap[dateStr] || 0) + 1;
          });

          return {
            totalClicks: linkClicks.length,
            clicksOverTime: Object.entries(timeMap).map(([date, count]) => ({ date, count })),
            referrers: Object.entries(refMap).map(([referrer, count]) => ({ referrer, count })),
            devices: Object.entries(devMap).map(([device, count]) => ({ device, count })),
            countries: Object.entries(countryMap).map(([country, count]) => ({ country, count })),
          };
        }

        return undefined;
      },
      onUpdate: (callback: () => void) => {
        listeners.add(callback);
        return () => {
          listeners.delete(callback);
        };
      },
      journal: () => undefined,
    };
  };
}

if (typeof window !== "undefined" && (window as any).__PLAYWRIGHT_MOCK__) {
  setupConvexMock(convexClient);
}
