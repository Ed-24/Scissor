import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Info, LayoutDashboard, Link2, LogIn, LogOut, Sparkles, User } from "lucide-react";
import { useAuthContext } from "../context/useAuthContext";

export default function RootLayout() {
  const { isSignedIn, user, signOut, isMock } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#050407] text-slate-100 flex flex-col font-sans relative">
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-indigo-900/10 blur-[100px] pointer-events-none" />

      <header className="sticky top-0 z-40 border-b border-purple-500/10 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
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
              onClick={() => navigate("/")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                isActive("/")
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Shorten
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                isActive("/dashboard")
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
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
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/sign-in")}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {isMock && (
        <div className="bg-purple-950/20 border-b border-purple-500/10 text-center py-2 px-4 text-xs text-purple-300 flex items-center justify-center gap-1.5 animate-in fade-in duration-300">
          <Info className="w-3.5 h-3.5" />
          <span>
            Scissor is running in <strong>Local Demo Mode</strong>. Data stays in your browser until you connect Convex.
          </span>
        </div>
      )}

      <main className="flex-1 flex flex-col justify-start relative z-10 w-full">
        <Outlet />
      </main>

      <footer className="py-6 border-t border-purple-500/5 text-center text-xs text-slate-600 bg-slate-950/20">
        <p>(c) 2026 Scissor Inc. Fast, minimal, and secure branded link shortener.</p>
      </footer>
    </div>
  );
}
