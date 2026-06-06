import { createContext } from "react";
import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL || "http://localhost:3210";

export const convexClient = new ConvexReactClient(convexUrl);

export interface AuthUser {
  id: string;
  fullName: string | null;
  primaryEmailAddress: string | null;
  imageUrl: string | null;
}

export interface AuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  isMock: boolean;
  user: AuthUser | null;
  signOut: () => Promise<void>;
  openSignIn: () => void;
  openSignUp: () => void;
}

export interface MockLinkRecord {
  _id: string;
  slug: string;
  originalUrl: string;
  userId?: string;
  anonymousClientId?: string;
  createdAt: number;
  expiresAt?: number;
  status: "active" | "expired";
  clickCount: number;
}

export interface MockClickRecord {
  _id: string;
  linkId: string;
  timestamp: number;
  referrer: string;
  country: string;
  device: string;
  visitorKey: string;
}

export interface MockState {
  links: MockLinkRecord[];
  clicks: MockClickRecord[];
  currentUser: AuthUser | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_WINDOW_PREFIX = "scissor-mock-state:";

function readMockStateFromWindow(): MockState | null {
  if (typeof window === "undefined" || !window.name.startsWith(MOCK_WINDOW_PREFIX)) {
    return null;
  }

  try {
    return JSON.parse(window.name.slice(MOCK_WINDOW_PREFIX.length)) as MockState;
  } catch {
    return null;
  }
}

export function persistMockState(state: MockState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.name = `${MOCK_WINDOW_PREFIX}${JSON.stringify(state)}`;
}

export function createMockUser(displayName: string): AuthUser {
  const safeName = displayName.trim() || "Scissor User";
  const normalized = safeName.toLowerCase().replace(/[^a-z0-9]/g, "");

  return {
    id: `mock_${normalized || "user"}`,
    fullName: safeName,
    primaryEmailAddress: `${normalized || "user"}@example.com`,
    imageUrl: null,
  };
}

export function getMockState(): MockState {
  const root = window as Window & { __SCISSOR_MOCK_STATE__?: MockState };
  if (!root.__SCISSOR_MOCK_STATE__) {
    root.__SCISSOR_MOCK_STATE__ = readMockStateFromWindow() ?? {
      links: [],
      clicks: [],
      currentUser: null,
    };
    persistMockState(root.__SCISSOR_MOCK_STATE__);
  }
  return root.__SCISSOR_MOCK_STATE__;
}

function setupConvexMock(client: ConvexReactClient) {
  const listeners = new Set<() => void>();
  const notify = () => {
    listeners.forEach((listener) => listener());
  };

  const getPath = (funcRef: any) => funcRef?._toApiString || funcRef?.name || String(funcRef);
  const getState = () => getMockState();

  (client as any).mutation = async (funcRef: any, args: any) => {
    const path = getPath(funcRef);
    const state = getState();

    if (path.includes("create")) {
      const slug = args.customSlug || Math.random().toString(36).slice(2, 8);

      if (args.customSlug && state.links.some((link) => link.slug === args.customSlug)) {
        throw new Error("This custom slug is already taken.");
      }

      const now = Date.now();
      const record: MockLinkRecord = {
        _id: `link_${Math.random().toString(36).slice(2, 10)}`,
        slug,
        originalUrl: args.originalUrl,
        userId: state.currentUser?.id,
        createdAt: now,
        expiresAt: args.expiresAt,
        status: "active",
        clickCount: 0,
      };

      state.links.unshift(record);
      persistMockState(state);
      notify();
      return { linkId: record._id, slug: record.slug };
    }

    if (path.includes("deleteLink")) {
      state.links = state.links.filter((link) => link._id !== args.id);
      state.clicks = state.clicks.filter((click) => click.linkId !== args.id);
      persistMockState(state);
      notify();
      return null;
    }

    if (path.includes("bulkDelete")) {
      const ids = new Set<string>(args.ids);
      state.links = state.links.filter((link) => !ids.has(link._id));
      state.clicks = state.clicks.filter((click) => !ids.has(click.linkId));
      persistMockState(state);
      notify();
      return null;
    }

    if (path.includes("trackClick")) {
      const now = Date.now();
      const click = {
        _id: `click_${Math.random().toString(36).slice(2, 10)}`,
        linkId: args.linkId,
        timestamp: now,
        referrer: args.referrer || "Direct",
        country: args.country || "US",
        device: args.device || "Desktop",
        visitorKey: args.visitorKey || "mock-visitor",
      };

      state.clicks.unshift(click);
      const link = state.links.find((candidate) => candidate._id === args.linkId);
      if (link) {
        link.clickCount += 1;
      }
      persistMockState(state);
      notify();
      return null;
    }

    if (path.includes("expireLink")) {
      const link = state.links.find((candidate) => candidate.slug === args.slug);
      if (link) {
        link.status = "expired";
      }
      persistMockState(state);
      notify();
      return null;
    }

    throw new Error(`Unknown mock mutation: ${path}`);
  };

  client.watchQuery = (funcRef: any, args: any) => {
    const path = getPath(funcRef);

    return {
      localQueryResult: () => {
        if (args === "skip") {
          return undefined;
        }

        const state = getState();

        if (path.includes("checkSlugAvailable")) {
          const slug = String(args.slug || "").trim();
          return !state.links.some((link) => link.slug === slug);
        }

        if (path.includes("listUserLinks")) {
          const userId = state.currentUser?.id;
          return state.links
            .filter((link) => (userId ? link.userId === userId : true))
            .map((link) => ({ ...link }));
        }

        if (path.includes("getLinkAnalytics")) {
          const linkClicks = state.clicks.filter((click) => click.linkId === args.linkId);
          const clicksByDate: Record<string, number> = {};
          const referrers: Record<string, number> = {};
          const devices: Record<string, number> = {};
          const countries: Record<string, number> = {};

          linkClicks.forEach((click) => {
            const dateKey = new Date(click.timestamp).toISOString().slice(0, 10);
            clicksByDate[dateKey] = (clicksByDate[dateKey] || 0) + 1;
            referrers[click.referrer] = (referrers[click.referrer] || 0) + 1;
            devices[click.device] = (devices[click.device] || 0) + 1;
            countries[click.country] = (countries[click.country] || 0) + 1;
          });

          return {
            totalClicks: linkClicks.length,
            uniqueClicks: new Set(linkClicks.map((click) => click.visitorKey)).size,
            clicksOverTime: Object.entries(clicksByDate).map(([date, count]) => ({ date, count })),
            referrers: Object.entries(referrers).map(([referrer, count]) => ({ referrer, count })),
            devices: Object.entries(devices).map(([device, count]) => ({ device, count })),
            countries: Object.entries(countries).map(([country, count]) => ({ country, count })),
          };
        }

        return undefined;
      },
      onUpdate: (callback: () => void) => {
        listeners.add(callback);
        return () => listeners.delete(callback);
      },
      journal: () => undefined,
    };
  };
}

export function isMockMode(): boolean {
  return typeof window !== "undefined" && (window as Window & { __PLAYWRIGHT_MOCK__?: boolean }).__PLAYWRIGHT_MOCK__ === true;
}

if (typeof window !== "undefined" && isMockMode()) {
  setupConvexMock(convexClient);
}
