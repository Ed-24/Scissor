import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { useAuthContext } from "../context/useAuthContext";
import { getAnonymousClientId } from "../context/authCore";
import { buildShortUrl } from "../lib/shortUrl";
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

const COUNTRY_COORDS: Record<string, { lat: number; lon: number }> = {
  US: { lat: 39.8, lon: -98.6 },
  IN: { lat: 20.6, lon: 78.9 },
  GB: { lat: 55.0, lon: -3.5 },
  CA: { lat: 56.1, lon: -106.3 },
  AU: { lat: -25.3, lon: 133.8 },
  DE: { lat: 51.2, lon: 10.4 },
  FR: { lat: 46.2, lon: 2.2 },
  NL: { lat: 52.1, lon: 5.3 },
  SG: { lat: 1.35, lon: 103.8 },
  BR: { lat: -14.2, lon: -51.9 },
};

function projectCoordinates(lat: number, lon: number, width: number, height: number) {
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

function getMarkerRadius(count: number, maxCount: number) {
  const minRadius = 7;
  const maxRadius = 28;
  if (maxCount <= 0) {
    return minRadius;
  }

  return minRadius + ((maxRadius - minRadius) * count) / maxCount;
}

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
  const shortUrl = selectedLink ? buildShortUrl(selectedLink.slug) : "";

  if (!isSignedIn) {
    return (
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center px-4 py-16">
        <div className="rounded-[2rem] border border-[#d8cfee] bg-white/65 p-8 text-center shadow-2xl shadow-[#b79bdb]/10 backdrop-blur-2xl">
          <h2 className="text-3xl font-display font-extrabold text-[#3d245d]">Sign in to view analytics</h2>
          <p className="mt-3 text-sm leading-7 text-[#5b4c73]">
            Analytics are private and only available to the signed-in owner of the short link.
          </p>
        </div>
      </div>
    );
  }

  if (analytics === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-16">
        <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-[#d8cfee] bg-white/65 px-8 py-10 text-center shadow-2xl shadow-[#b79bdb]/10 backdrop-blur-2xl">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d8cfee] border-t-[#783f8e]" />
          <p className="text-sm font-medium text-[#5b4c73]">Loading realtime analytics...</p>
        </div>
      </div>
    );
  }

  const { totalClicks, uniqueClicks, clicksOverTime, referrers, devices, countries } = analytics;
  const topCountry = countries[0];
  const topReferrer = referrers[0];
  const mappedCountries = countries
    .map((country) => {
      const code = country.country.toUpperCase();
      const coords = COUNTRY_COORDS[code];
      if (!coords) {
        return null;
      }

      return {
        ...country,
        code,
        name: COUNTRY_NAMES[code] ?? code,
        coords,
      };
    })
    .filter((country): country is { country: string; count: number; code: string; name: string; coords: { lat: number; lon: number } } => Boolean(country));
  const maxCountryCount = Math.max(...mappedCountries.map((country) => country.count), 1);
  const mapWidth = 1200;
  const mapHeight = 600;

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

          <section className="rounded-[2rem] border border-[#d8cfee] bg-white/65 p-5 shadow-2xl shadow-[#b79bdb]/10 backdrop-blur-2xl lg:col-span-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              <Globe className="h-4 w-4 text-soft-200" />
              Geographic map
            </h3>
            <div className="mt-4 grid gap-5 xl:grid-cols-[1.4fr,1fr]">
              <div className="overflow-hidden rounded-[2rem] border border-[#d8cfee] bg-[#f8f5fd] p-3">
                <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="h-auto w-full rounded-[1.5rem] bg-[#f8f5fd]">
                  <defs>
                    <linearGradient id="map-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#ece4f6" stopOpacity="0.6" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width={mapWidth} height={mapHeight} rx="32" fill="url(#map-glow)" />
                  {Array.from({ length: 5 }).map((_, index) => (
                    <line
                      key={`lat-${index}`}
                      x1="0"
                      x2={mapWidth}
                      y1={(mapHeight / 6) * (index + 1)}
                      y2={(mapHeight / 6) * (index + 1)}
                      stroke="#d8cfee"
                      strokeOpacity="0.55"
                      strokeDasharray="10 12"
                    />
                  ))}
                  {Array.from({ length: 7 }).map((_, index) => (
                    <line
                      key={`lon-${index}`}
                      y1="0"
                      y2={mapHeight}
                      x1={(mapWidth / 8) * (index + 1)}
                      x2={(mapWidth / 8) * (index + 1)}
                      stroke="#d8cfee"
                      strokeOpacity="0.45"
                      strokeDasharray="10 12"
                    />
                  ))}
                  <path
                    d="M 90 210 C 190 140, 320 120, 410 150 C 460 170, 490 220, 470 270 C 440 320, 360 340, 280 320 C 210 300, 150 260, 90 210 Z"
                    fill="#d8cfee"
                    fillOpacity="0.55"
                  />
                  <path
                    d="M 455 170 C 560 130, 690 130, 780 180 C 840 215, 865 260, 830 300 C 785 350, 680 360, 585 325 C 510 298, 460 240, 455 170 Z"
                    fill="#c8c6d7"
                    fillOpacity="0.55"
                  />
                  <path
                    d="M 770 335 C 835 300, 930 310, 1000 360 C 1045 392, 1060 445, 1020 475 C 955 525, 845 520, 780 465 C 735 425, 735 360, 770 335 Z"
                    fill="#bfacc8"
                    fillOpacity="0.6"
                  />
                  {mappedCountries.map((country, index) => {
                    const { x, y } = projectCoordinates(country.coords.lat, country.coords.lon, mapWidth, mapHeight);
                    const percentage = Math.max(0, Math.round((country.count / totalClicks) * 100));
                    const radius = getMarkerRadius(country.count, maxCountryCount);
                    return (
                      <g key={country.code} data-testid={`country-${country.code}`}>
                        <circle
                          cx={x}
                          cy={y}
                          r={radius}
                          fill={COLORS[index % COLORS.length]}
                          fillOpacity="0.85"
                          stroke="#ffffff"
                          strokeWidth="4"
                        />
                        <circle cx={x} cy={y} r={Math.max(10, radius * 0.42)} fill="#ffffff" fillOpacity="0.9" />
                        <text
                          x={x}
                          y={y - radius - 16}
                          textAnchor="middle"
                          fontSize="22"
                          fill="#3d245d"
                          fontWeight="700"
                        >
                          {country.code}
                        </text>
                        <text x={x} y={y + radius + 26} textAnchor="middle" fontSize="16" fill="#5b4c73">
                          {percentage}%
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="space-y-4">
                <div className="rounded-[2rem] border border-[#d8cfee] bg-[#f8f5fd] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#783f8e]">Top country</p>
                  <p className="mt-2 text-xl font-display font-bold text-[#3d245d]">
                    {topCountry ? COUNTRY_NAMES[topCountry.country.toUpperCase()] ?? topCountry.country.toUpperCase() : "N/A"}
                  </p>
                </div>

                <div id="countries-list" className="space-y-4">
                  {countries.map((country) => {
                    const percentage = Math.max(0, Math.round((country.count / totalClicks) * 100));
                    const countryName = COUNTRY_NAMES[country.country.toUpperCase()] ?? country.country.toUpperCase();
                    return (
                      <div key={country.country} data-testid={`country-${country.country}`} className="space-y-2">
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <div className="min-w-0">
                            <p className="font-semibold text-[#3d245d]">
                              <span className="font-mono text-[#7f7396]">{country.country.toUpperCase()}</span> {countryName}
                            </p>
                          </div>
                          <p className="font-mono text-[#5b4c73]">
                            {country.count} click{country.count === 1 ? "" : "s"} ({percentage}%)
                          </p>
                        </div>
                        <div className="h-2 rounded-full border border-[#d8cfee] bg-white/70">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#783f8e] to-[#4f1271]"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[#d8cfee] bg-white/65 p-5 shadow-2xl shadow-[#b79bdb]/10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7f7396]">Total clicks</p>
            <p className="mt-2 text-2xl font-display font-bold text-[#3d245d]">{totalClicks}</p>
          </div>
          <div className="rounded-[1.5rem] border border-[#d8cfee] bg-white/65 p-5 shadow-2xl shadow-[#b79bdb]/10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7f7396]">Unique clicks</p>
            <p className="mt-2 text-2xl font-display font-bold text-[#3d245d]">{uniqueClicks}</p>
          </div>
          <div className="rounded-[1.5rem] border border-[#d8cfee] bg-white/65 p-5 shadow-2xl shadow-[#b79bdb]/10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7f7396]">Top referrer</p>
            <p className="mt-2 text-2xl font-display font-bold text-[#3d245d]">{topReferrer ? topReferrer.referrer : "N/A"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
