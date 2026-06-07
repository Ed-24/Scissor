import { createContext } from "react";
import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

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

const ANON_CLIENT_ID_KEY = "scissor-anonymous-client-id";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function isMockMode(): boolean {
  return typeof window !== "undefined" && (window as Window & { __PLAYWRIGHT_MOCK__?: boolean }).__PLAYWRIGHT_MOCK__ === true;
}

export function getAnonymousClientId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  const storageKey = ANON_CLIENT_ID_KEY;
  const existing = window.localStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `anon_${crypto.randomUUID()}`
      : `anon_${Math.random().toString(36).slice(2, 12)}`;

  window.localStorage.setItem(storageKey, generated);
  return generated;
}
