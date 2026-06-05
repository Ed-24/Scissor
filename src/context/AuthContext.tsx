import { useState, type ReactNode } from "react";
import { ConvexProvider } from "convex/react";
import { ClerkProvider, useAuth as useClerkAuth, useUser as useClerkUser } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import {
  AuthContext,
  convexClient,
  createMockUser,
  getOrCreateAnonymousId,
  loadMockUser,
  type AuthUser,
} from "./authCore";

function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadMockUser());
  const [anonymousId] = useState(getOrCreateAnonymousId);
  const isLoaded = true;
  const isSignedIn = user !== null;

  const signInMock = (username: string) => {
    const mockUser = createMockUser(username);
    localStorage.setItem("scissor_mock_user", JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const signOut = async () => {
    localStorage.removeItem("scissor_mock_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoaded,
        isSignedIn,
        user,
        anonymousId,
        signOut,
        signInMock,
        isMock: true,
      }}
    >
      <ConvexProvider client={convexClient}>{children}</ConvexProvider>
    </AuthContext.Provider>
  );
}

// 4. Wrapper component that handles Clerk Auth state
function ClerkAuthWrapper({ children }: { children: ReactNode }) {
  const { isLoaded: clerkLoaded, isSignedIn, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  const [anonymousId] = useState(getOrCreateAnonymousId);

  const user: AuthUser | null = clerkUser
    ? {
        id: clerkUser.id,
        fullName: clerkUser.fullName,
        primaryEmailAddress: clerkUser.primaryEmailAddress?.emailAddress || null,
      }
    : null;

  const signOut = async () => {
    await clerkSignOut();
  };

  return (
    <AuthContext.Provider
      value={{
        isLoaded: clerkLoaded,
        isSignedIn: !!isSignedIn,
        user,
        anonymousId,
        signOut,
        signInMock: () => {}, // No-op in Clerk mode
        isMock: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function UnifiedAuthProvider({ children }: { children: ReactNode }) {
  if (!CLERK_PUBLISHABLE_KEY) {
    return <MockAuthProvider>{children}</MockAuthProvider>;
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convexClient} useAuth={useClerkAuth}>
        <ClerkAuthWrapper>{children}</ClerkAuthWrapper>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
