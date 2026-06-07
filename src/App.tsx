import { Routes, Route, Navigate } from "react-router-dom";
import { UnifiedAuthProvider } from "./context/AuthContext";
import { useAuthContext } from "./context/useAuthContext";
import { ToastProvider } from "./context/ToastContext";
import ToastStack from "./components/ToastStack";
import ErrorBoundary from "./components/ErrorBoundary";
import RootLayout from "./layouts/RootLayout";
import LandingPage from "./pages/LandingPage";
import ShortenPage from "./pages/ShortenPage";
import DashboardPage from "./pages/DashboardPage";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";
import RedirectHandler from "./components/RedirectHandler";
import type { ReactNode } from "react";

/**
 * ProtectedRoute component ensures only authenticated users can access specific routes.
 * If not signed in, it redirects to the sign-in page.
 */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuthContext();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#050407] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}

/**
 * AuthRedirect component ensures signed-in users don't see sign-in/sign-up pages.
 * If already signed in, it redirects to the dashboard.
 */
function AuthRedirect({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuthContext();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return <Navigate to="/shorten" replace />;
  }

  return <>{children}</>;
}

function MainApp() {
  return (
    <>
      <RedirectHandler />
      <ToastStack />
      <Routes>
        {/* Auth Pages (Redirect if already logged in) */}
        <Route
          path="/sign-in/*"
          element={
            <AuthRedirect>
              <SignInPage />
            </AuthRedirect>
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <AuthRedirect>
              <SignUpPage />
            </AuthRedirect>
          }
        />

        {/* Main App Layout */}
        <Route path="/" element={<RootLayout />}>
          {/* Public Route */}
          <Route index element={<LandingPage />} />
          <Route path="shorten" element={<ShortenPage />} />
          
          {/* Protected Dashboard Route */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <UnifiedAuthProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </UnifiedAuthProvider>
    </ErrorBoundary>
  );
}
