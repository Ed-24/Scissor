import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { useAuthContext } from "../context/useAuthContext";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { ArrowLeft, BarChart3, Calendar, ExternalLink, Globe, Link2, Smartphone } from "lucide-react";

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
  clicksOverTime: ChartPoint[];
  referrers: CategoryPoint[];
  devices: DevicePoint[];
  countries: CountryPoint[];
}

interface TooltipContentProps {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string | number;
}

const COLORS = [
  "hsl(262, 83%, 58%)",
  "hsl(330, 90%, 60%)",
  "hsl(190, 90%, 50%)",
  "hsl(220, 90%, 60%)",
  "hsl(150, 70%, 50%)",
  "hsl(35, 90%, 55%)",
];

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  DE: "Germany",
  FR: "France",
  IN: "India",
  BR: "Brazil",
  AU: "Australia",
  JP: "Japan",
  CN: "China",
};

function AnalyticsTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono shadow-xl">
      <p className="text-slate-400 font-semibold">{label}</p>
      <p className="text-purple-300 font-bold mt-1">Clicks: {Number(payload[0]?.value ?? 0)}</p>
    </div>
  );
}

export default function AnalyticsDashboard({ linkId, onBack }: AnalyticsDashboardProps) {
  const { anonymousId, isSignedIn } = useAuthContext();
  const links = useQuery(api.links.listUserLinks, isSignedIn ? {} : { anonymousClientId: anonymousId }) as
    | LinkRow[]
    | undefined;
  const analytics = useQuery(
    api.clicks.getLinkAnalytics,
    isSignedIn ? { linkId } : { linkId, anonymousClientId: anonymousId }
  ) as AnalyticsResponse | undefined;

  const selectedLink = links?.find((link) => link._id === linkId);
  const shortUrl = selectedLink ? `${window.location.origin}/s/${selectedLink.slug}` : "";

  if (analytics === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-semibold">Loading real-time analytics...</p>
      </div>
    );
  }

  const { totalClicks, clicksOverTime, referrers, devices, countries } = analytics;

  if (totalClicks === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto py-10 px-4 flex flex-col gap-6" id="analytics-container">
        <button
          onClick={onBack}
          className="w-fit flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition border border-slate-800 active:scale-95"
          id="back-to-links"
          type="button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Links
        </button>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
            <div>
              <h2 className="text-3xl font-extrabold font-display text-white flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-purple-400" />
                Click Performance Analytics
              </h2>
              {selectedLink && (
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mt-2">
                  <span className="font-semibold text-purple-300 font-mono select-all">{shortUrl}</span>
                  <span className="text-slate-600">-&gt;</span>
                  <a
                    href={selectedLink.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white truncate max-w-[250px] inline-flex items-center gap-1 hover:underline"
                  >
                    {selectedLink.originalUrl}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 bg-purple-950/20 border border-purple-500/20 rounded-2xl flex flex-col items-center justify-center min-w-[150px]">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">Total Clicks</span>
              <span className="text-4xl font-extrabold font-mono text-white mt-1" id="total-clicks-count">
                {totalClicks}
              </span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-16 text-center border border-purple-500/10">
            <Globe className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
            <h3 className="text-xl font-bold font-display text-slate-300 mt-4">No click data yet</h3>
            <p className="text-sm text-slate-500 mt-1">
              This link has not been clicked yet. Share your short link to start logging visitor analytics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-10 px-4 flex flex-col gap-6" id="analytics-container">
      <div className="flex flex-col gap-4">
        <button
          onClick={onBack}
          className="w-fit flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition border border-slate-800 active:scale-95"
          id="back-to-links"
          type="button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Links
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
          <div>
            <h2 className="text-3xl font-extrabold font-display text-white flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-purple-400" />
              Click Performance Analytics
            </h2>
            {selectedLink && (
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mt-2">
                <span className="font-semibold text-purple-300 font-mono select-all">{shortUrl}</span>
                <span className="text-slate-600">-&gt;</span>
                <a
                  href={selectedLink.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white truncate max-w-[250px] inline-flex items-center gap-1 hover:underline"
                >
                  {selectedLink.originalUrl}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          <div className="p-4 bg-purple-950/20 border border-purple-500/20 rounded-2xl flex flex-col items-center justify-center min-w-[150px]">
            <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">Total Clicks</span>
            <span className="text-4xl font-extrabold font-mono text-white mt-1" id="total-clicks-count">
              {totalClicks}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="analytics-grid">
        <div className="glass-card rounded-2xl p-5 border border-purple-500/10 flex flex-col gap-4">
          <h3 className="text-sm font-extrabold font-display text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            Clicks Over Time
          </h3>
          <div className="h-[250px] w-full" id="clicks-over-time-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={clicksOverTime} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip content={<AnalyticsTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-brand-500)"
                  strokeWidth={3}
                  dot={{ fill: "var(--color-brand-500)", strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-purple-500/10 flex flex-col gap-4">
          <h3 className="text-sm font-extrabold font-display text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Link2 className="w-4 h-4 text-purple-400" />
            Referrals Breakdown
          </h3>
          <div className="h-[250px] w-full" id="referrers-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={referrers} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="referrer" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip content={<AnalyticsTooltip />} />
                <Bar dataKey="count" fill="var(--color-brand-500)" radius={[4, 4, 0, 0]}>
                  {referrers.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-purple-500/10 flex flex-col gap-4">
          <h3 className="text-sm font-extrabold font-display text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-purple-400" />
            Devices & User Agents
          </h3>
          <div className="h-[250px] w-full flex items-center justify-center" id="devices-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={devices}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="device"
                >
                  {devices.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-purple-500/10 flex flex-col gap-4">
          <h3 className="text-sm font-extrabold font-display text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-400" />
            Geographic Location
          </h3>
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[250px] pr-2 scroll-custom" id="countries-list">
            {countries.map((item) => {
              const percentage = Math.round((item.count / totalClicks) * 100);
              const countryName = COUNTRY_NAMES[item.country.toUpperCase()] ?? item.country.toUpperCase();

              return (
                <div key={item.country} className="flex flex-col gap-1.5" data-testid={`country-${item.country}`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 flex items-center gap-2">
                      <span className="text-base uppercase tracking-wider text-slate-500">{item.country}</span>
                      {countryName}
                    </span>
                    <span className="font-bold text-slate-300 font-mono">
                      {item.count} click{item.count > 1 ? "s" : ""} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
