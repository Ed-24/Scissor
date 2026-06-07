import { Outlet, useLocation, useNavigate } from "react-router-dom";
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
    <div className="relative flex min-h-screen flex-col bg-[#c8c6d7] font-sans text-[#3d245d]">
      <div className="pointer-events-none absolute left-[18%] top-[-8%] h-[28rem] w-[28rem] rounded-full bg-white/35 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-[10%] right-[8%] h-[22rem] w-[22rem] rounded-full bg-white/25 blur-[100px]" />

      {location.pathname !== "/" && (
        <header className="sticky top-0 z-40 border-b border-[#d8cfee] bg-white/55 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <button className="flex items-center gap-3" onClick={() => navigate("/")}>

              <div className="text-left">
                <h1 className="text-xl font-extrabold tracking-tight font-display text-[#3d245d]">Scissor</h1>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#7f7396]">URL Shortener</p>
              </div>
            </button>

            <nav className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => navigate("/shorten")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  isActive("/shorten")
                    ? "bg-[#783f8e] text-white shadow-lg shadow-[#783f8e]/20"
                    : "border border-[#d8cfee] bg-white/60 text-[#5b4c73] hover:bg-white"
                }`}
              >
                Shorten
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  isActive("/dashboard")
                    ? "bg-[#783f8e] text-white shadow-lg shadow-[#783f8e]/20"
                    : "border border-[#d8cfee] bg-white/60 text-[#5b4c73] hover:bg-white"
                }`}
              >
                Dashboard
              </button>
            </nav>

            <div className="flex items-center gap-3">
              {isSignedIn ? (
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-xs font-bold text-[#3d245d]">{user?.fullName}</span>
                    <span className="text-[10px] font-mono text-[#7f7396]">{user?.primaryEmailAddress}</span>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8cfee] bg-white/75 text-[#783f8e]">
                    {user?.fullName?.[0] ?? "U"}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="rounded-xl border border-[#d8cfee] bg-white/60 px-3 py-2 text-xs font-bold text-[#5b4c73] transition hover:bg-white hover:text-[#3d245d]"
                    title="Sign Out"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/sign-in")}
                  className="rounded-xl border border-[#d8cfee] bg-white/60 px-4 py-2 text-xs font-bold text-[#5b4c73] transition hover:bg-white hover:text-[#3d245d]"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {isMock && (
        <div className="border-b border-[#d8cfee] bg-white/55 px-4 py-2 text-center text-xs text-[#5b4c73] backdrop-blur-2xl">
          Scissor is connected to your local data. Connect Convex to sync with shared backend data.
        </div>
      )}

      <main className="relative z-10 flex w-full flex-1 flex-col justify-start">
        <Outlet />
      </main>

      <footer className="border-t border-[#d8cfee] bg-white/45 py-6 text-center text-xs text-[#7f7396]">
        <p>(c) 2026 Scissor Inc. Fast, minimal, and secure branded link shortener.</p>
      </footer>
    </div>
  );
}
