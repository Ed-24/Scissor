import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { useAuthContext } from "../context/useAuthContext";
import { useToast } from "../context/ToastContext";
import { getAnonymousClientId } from "../context/authCore";
import { buildShortUrl } from "../lib/shortUrl";
import QRCodeDisplay from "./QRCodeDisplay";
import { BarChart3, Calendar, Check, Copy, Filter, QrCode, Search, ShieldAlert, Trash } from "lucide-react";
import { formatShortDate, formatRelativeDate, truncate } from "../lib/format";

interface DashboardProps {
  onSelectLink: (linkId: Id<"links">) => void;
}

type LinkRow = Doc<"links"> & { clickCount: number };

type StatusFilter = "all" | "active" | "expired";

export default function Dashboard({ onSelectLink }: DashboardProps) {
  const [now] = useState(() => Date.now());
  const { isSignedIn } = useAuthContext();
  const { toast } = useToast();
  const deleteLink = useMutation(api.links.deleteLink);
  const bulkDelete = useMutation(api.links.bulkDelete);
  const anonymousClientId = getAnonymousClientId();
  const links = useQuery(api.links.listUserLinks, isSignedIn ? { anonymousClientId } : { anonymousClientId }) as LinkRow[] | undefined;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<Id<"links">[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [copiedId, setCopiedId] = useState<Id<"links"> | null>(null);
  const [expandedQrId, setExpandedQrId] = useState<Id<"links"> | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const filteredLinks = useMemo(() => {
    if (!links) {
      return [];
    }

    const search = searchTerm.trim().toLowerCase();
    const startTimestamp = startDate ? new Date(startDate).getTime() : null;
    const endTimestamp = endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : null;

    return links.filter((link) => {
      const isExpired = link.status === "expired" || (link.expiresAt ? link.expiresAt <= now : false);
      const normalizedStatus = isExpired ? "expired" : "active";
      const matchesSearch = !search || link.slug.toLowerCase().includes(search) || link.originalUrl.toLowerCase().includes(search);
      const matchesStatus = statusFilter === "all" || statusFilter === normalizedStatus;
      const matchesStart = startTimestamp === null || link.createdAt >= startTimestamp;
      const matchesEnd = endTimestamp === null || link.createdAt <= endTimestamp;

      return matchesSearch && matchesStatus && matchesStart && matchesEnd;
    });
  }, [links, searchTerm, startDate, endDate, statusFilter, now]);

  const previewLink = useMemo(() => {
    if (!filteredLinks.length) {
      return null;
    }

    return filteredLinks.find((link) => link._id === expandedQrId) ?? filteredLinks[0];
  }, [filteredLinks, expandedQrId]);

  const totalClicks = filteredLinks.reduce((sum, link) => sum + (link.clickCount ?? 0), 0);
  const activeLinks = filteredLinks.filter((link) => link.status !== "expired" && (!link.expiresAt || link.expiresAt > now)).length;
  const expiredLinks = filteredLinks.length - activeLinks;

  const handleCopy = async (id: Id<"links">, shortUrl: string) => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedId(id);
      toast({
        title: "Short link copied",
        description: shortUrl,
        variant: "success",
      });
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast({
        title: "Copy failed",
        description: "Clipboard access was blocked by the browser.",
        variant: "error",
      });
    }
  };

  const handleDelete = async (id: Id<"links">) => {
    if (!window.confirm("Delete this short link and its analytics?")) {
      return;
    }

    setIsBusy(true);
    try {
      await deleteLink({ id, anonymousClientId });
      setSelectedIds((current) => current.filter((linkId) => linkId !== id));
      setExpandedQrId((current) => (current === id ? null : current));
      toast({
        title: "Link deleted",
        description: "Associated click records were removed too.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Unable to delete the link.",
        variant: "error",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    setIsBusy(true);
    try {
      await bulkDelete({ ids: selectedIds, anonymousClientId });
      setSelectedIds([]);
      setExpandedQrId(null);
      setShowConfirmModal(false);
      toast({
        title: "Links deleted",
        description: `${selectedIds.length} link${selectedIds.length === 1 ? "" : "s"} removed.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Bulk delete failed",
        description: error instanceof Error ? error.message : "Unable to delete selected links.",
        variant: "error",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredLinks.map((link) => link._id) : []);
  };

  const handleSelectRow = (id: Id<"links">, checked: boolean) => {
    setSelectedIds((current) => (checked ? [...current, id] : current.filter((linkId) => linkId !== id)));
  };

  if (links === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-32">
        <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-[#d8cfee] bg-white/65 px-8 py-10 text-center shadow-2xl shadow-[#b79bdb]/10 backdrop-blur-2xl">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d8cfee] border-t-[#783f8e]" />
          <p className="text-sm font-medium text-[#5b4c73]">Fetching your links...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="mx-auto flex w-full max-w-4xl items-center justify-center px-4 py-32">
        <div className="rounded-[2rem] border border-[#d8cfee] bg-white/65 p-8 text-center shadow-2xl shadow-[#b79bdb]/10 backdrop-blur-2xl">
          <h2 className="text-3xl font-display font-extrabold text-[#3d245d]">Sign in to view your dashboard</h2>
          <p className="mt-3 text-sm leading-7 text-[#5b4c73]">
            Your dashboard lives behind authentication so your links and analytics stay private.
          </p>
          <button
            onClick={() => window.location.href = "/sign-in"}
            className="mt-6 rounded-xl bg-[#783f8e] px-6 py-3 font-bold text-white transition-all hover:bg-[#652f79]"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="dashboard-container" className="mx-auto w-full max-w-7xl px-4 py-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-[#d8cfee] bg-white/65 p-6 shadow-2xl shadow-[#b79bdb]/10 backdrop-blur-2xl lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#783f8e]">Dashboard</p>
            <h2 className="mt-2 text-3xl font-display font-extrabold text-[#3d245d]">Manage links at a glance</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5b4c73]">
              Search by slug or destination URL, filter by status and date, and inspect each short link.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#d8cfee] bg-[#f8f5fd] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7f7396]">Links</p>
              <p className="mt-2 text-2xl font-display font-bold text-[#3d245d]">{filteredLinks.length}</p>
            </div>
            <div className="rounded-2xl border border-[#d8cfee] bg-[#f8f5fd] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7f7396]">Clicks</p>
              <p className="mt-2 text-2xl font-display font-bold text-[#3d245d]">{totalClicks}</p>
            </div>
            <div className="rounded-2xl border border-[#d8cfee] bg-[#f8f5fd] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7f7396]">Expired</p>
              <p className="mt-2 text-2xl font-display font-bold text-[#3d245d]">{expiredLinks}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 rounded-[2rem] border border-[#d8cfee] bg-white/65 p-5 shadow-2xl shadow-[#b79bdb]/10 backdrop-blur-2xl lg:grid-cols-4">
          <label className="space-y-2 lg:col-span-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <Search className="h-4 w-4" />
              Search
            </span>
              <input
                id="search-input"
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by slug or original URL..."
              className="w-full rounded-2xl border border-[#d8cfee] bg-[#f8f5fd] px-4 py-3 text-sm text-[#3d245d] outline-none transition focus:border-[#9b7bc7]"
            />
          </label>

          <label className="space-y-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <Filter className="h-4 w-4" />
              Status
            </span>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="w-full rounded-2xl border border-[#d8cfee] bg-[#f8f5fd] px-4 py-3 text-sm text-[#3d245d] outline-none transition focus:border-[#9b7bc7]"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </label>

          <div className="space-y-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <Calendar className="h-4 w-4" />
              Date range
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                id="start-date-input"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-2xl border border-[#d8cfee] bg-[#f8f5fd] px-3 py-3 text-xs text-[#3d245d] outline-none transition focus:border-[#9b7bc7]"
              />
              <input
                id="end-date-input"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="rounded-2xl border border-[#d8cfee] bg-[#f8f5fd] px-3 py-3 text-xs text-[#3d245d] outline-none transition focus:border-[#9b7bc7]"
              />
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#d8cfee] bg-white/65 p-5 shadow-2xl shadow-[#b79bdb]/10 backdrop-blur-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#783f8e]">QR preview</p>
              <h3 className="mt-2 text-2xl font-display font-bold text-[#3d245d]">Always-on QR preview</h3>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5b4c73]">
                The preview shows the first filtered link by default. Pick a row's QR button to switch the preview without
                hiding the dashboard.
              </p>
            </div>
            {previewLink ? (
              <div className="rounded-full border border-[#d8cfee] bg-[#f8f5fd] px-4 py-2 text-xs font-semibold text-[#5b4c73]">
                {previewLink.slug}
              </div>
            ) : null}
          </div>

          <div className="mt-5">
            {previewLink ? (
              <QRCodeDisplay shortUrl={buildShortUrl(previewLink.slug)} slug={previewLink.slug} />
            ) : (
              <div className="rounded-[2rem] border border-[#d8cfee] bg-[#f8f5fd] p-8 text-center">
                <p className="text-sm text-[#5b4c73]">Create a link first to generate a QR preview here.</p>
              </div>
            )}
          </div>
        </div>

        {selectedIds.length > 0 ? (
          <div className="flex items-center justify-between rounded-2xl border border-[#d8cfee] bg-white/65 px-4 py-3">
            <p className="text-sm text-[#3d245d]">
              <span className="font-semibold">{selectedIds.length}</span> link{selectedIds.length === 1 ? "" : "s"} selected
            </p>
            <button
              id="bulk-delete-btn"
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d7b0bc] bg-[#fff6f8] px-4 py-2 text-sm font-semibold text-[#8d4d60] transition hover:bg-white"
            >
              Delete selected
            </button>
          </div>
        ) : null}

        {filteredLinks.length === 0 ? (
          <div className="rounded-[2rem] border border-[#d8cfee] bg-white/65 p-16 text-center shadow-2xl shadow-[#b79bdb]/10 backdrop-blur-2xl">
            <h3 className="mt-4 text-2xl font-display font-bold text-[#3d245d]">No short links found</h3>
            <p className="mb-6 mt-2 text-sm text-[#5b4c73]">Create your first branded link to see it here.</p>
            <button
              onClick={() => window.location.href = "/"}
              className="rounded-xl bg-[#783f8e] px-6 py-2 font-bold text-white transition-all hover:bg-[#652f79]"
            >
              Create New Link
            </button>
          </div>
        ) : (
          <div id="links-table-container" className="overflow-hidden rounded-[2rem] border border-[#d8cfee] bg-white/65 shadow-2xl shadow-[#b79bdb]/10 backdrop-blur-2xl">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-[#09080d] text-[10px] uppercase tracking-[0.22em] text-slate-400">
                  <tr>
                    <th className="w-12 p-4">
                      <input
                        id="select-all-checkbox"
                        type="checkbox"
                        checked={filteredLinks.length > 0 && selectedIds.length === filteredLinks.length}
                        onChange={(event) => handleSelectAll(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-700 bg-[#050407] text-primary-500 focus:ring-primary-500"
                      />
                    </th>
                    <th className="p-4">Short URL</th>
                    <th className="p-4">Original URL</th>
                    <th className="p-4 text-center">Clicks</th>
                    <th className="p-4">Created</th>
                    <th className="p-4">Expiry</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {filteredLinks.map((link) => {
                    const shortUrl = buildShortUrl(link.slug);
                    const isSelected = selectedIds.includes(link._id);
                    const isExpired = link.status === "expired" || (link.expiresAt ? link.expiresAt <= now : false);

                    return (
                      <Fragment key={link._id}>
                        <tr className={`transition hover:bg-white/5 ${isSelected ? "bg-primary-950/20" : ""}`}>
                          <td className="p-4 align-top">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(event) => handleSelectRow(link._id, event.target.checked)}
                              className="h-4 w-4 rounded border-slate-700 bg-[#050407] text-primary-500 focus:ring-primary-500"
                              data-testid={`select-${link.slug}`}
                            />
                          </td>

                          <td className="p-4 align-top">
                            <div className="flex items-start gap-2">
                              <div className="min-w-0">
                                <a
                                  href={shortUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block truncate font-mono text-sm font-semibold text-[#783f8e] transition hover:text-[#5f2d75]"
                                >
                                  {shortUrl}
                                </a>
                                <p className="mt-1 text-xs text-[#7f7396]">/{link.slug}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy(link._id, shortUrl)}
                                data-testid={`copy-${link.slug}`}
                                className="rounded-lg p-1.5 text-[#7f7396] transition hover:bg-white/50 hover:text-[#783f8e]"
                              >
                                {copiedId === link._id ? <Check className="h-4 w-4 text-[#783f8e]" /> : <Copy className="h-4 w-4" />}
                              </button>
                            </div>
                          </td>

                          <td className="p-4 align-top text-[#5b4c73]">
                            <a
                              href={link.originalUrl}
                              target="_blank"
                              rel="noreferrer"
                              title={link.originalUrl}
                              className="block max-w-[320px] truncate transition hover:text-[#783f8e]"
                            >
                              {truncate(link.originalUrl, 64)}
                            </a>
                          </td>

                          <td className="p-4 align-top text-center">
                            <span className="inline-flex min-w-12 items-center justify-center rounded-full border border-[#d8cfee] bg-[#f8f5fd] px-3 py-1 font-mono text-xs font-semibold text-[#3d245d]">
                              {link.clickCount}
                            </span>
                          </td>

                          <td className="p-4 align-top text-xs text-[#5b4c73]">{formatShortDate(link.createdAt)}</td>

                          <td className="p-4 align-top text-xs text-[#5b4c73]">
                            {link.expiresAt ? (
                              <span className={isExpired ? "text-[#a14c5f]" : "text-[#7f7396]"}>{formatRelativeDate(link.expiresAt)}</span>
                            ) : (
                              <span className="text-[#9b8fb4]">Never</span>
                            )}
                          </td>

                          <td className="p-4 align-top text-center">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                                isExpired ? "border-[#d7b0bc] bg-[#fff6f8] text-[#a14c5f]" : "border-[#d8cfee] bg-[#f8f5fd] text-[#783f8e]"
                              }`}
                            >
                              {isExpired ? "Expired" : "Active"}
                            </span>
                          </td>

                          <td className="p-4 align-top">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onSelectLink(link._id)}
                                data-testid={`analytics-${link.slug}`}
                                className="rounded-lg p-2 text-[#7f7396] transition hover:bg-white/50 hover:text-[#783f8e]"
                                title="View analytics"
                              >
                                <BarChart3 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setExpandedQrId((current) => (current === link._id ? null : link._id))}
                                data-testid={`qr-toggle-${link.slug}`}
                                className={`rounded-lg p-2 transition ${
                                  expandedQrId === link._id ? "bg-[#f8f5fd] text-[#783f8e]" : "text-[#7f7396] hover:bg-white/50 hover:text-[#783f8e]"
                                }`}
                                title="Regenerate QR"
                              >
                                <QrCode className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(link._id)}
                                data-testid={`delete-${link.slug}`}
                                className="rounded-lg p-2 text-[#a14c5f] transition hover:bg-white/50 hover:text-[#8d4d60]"
                                title="Delete link"
                                disabled={isBusy}
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showConfirmModal ? (
        <div id="bulk-delete-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[2rem] border border-[#d8cfee] bg-white/75 p-6 text-center shadow-2xl shadow-[#b79bdb]/15">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d8cfee] bg-[#f8f5fd] text-[#783f8e]">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-2xl font-display font-extrabold text-[#3d245d]">Delete selected links?</h3>
            <p className="mt-3 text-sm leading-7 text-[#5b4c73]">
              This permanently removes the selected short links and their analytics records. The action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                id="cancel-bulk-delete"
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 rounded-2xl border border-[#d8cfee] bg-white/70 px-4 py-3 text-sm font-semibold text-[#5b4c73] transition hover:bg-white"
              >
                Cancel
              </button>
              <button
                id="confirm-bulk-delete"
                type="button"
                onClick={handleBulkDelete}
                className="flex-1 rounded-2xl bg-[#783f8e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#652f79]"
                disabled={isBusy}
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
