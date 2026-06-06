import { ArrowRight, BadgeCheck, BarChart3, Link2, QrCode, ShieldCheck, Sparkles } from "lucide-react";
import { useAuthContext } from "../context/useAuthContext";

const featureCards = [
  {
    icon: Link2,
    title: "Custom branded slugs",
    description: "Claim clean, memorable short links that are easy to trust and easy to share.",
  },
  {
    icon: QrCode,
    title: "Downloadable QR codes",
    description: "Generate polished QR codes with logo overlays, color control, and SVG/PNG exports.",
  },
  {
    icon: BarChart3,
    title: "Realtime analytics",
    description: "Watch clicks, referrers, geographies, and devices update live as traffic arrives.",
  },
];

const trustSignals = [
  "Clerk authentication",
  "Convex reactive data",
  "302 redirects for accuracy",
  "Phishing blocklist enforced server-side",
];

export default function PublicLanding() {
  const { openSignIn, openSignUp } = useAuthContext();

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(33,94,104,0.28),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(92,147,150,0.16),transparent_30%),linear-gradient(180deg,#013137_0%,#011d21_100%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-soft-500/40 to-transparent" />

      <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-7xl flex-col justify-center px-4 py-16 lg:flex-row lg:items-center lg:gap-12">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-soft-500/20 bg-white/5 px-4 py-2 text-xs font-semibold text-light-200">
            <Sparkles className="h-4 w-4" />
            Fast, minimal, trust-inspiring link management
          </div>

          <h1 className="mt-6 text-5xl font-display font-extrabold tracking-tight text-white sm:text-6xl">
            Short links that look good and track everything
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            Create branded short URLs, QR codes, and realtime analytics from one clean dashboard. Scissor is built for
            teams that care about speed, trust, and reliable click data.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openSignUp}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary-600 to-accent-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-950/30 transition hover:from-accent-500 hover:to-primary-500"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={openSignIn}
              className="inline-flex items-center gap-2 rounded-2xl border border-soft-500/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-primary-500/30 hover:bg-white/10"
            >
              Sign In
            </button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {trustSignals.map((signal) => (
              <div
                key={signal}
                className="flex items-center gap-2 rounded-2xl border border-soft-500/15 bg-white/5 px-4 py-3 text-sm text-slate-300"
              >
                <BadgeCheck className="h-4 w-4 text-soft-300" />
                {signal}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 grid w-full max-w-xl gap-4 lg:mt-0">
          <div className="grid gap-4 sm:grid-cols-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="rounded-3xl border border-soft-500/15 bg-white/5 p-5 backdrop-blur-xl transition hover:border-primary-500/25 hover:bg-white/7"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-soft-500/20 bg-primary-500/10 text-light-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-white">{feature.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
                </article>
              );
            })}
          </div>

          <div className="rounded-[2rem] border border-soft-500/15 bg-dark-900/80 p-6 shadow-2xl shadow-primary-950/30 backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/8 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-soft-200">Production ready</p>
                <h3 className="mt-2 text-2xl font-display font-bold text-white">Built for Vercel + Convex</h3>
              </div>
              <ShieldCheck className="h-8 w-8 text-soft-300" />
            </div>

            <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              <div className="rounded-2xl border border-soft-500/15 bg-white/5 p-4">
                <p className="font-semibold text-white">302 redirect strategy</p>
                <p className="mt-1 text-slate-400">Prevents browser caching from distorting click analytics.</p>
              </div>
              <div className="rounded-2xl border border-soft-500/15 bg-white/5 p-4">
                <p className="font-semibold text-white">Reactive dashboards</p>
                <p className="mt-1 text-slate-400">Convex updates tables and charts automatically as traffic changes.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
