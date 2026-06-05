import { Fragment, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { useAuthContext } from "../context/useAuthContext";
import QRCodeDisplay from "./QRCodeDisplay";
import {
  BarChart3,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  Filter,
  QrCode,
  Search,
  ShieldAlert,
  Trash,
  Trash2,
  X,
} from "lucide-react";

interface DashboardProps {
  onSelectLink: (linkId: Id<"links">) => void;
}

type LinkRow = Doc<"links"> & { clickCount: number };

export default function Dashboard({ onSelectLink }: DashboardProps) {
  const { anonymousId, isSignedIn } = useAuthContext();
  const deleteLink = useMutation(api.links.deleteLink);
  const bulkDelete = useMutation(api.links.bulkDelete);
  const links = useQuery(api.links.listUserLinks, isSignedIn ? {} : { anonymousClientId: anonymousId }) as
    | LinkRow[]
    | undefined;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<Id<"links">[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [copiedId, setCopiedId] = useState<Id<"links"> | null>(null);
  const [expandedQrId, setExpandedQrId] = useState<Id<"links"> | null>(null);

  if (links === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-semibold">Loading links dashboard...</p>
      </div>
    );
  }

  const filteredLinks = links.filter((link) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = link.slug.toLowerCase().includes(search) || link.originalUrl.toLowerCase().includes(search);
    const matchesStatus = statusFilter === "all" || link.status === statusFilter;
    const linkTime = link.createdAt;
    const matchesStart = !startDate ? true : linkTime >= new Date(startDate).getTime();
    const matchesEnd = !endDate ? true : linkTime <= new Date(endDate).getTime() + 86_400_000;

    return matchesSearch && matchesStatus && matchesStart && matchesEnd;
  });

  const host = window.location.origin;

  const handleCopy = (id: Id<"links">, shortUrl: string) => {
    void navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: Id<"links">) => {
    if (!confirm("Are you sure you want to delete this short link and all its click analytics?")) {
      return;
    }

    try {
      await deleteLink(isSignedIn ? { id } : { id, anonymousClientId: anonymousId });
      setSelectedIds((previous) => previous.filter((linkId) => linkId !== id));
      setExpandedQrId((previous) => (previous === id ? null : previous));
    } catch {
      alert("Failed to delete link");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    try {
      await bulkDelete(isSignedIn ? { ids: selectedIds } : { ids: selectedIds, anonymousClientId: anonymousId });
      setSelectedIds([]);
      setExpandedQrId(null);
      setShowConfirmModal(false);
    } catch {
      alert("Failed to bulk delete links");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredLinks.map((link) => link._id));
      return;
    }

    setSelectedIds([]);
  };

  const handleSelectRow = (id: Id<"links">, checked: boolean) => {
    if (checked) {
      setSelectedIds((previous) => [...previous, id]);
      return;
    }

    setSelectedIds((previous) => previous.filter((linkId) => linkId !== id));
  };

  const toggleQrExpand = (id: Id<"links">) => {
    setExpandedQrId((previous) => (previous === id ? null : id));
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-10 px-4 flex flex-col gap-6" id="dashboard-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-display text-white">Links Dashboard</h2>
          <p className="text-sm text-slate-400 mt-1">Manage, filter, and inspect click performance of your short links.</p>
        </div>

        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="px-5 py-2.5 bg-red-600/30 hover:bg-red-600/40 text-red-300 border border-red-500/40 rounded-xl text-sm font-bold flex items-center gap-2 transition active:scale-95 animate-[fadeIn_0.2s_ease]"
            id="bulk-delete-btn"
          >
            <Trash2 className="w-4 h-4" />
            Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="glass-card rounded-2xl p-5 border border-purple-500/10 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5" htmlFor="search-input">
            <Search className="w-3.5 h-3.5" />
            Search Link
          </label>
          <input
            type="text"
            id="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by slug or destination URL..."
            className="w-full px-4 py-2.5 rounded-xl glass-input text-slate-200 text-sm font-sans"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5" htmlFor="status-filter">
            <Filter className="w-3.5 h-3.5" />
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "expired")}
            className="w-full px-4 py-2.5 rounded-xl glass-input text-slate-200 text-sm font-sans bg-[#0c0b10] cursor-pointer"
          >
            <option value="all">All Links</option>
            <option value="active">Active Only</option>
            <option value="expired">Expired Only</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5" htmlFor="start-date-input">
            <Calendar className="w-3.5 h-3.5" />
            Date Created
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              id="start-date-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-1/2 px-2.5 py-2.5 rounded-xl glass-input text-slate-200 text-xs font-sans"
            />
            <input
              type="date"
              id="end-date-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/2 px-2.5 py-2.5 rounded-xl glass-input text-slate-200 text-xs font-sans"
            />
          </div>
        </div>
      </div>

      {filteredLinks.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center border border-purple-500/10">
          <div className="w-12 h-12 text-slate-600 mx-auto">
            <BarChart3 className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold font-display text-slate-300 mt-4">No short links found</h3>
          <p className="text-sm text-slate-500 mt-1">Try relaxing your search terms or create your first short URL above.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-purple-500/10 overflow-hidden" id="links-table-container">
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-950/60 border-b border-purple-500/10 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={filteredLinks.length > 0 && selectedIds.length === filteredLinks.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      id="select-all-checkbox"
                    />
                  </th>
                  <th className="p-4">Short link</th>
                  <th className="p-4">Destination</th>
                  <th className="p-4 text-center">Clicks</th>
                  <th className="p-4">Created</th>
                  <th className="p-4">Expires</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredLinks.map((link) => {
                  const shortUrl = `${host}/s/${link.slug}`;
                  const isSelected = selectedIds.includes(link._id);
                  const isExpired = link.status === "expired";

                  return (
                    <Fragment key={link._id}>
                      <tr className={`hover:bg-slate-900/30 transition-colors ${isSelected ? "bg-purple-950/10" : ""}`}>
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectRow(link._id, e.target.checked)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500 cursor-pointer"
                            data-testid={`select-${link.slug}`}
                          />
                        </td>

                        <td className="p-4 font-semibold font-mono text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[150px]">{link.slug}</span>
                            <button
                              onClick={() => handleCopy(link._id, shortUrl)}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
                              title="Copy URL"
                              data-testid={`copy-${link.slug}`}
                              type="button"
                            >
                              {copiedId === link._id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <a
                              href={shortUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
                              title="Visit Redirect Link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>

                        <td className="p-4 max-w-[200px] truncate text-slate-400" title={link.originalUrl}>
                          <a href={link.originalUrl} target="_blank" rel="noreferrer" className="hover:text-purple-400 hover:underline">
                            {link.originalUrl}
                          </a>
                        </td>

                        <td className="p-4 text-center font-bold font-mono">
                          <span className="inline-block px-2.5 py-1 bg-slate-950/70 border border-slate-800 text-purple-300 rounded-lg text-xs">
                            {link.clickCount}
                          </span>
                        </td>

                        <td className="p-4 text-xs text-slate-400">
                          {new Date(link.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>

                        <td className="p-4 text-xs text-slate-400">
                          {link.expiresAt ? (
                            <span className={isExpired ? "text-red-400 font-semibold" : ""}>
                              {new Date(link.expiresAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          ) : (
                            <span className="text-slate-600">Never</span>
                          )}
                        </td>

                        <td className="p-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isExpired
                                ? "bg-red-500/15 text-red-400 border border-red-500/20"
                                : "bg-green-500/15 text-green-400 border border-green-500/20"
                            }`}
                          >
                            {isExpired ? "Expired" : "Active"}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onSelectLink(link._id)}
                              className="p-1.5 hover:bg-slate-800 rounded-lg text-purple-400 hover:text-purple-300 transition"
                              title="View Click Analytics"
                              data-testid={`analytics-${link.slug}`}
                              type="button"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleQrExpand(link._id)}
                              className={`p-1.5 rounded-lg transition ${
                                expandedQrId === link._id
                                  ? "bg-purple-950/30 text-purple-300"
                                  : "hover:bg-slate-800 text-blue-400 hover:text-blue-300"
                              }`}
                              title="Generate QR Code"
                              data-testid={`qr-toggle-${link.slug}`}
                              type="button"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(link._id)}
                              className="p-1.5 hover:bg-slate-800 rounded-lg text-red-400 hover:text-red-300 transition"
                              title="Delete Link"
                              data-testid={`delete-${link.slug}`}
                              type="button"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expandedQrId === link._id && (
                        <tr>
                          <td colSpan={8} className="p-4 bg-slate-950/20 border-b border-purple-500/10">
                            <div className="animate-[slideDown_0.25s_ease-out]">
                              <div className="flex justify-between items-center px-6 pt-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                  QR Code for short slug: <span className="font-mono text-purple-300">{link.slug}</span>
                                </span>
                                <button onClick={() => setExpandedQrId(null)} className="text-slate-500 hover:text-slate-300" type="button">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <QRCodeDisplay shortUrl={shortUrl} slug={link.slug} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-[fadeIn_0.15s_ease-out]" id="bulk-delete-modal">
          <div className="glass-card max-w-md w-full rounded-2xl p-6 border border-red-500/20 flex flex-col gap-5 text-center">
            <div className="mx-auto p-3 bg-red-500/10 border border-red-500/30 rounded-full w-fit text-red-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-white">Bulk Delete Links</h3>
              <p className="text-sm text-slate-400 mt-2">
                Are you absolutely sure you want to delete <span className="font-bold text-red-400">{selectedIds.length}</span> short links and all of their
                click analytics records? This action is permanent and cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition"
                id="cancel-bulk-delete"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-red-950/20"
                id="confirm-bulk-delete"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
