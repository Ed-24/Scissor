import { type ReactNode } from "react";
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
  isMockMode,
  type AuthUser,
} from "./authCore";
import { ConvexProvider } from "convex/react";

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
    return (
      <ConvexProvider client={convexClient}>
        <AuthContext.Provider
          value={{
            isLoaded: true,
            isSignedIn: false,
            isMock: true,
            user: null,
            signOut: async () => {},
            openSignIn: () => {},
            openSignUp: () => {},
          }}
        >
          {children}
        </AuthContext.Provider>
      </ConvexProvider>
    );
  }

  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen bg-[#011F23] flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <h2 className="text-2xl font-display font-bold text-white mb-4">Configuration Required</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Please add your <code className="bg-white/10 px-1.5 py-0.5 rounded">VITE_CLERK_PUBLISHABLE_KEY</code> to your <code className="bg-white/10 px-1.5 py-0.5 rounded">.env.local</code> file to enable authentication.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convexClient} useAuth={useClerkAuth}>
        <ClerkAuthWrapper>{children}</ClerkAuthWrapper>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
