import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="relative z-10 flex min-h-full w-full items-center justify-center overflow-hidden bg-[#c8c6d7] px-4 py-10 animate-in fade-in duration-500">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.45),_transparent_32%),linear-gradient(180deg,_rgba(255,255,255,0.16),_rgba(255,255,255,0.02))]" />
      <div className="pointer-events-none absolute left-1/2 top-[56%] h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-8">
        <section className="max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#5b4c73]">Scissor URL shortener</p>
          <h1 className="mt-4 text-4xl font-display font-extrabold leading-tight text-[#3d245d] sm:text-5xl">
            Shorten links, add QR codes, and track clicks in one calm workspace.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[#5b4c73] sm:text-lg">
            Create branded short links with custom slugs, calendar-based expiry, and private analytics. Everything is built to
            stay simple, fast, and easy to use.
          </p>
          <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-[#d8cfee] bg-white/60 p-5 shadow-lg shadow-[#b79bdb]/10 backdrop-blur-xl">
              <p className="text-sm font-semibold text-[#3d245d]">Custom slugs</p>
              <p className="mt-2 text-sm leading-7 text-[#5b4c73]">Pick a short, memorable ending that matches your brand or campaign.</p>
            </div>
            <div className="rounded-[1.5rem] border border-[#d8cfee] bg-white/60 p-5 shadow-lg shadow-[#b79bdb]/10 backdrop-blur-xl">
              <p className="text-sm font-semibold text-[#3d245d]">Expiry dates</p>
              <p className="mt-2 text-sm leading-7 text-[#5b4c73]">Choose a date from the calendar and let the link expire automatically.</p>
            </div>
            <div className="rounded-[1.5rem] border border-[#d8cfee] bg-white/60 p-5 shadow-lg shadow-[#b79bdb]/10 backdrop-blur-xl">
              <p className="text-sm font-semibold text-[#3d245d]">QR and analytics</p>
              <p className="mt-2 text-sm leading-7 text-[#5b4c73]">Generate QR codes and review clicks, devices, and referrers from the dashboard.</p>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/sign-in"
            className="rounded-2xl bg-[#783f8e] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#783f8e]/20 transition hover:bg-[#652f79]"
          >
            Sign In
          </Link>
          <Link
            to="/sign-up"
            className="rounded-2xl border border-[#d8cfee] bg-white/70 px-8 py-3.5 text-sm font-semibold text-[#4a4063] transition hover:bg-white"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
