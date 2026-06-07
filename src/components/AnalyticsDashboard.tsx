import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { useAuthContext } from "../context/useAuthContext";
import { getAnonymousClientId } from "../context/authCore";
import { ArrowLeft, Calendar, ExternalLink, Globe, Link2, Smartphone } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsDashboardProps {
  linkId: Id<"links">;
  onBack: () => void;
}

type LinkRow = Doc<"links"> & { clickCount: number };

interface ChartPoint {
  date: string;
  count: number;
}

interface CategoryPoint {
  referrer: string;
  count: number;
}

interface DevicePoint {
  device: string;
  count: number;
}

interface CountryPoint {
  country: string;
  count: number;
}

interface AnalyticsResponse {
  totalClicks: number;
  uniqueClicks: number;
  clicksOverTime: ChartPoint[];
  referrers: CategoryPoint[];
  devices: DevicePoint[];
  countries: CountryPoint[];
}

const COLORS = ["#4A4063", "#BFACC8", "#C8C6D7", "#783F8E", "#4F1271", "#5C2570", "#24183A"];

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  IN: "India",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  NL: "Netherlands",
  SG: "Singapore",
  BR: "Brazil",
};

function TooltipCard({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number | string }>; label?: string | number }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
      <div className="rounded-2xl border border-white/8 bg-[#24183a]/95 px-3 py-2 text-xs text-slate-100 shadow-2xl">
      <p className="text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-light-200">Clicks: {Number(payload[0]?.value ?? 0)}</p>
    </div>
  );
}

export default function AnalyticsDashboard({ linkId, onBack }: AnalyticsDashboardProps) {
  const { isSignedIn } = useAuthContext();
  const anonymousClientId = getAnonymousClientId();
  const links = useQuery(api.links.listUserLinks, { anonymousClientId }) as LinkRow[] | undefined;
  const analytics = useQuery(api.clicks.getLinkAnalytics, { linkId, anonymousClientId }) as AnalyticsResponse | undefined;

  const selectedLink = useMemo(() => links?.find((link) => link._id === linkId), [links, linkId]);
  const shortUrl = selectedLink ? `${window.location.origin}/s/${selectedLink.slug}` : "";

  if (!isSignedIn) {
    return (
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center px-4 py-16">
        <div className="rounded-[2rem] border border-white/8 bg-white/5 p-8 text-center backdrop-blur-2xl">
          <h2 className="text-3xl font-display font-extrabold text-white">Sign in to view analytics</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Analytics are private and only available to the signed-in owner of the short link.
          </p>
        </div>
      </div>
    );
  }

  if (analytics === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-16">
        <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-white/8 bg-white/5 px-8 py-10 text-center backdrop-blur-2xl">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-300">Loading realtime analytics...</p>
        </div>
      </div>
    );
  }

  const { totalClicks, uniqueClicks, clicksOverTime, referrers, devices, countries } = analytics;
  const topCountry = countries[0];
  const topReferrer = referrers[0];

  return (
    <div id="analytics-container" className="mx-auto w-full max-w-7xl px-4 py-10">
      <div className="flex flex-col gap-6">
        <button
          id="back-to-links"
          type="button"
          onClick={onBack}
          className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/8 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to links
        </button>

        <div className="rounded-[2rem] border border-white/8 bg-white/5 p-6 backdrop-blur-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-soft-200">Analytics</p>
              <h2 className="mt-2 text-3xl font-display font-extrabold text-white">Realtime click performance</h2>
              {selectedLink ? (
                <div className="mt-3 flex flex-col gap-2 text-sm text-slate-400 sm:flex-row sm:items-center">
                  <span className="font-mono text-light-200">{shortUrl}</span>
                  <span className="hidden text-slate-600 sm:inline">-&gt;</span>
                  <a
                    href={selectedLink.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-full items-center gap-1 truncate transition hover:text-white"
                    title={selectedLink.originalUrl}
                  >
                    {selectedLink.originalUrl}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-[#09080d] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Total clicks</p>
                <p id="total-clicks-count" className="mt-2 text-3xl font-display font-bold text-white">
                  {totalClicks}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-[#09080d] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Unique clicks</p>
                <p id="unique-clicks-count" className="mt-2 text-3xl font-display font-bold text-white">
                  {uniqueClicks}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-[#09080d] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Top country</p>
                <p className="mt-2 text-lg font-semibold text-white">{topCountry ? COUNTRY_NAMES[topCountry.country.toUpperCase()] ?? topCountry.country.toUpperCase() : "N/A"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-white/8 bg-white/5 p-5 backdrop-blur-2xl">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              <Calendar className="h-4 w-4 text-soft-200" />
              Clicks over time
            </h3>
            <div className="mt-4 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={clicksOverTime} margin={{ top: 10, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#b8a8ca" tickLine={false} fontSize={11} />
                  <YAxis stroke="#b8a8ca" tickLine={false} allowDecimals={false} fontSize={11} />
                  <Tooltip content={<TooltipCard />} />
                  <Line type="monotone" dataKey="count" stroke="#783f8e" strokeWidth={3} dot={{ r: 4, fill: "#4f1271" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/8 bg-white/5 p-5 backdrop-blur-2xl">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              <Link2 className="h-4 w-4 text-soft-200" />
              Top referrers
            </h3>
            <div className="mt-4 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={referrers} margin={{ top: 10, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <XAxis dataKey="referrer" stroke="#b8a8ca" tickLine={false} fontSize={11} />
                  <YAxis stroke="#b8a8ca" tickLine={false} allowDecimals={false} fontSize={11} />
                  <Tooltip content={<TooltipCard />} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {referrers.map((entry, index) => (
                      <Cell key={entry.referrer} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/8 bg-white/5 p-5 backdrop-blur-2xl">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              <Smartphone className="h-4 w-4 text-soft-200" />
              Device breakdown
            </h3>
            <div className="mt-4 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={devices} dataKey="count" nameKey="device" cx="50%" cy="50%" outerRadius={92} labelLine={false}>
                    {devices.map((entry, index) => (
                      <Cell key={entry.device} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/8 bg-white/5 p-5 backdrop-blur-2xl">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              <Globe className="h-4 w-4 text-soft-200" />
              Geographic summary
            </h3>
            <div id="countries-list" className="mt-4 space-y-4">
              {countries.map((country) => {
                const percentage = Math.max(0, Math.round((country.count / totalClicks) * 100));
                const countryName = COUNTRY_NAMES[country.country.toUpperCase()] ?? country.country.toUpperCase();
                return (
                  <div key={country.country} data-testid={`country-${country.country}`} className="space-y-2">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <div className="min-w-0">
                        <p className="font-semibold text-white">
                          <span className="font-mono text-slate-500">{country.country.toUpperCase()}</span> {countryName}
                        </p>
                      </div>
                      <p className="font-mono text-slate-300">
                        {country.count} click{country.count === 1 ? "" : "s"} ({percentage}%)
                      </p>
                    </div>
                    <div className="h-2 rounded-full border border-white/8 bg-[#09080d]">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary-600 to-accent-500" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total clicks</p>
            <p className="mt-2 text-2xl font-display font-bold text-white">{totalClicks}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Unique clicks</p>
            <p className="mt-2 text-2xl font-display font-bold text-white">{uniqueClicks}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Top referrer</p>
            <p className="mt-2 text-2xl font-display font-bold text-white">{topReferrer ? topReferrer.referrer : "N/A"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
