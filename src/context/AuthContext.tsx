import { useState, type ReactNode } from "react";
import { ConvexProvider } from "convex/react";
import {
  ClerkProvider,
  useAuth as useClerkAuth,
  useClerk,
  useUser as useClerkUser,
} from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import {
  AuthContext,
  convexClient,
  createMockUser,
  isMockMode,
  getMockState,
  persistMockState,
  type AuthUser,
} from "./authCore";

function MockAuthProvider({ children }: { children: ReactNode }) {
  const state = getMockState();
  const [, forceRender] = useState(0);
  const isLoaded = true;
  const isSignedIn = state.currentUser !== null;

  return (
    <AuthContext.Provider
      value={{
        isLoaded,
        isSignedIn,
        isMock: true,
        user: state.currentUser,
        signOut: async () => {
          state.currentUser = null;
          persistMockState(state);
          forceRender((value) => value + 1);
        },
        openSignIn: () => {
          state.currentUser = createMockUser("Scissor Demo User");
          persistMockState(state);
          forceRender((value) => value + 1);
        },
        openSignUp: () => {
          state.currentUser = createMockUser("Scissor Demo User");
          persistMockState(state);
          forceRender((value) => value + 1);
        },
      }}
    >
      <ConvexProvider client={convexClient}>{children}</ConvexProvider>
    </AuthContext.Provider>
  );
}

function ClerkAuthWrapper({ children }: { children: ReactNode }) {
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth();
  const clerk = useClerk();
  const { user: clerkUser } = useClerkUser();

  const user: AuthUser | null = clerkUser
    ? {
        id: clerkUser.id,
        fullName: clerkUser.fullName,
        primaryEmailAddress: clerkUser.primaryEmailAddress?.emailAddress || null,
        imageUrl: clerkUser.imageUrl || null,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        isLoaded: clerkLoaded,
        isSignedIn: !!isSignedIn,
        isMock: false,
        user,
        signOut: async () => {
          await clerk.signOut();
        },
        openSignIn: () => clerk.openSignIn(),
        openSignUp: () => clerk.openSignUp(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function UnifiedAuthProvider({ children }: { children: ReactNode }) {
  if (isMockMode()) {
    if (!CLERK_PUBLISHABLE_KEY) {
      console.warn("Scissor: Missing VITE_CLERK_PUBLISHABLE_KEY. Falling back to Demo Mode.");
    }
    return <MockAuthProvider>{children}</MockAuthProvider>;
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY!}>
      <ConvexProviderWithClerk client={convexClient} useAuth={useClerkAuth}>
        <ClerkAuthWrapper>{children}</ClerkAuthWrapper>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
