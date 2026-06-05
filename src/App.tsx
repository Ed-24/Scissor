import { useEffect, useState, type FormEvent } from "react";
import { Info, LayoutDashboard, Link2, LogIn, LogOut, Sparkles, User, X } from "lucide-react";
import type { Id } from "../convex/_generated/dataModel";
import ShortenForm from "./components/ShortenForm";
import Dashboard from "./components/Dashboard";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import { UnifiedAuthProvider } from "./context/AuthContext";
import { useAuthContext } from "./context/useAuthContext";

function MainApp() {
  const { isSignedIn, user, signOut, signInMock, isMock } = useAuthContext();
  const [activeView, setActiveView] = useState<"shorten" | "dashboard" | "analytics">("shorten");
  const [selectedLinkId, setSelectedLinkId] = useState<Id<"links"> | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/s/")) {
      const slug = window.location.pathname.slice(3);
      if (slug) {
        try {
          const links = JSON.parse(localStorage.getItem("mock_convex_links") || "[]");
          const link = links.find((l: any) => l.slug === slug);
          if (link) {
            // Track click in mock clicks
            const clicks = JSON.parse(localStorage.getItem("mock_convex_clicks") || "[]");
            clicks.push({
              _id: `click_${Math.random().toString(36).slice(2, 9)}`,
              linkId: link._id,
              referrer: "Direct",
              country: "US",
              device: "Desktop",
              createdAt: Date.now(),
            });
            localStorage.setItem("mock_convex_clicks", JSON.stringify(clicks));

            // Perform redirect
            setTimeout(() => {
              window.location.href = link.originalUrl;
            }, 100);
          } else {
            document.body.innerHTML = `
              <div style="background:#050407;color:#f87171;font-family:sans-serif;height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;">
                <h1 style="margin:0;font-size:2rem;">404: Link Not Found</h1>
                <p style="color:#94a3b8;margin:0;">The short link with slug "${slug}" does not exist in local storage.</p>
                <a href="/" style="color:#a855f7;text-decoration:none;font-weight:bold;margin-top:12px;">Go Back to Scissor</a>
              </div>
            `;
          }
        } catch (e) {
          console.error("Failed to execute mock redirect", e);
        }
      }
    }
  }, []);

  const handleMockLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (usernameInput.trim()) {
      signInMock(usernameInput.trim());
      setUsernameInput("");
      setShowLoginModal(false);
      setActiveView("dashboard");
    }
  };

  const handleQuickLogin = () => {
    signInMock("Edith");
    setShowLoginModal(false);
    setActiveView("dashboard");
  };

  const handleViewAnalytics = (linkId: Id<"links">) => {
    setSelectedLinkId(linkId);
    setActiveView("analytics");
  };

  const handleSignOut = async () => {
    await signOut();
    setSelectedLinkId(null);
    setActiveView("shorten");
  };

  return (
    <div className="min-h-screen bg-[#050407] text-slate-100 flex flex-col font-sans relative">
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-indigo-900/10 blur-[100px] pointer-events-none" />

      <header className="sticky top-0 z-40 border-b border-purple-500/10 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveView("shorten")}>
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-900/20">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight font-display text-white flex items-center gap-1.5">
              Scissor
              <span className="text-[10px] uppercase bg-purple-500/20 text-purple-300 font-bold px-1.5 py-0.5 rounded border border-purple-500/20">
                URL
              </span>
            </h1>
          </div>

          <nav className="flex items-center gap-1.5 md:gap-3">
            <button
              onClick={() => setActiveView("shorten")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeView === "shorten"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
              id="nav-shorten"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Shorten Link
            </button>
            <button
              onClick={() => setActiveView("dashboard")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeView === "dashboard" || activeView === "analytics"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
              id="nav-dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-200">{user?.fullName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{user?.primaryEmailAddress}</span>
                </div>
                <div className="p-1.5 bg-slate-900 border border-slate-800 rounded-full text-purple-400">
                  <User className="w-4 h-4" />
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 hover:bg-red-950/20 border border-transparent hover:border-red-500/20 rounded-xl text-slate-400 hover:text-red-400 transition"
                  title="Sign Out"
                  id="sign-out-btn"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                id="sign-in-btn"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {isMock && (
        <div className="bg-purple-950/20 border-b border-purple-500/10 text-center py-2 px-4 text-xs text-purple-300 flex items-center justify-center gap-1.5 animate-[fadeIn_0.3s_ease]">
          <Info className="w-3.5 h-3.5" />
          <span>
            Scissor is running in <strong>Local Demo Mode</strong>. Data stays in your browser until you connect Convex.
          </span>
        </div>
      )}

      <main className="flex-1 flex flex-col justify-start relative z-10 w-full">
        {activeView === "shorten" && <ShortenForm />}
        {activeView === "dashboard" && <Dashboard onSelectLink={handleViewAnalytics} />}
        {activeView === "analytics" && selectedLinkId && (
          <AnalyticsDashboard linkId={selectedLinkId} onBack={() => setActiveView("dashboard")} />
        )}
      </main>

      <footer className="py-6 border-t border-purple-500/5 text-center text-xs text-slate-600 bg-slate-950/20">
        <p>(c) 2026 Scissor Inc. Fast, minimal, and secure branded link shortener.</p>
      </footer>

      {showLoginModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.15s_ease-out]"
          id="login-modal"
        >
          <div className="glass-card max-w-sm w-full rounded-2xl p-6 border border-purple-500/20 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-display text-white">Sign In to Scissor</h3>
              <button onClick={() => setShowLoginModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Scissor features a full real-time links dashboard. You can log in with a temporary username locally.
            </p>

            <form onSubmit={handleMockLogin} className="flex flex-col gap-3">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter display name"
                required
                className="w-full px-4 py-2.5 rounded-xl glass-input text-slate-200 text-sm font-sans"
                id="login-username-input"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                id="login-submit-btn"
              >
                Sign In
              </button>
            </form>

            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-[#0c0b10] px-2 text-slate-500">Or</span>
              </div>
            </div>

            <button
              onClick={handleQuickLogin}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition active:scale-98"
              id="login-quick-btn"
            >
              Sign In with Quick Demo Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <UnifiedAuthProvider>
      <MainApp />
    </UnifiedAuthProvider>
  );
}
