import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthContext } from "../context/useAuthContext";
import QRCodeDisplay from "./QRCodeDisplay";
import { AlertCircle, Calendar, Check, Copy, Link2, RefreshCw, Sparkles } from "lucide-react";

const PHISHING_BLOCKLIST = [
  "phishing.com",
  "malicious-site.net",
  "get-free-money.xyz",
  "login-paypal-verify.com",
  "steal-creds.org",
];

function checkUrlValidity(urlString: string): { isValid: boolean; error?: string } {
  const normalizedUrl = urlString.trim();
  if (!normalizedUrl) {
    return { isValid: false, error: "Please enter a fully qualified URL (e.g., https://example.com)." };
  }

  try {
    const url = new URL(normalizedUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { isValid: false, error: "Only HTTP and HTTPS URLs are supported." };
    }

    const hostname = url.hostname.toLowerCase();
    for (const blocked of PHISHING_BLOCKLIST) {
      if (hostname === blocked || hostname.endsWith(`.${blocked}`)) {
        return { isValid: false, error: "This URL has been flagged as a phishing hazard." };
      }
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: "Please enter a fully qualified URL (e.g., https://example.com)." };
  }
}

export default function ShortenForm() {
  const { anonymousId, isSignedIn } = useAuthContext();
  const createShortLink = useMutation(api.links.create);

  const [originalUrl, setOriginalUrl] = useState("");
  const [useCustomSlug, setUseCustomSlug] = useState(false);
  const [customSlug, setCustomSlug] = useState("");
  const [debouncedSlug, setDebouncedSlug] = useState("");
  const [useExpiry, setUseExpiry] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ shortUrl: string; slug: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSlug(customSlug.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [customSlug]);

  const hasUrl = originalUrl.trim().length > 0;
  const urlValidation = checkUrlValidity(originalUrl);
  const urlValidationError = hasUrl && !urlValidation.isValid ? urlValidation.error ?? null : null;

  const isSlugLengthOk = debouncedSlug.length >= 3 && debouncedSlug.length <= 50;
  const isSlugValidChars = /^[a-zA-Z0-9-]+$/.test(debouncedSlug);
  const checkSlugEnabled = useCustomSlug && isSlugLengthOk && isSlugValidChars;

  const isSlugAvailable = useQuery(
    api.links.checkSlugAvailable,
    checkSlugEnabled ? { slug: debouncedSlug } : "skip"
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    const normalizedOriginalUrl = originalUrl.trim();
    const normalizedUrlValidation = checkUrlValidity(normalizedOriginalUrl);
    if (!normalizedUrlValidation.isValid) {
      return;
    }

    if (useCustomSlug) {
      const slugVal = customSlug.trim();
      if (slugVal.length < 3 || slugVal.length > 50) {
        setErrorMsg("Custom slug must be between 3 and 50 characters.");
        return;
      }
      if (!/^[a-zA-Z0-9-]+$/.test(slugVal)) {
        setErrorMsg("Custom slug can only contain letters, numbers, and hyphens.");
        return;
      }
      if (isSlugAvailable === false) {
        setErrorMsg("Slug is already taken.");
        return;
      }
    }

    let expiryTimestamp: number | undefined;
    if (useExpiry) {
      if (!expiresAt) {
        setErrorMsg("Please select an expiration date.");
        return;
      }

      expiryTimestamp = new Date(expiresAt).getTime();
      if (expiryTimestamp <= Date.now()) {
        setErrorMsg("Expiration date must be in the future.");
        return;
      }
    }

    setLoading(true);

    try {
      const result = await createShortLink({
        originalUrl: normalizedOriginalUrl,
        customSlug: useCustomSlug ? customSlug.trim() : undefined,
        expiresAt: expiryTimestamp,
        anonymousClientId: anonymousId,
      });

      setSuccessData({
        shortUrl: `${window.location.origin}/s/${result.slug}`,
        slug: result.slug,
      });
      setOriginalUrl("");
      setCustomSlug("");
      setUseCustomSlug(false);
      setUseExpiry(false);
      setExpiresAt("");
      setCopied(false);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!successData) {
      return;
    }

    void navigator.clipboard.writeText(successData.shortUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const startNew = () => {
    setSuccessData(null);
    setErrorMsg(null);
    setCopied(false);
  };

  const slugFeedback = customSlug
    ? !isSlugLengthOk
      ? "Must be between 3 and 50 characters."
      : !isSlugValidChars
        ? "Letters, numbers, and hyphens only."
        : isSlugAvailable === undefined
          ? "Checking availability..."
          : isSlugAvailable
            ? "Available!"
            : "Taken or reserved."
    : null;

  const isSubmitDisabled =
    loading ||
    !hasUrl ||
    !!urlValidationError ||
    (useCustomSlug && (!isSlugLengthOk || !isSlugValidChars || isSlugAvailable === false));

  return (
    <div className="w-full max-w-2xl mx-auto py-10 px-4">
      {successData ? (
        <div className="glass-card rounded-3xl p-8 border border-purple-500/30 flex flex-col items-center text-center gap-6 animate-[fadeIn_0.3s_ease]">
          <div className="p-3 bg-purple-500/20 rounded-full border border-purple-500/40">
            <Sparkles className="w-8 h-8 text-purple-300" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold font-display text-white">Your Link is Ready!</h2>
            <p className="text-sm text-slate-400 mt-2">Instantly generated and ready to share.</p>
          </div>

          <div className="w-full flex items-center justify-between gap-3 p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
            <span className="text-slate-200 font-mono text-sm break-all select-all flex-1 text-left">
              {successData.shortUrl}
            </span>
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition active:scale-95 duration-100 ${
                copied ? "bg-green-600/30 text-green-300 border border-green-500/40" : "bg-purple-600 hover:bg-purple-500 text-white"
              }`}
              id="copy-short-url"
              type="button"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <QRCodeDisplay shortUrl={successData.shortUrl} slug={successData.slug} />

          <button
            onClick={startNew}
            className="text-xs text-purple-400 hover:text-purple-300 font-bold transition flex items-center gap-1.5"
            id="shorten-another-btn"
            type="button"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Shorten another URL
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-8 border border-purple-500/20 flex flex-col gap-6" id="shorten-form">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-extrabold font-display text-white flex items-center justify-center md:justify-start gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              Shorten a long URL
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Paste your link below. {!isSignedIn && "Guests are limited to 5 links per 24 hours."}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2" htmlFor="original-url-input">
              <Link2 className="w-4 h-4 text-purple-400" />
              Destination URL
            </label>
            <input
              type="text"
              id="original-url-input"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              placeholder="https://example.com/very/long/path/to/some/resource"
              required
              className="w-full px-4 py-3.5 rounded-2xl glass-input text-slate-200 text-sm font-sans"
            />
            {urlValidationError && (
              <span className="text-xs text-red-400 flex items-center gap-1.5 mt-1" id="url-validation-error">
                <AlertCircle className="w-3.5 h-3.5" />
                {urlValidationError}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useCustomSlug}
                onChange={(e) => {
                  setUseCustomSlug(e.target.checked);
                  if (!e.target.checked) {
                    setCustomSlug("");
                  }
                }}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900 cursor-pointer"
                id="custom-slug-toggle"
              />
              Configure Branded Custom Slug
            </label>

            {useCustomSlug && (
              <div className="flex flex-col gap-2 pl-6 animate-[fadeIn_0.2s_ease]">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono text-sm">{window.location.origin}/s/</span>
                  <input
                    type="text"
                    id="custom-slug-input"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                    placeholder="my-custom-slug"
                    className="flex-1 px-4 py-2 rounded-xl glass-input text-slate-200 text-sm font-mono"
                  />
                </div>
                {slugFeedback && (
                  <div className="text-xs mt-1" id="slug-feedback">
                    {slugFeedback === "Available!" ? (
                      <span className="text-green-400 font-bold">{slugFeedback}</span>
                    ) : slugFeedback === "Taken or reserved." ? (
                      <span className="text-red-400 font-bold">{slugFeedback}</span>
                    ) : (
                      <span className="text-slate-400">{slugFeedback}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useExpiry}
                onChange={(e) => {
                  setUseExpiry(e.target.checked);
                  if (!e.target.checked) {
                    setExpiresAt("");
                  }
                }}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900 cursor-pointer"
                id="expiry-toggle"
              />
              Set Link Expiration Date
            </label>

            {useExpiry && (
              <div className="flex flex-col gap-2 pl-6 animate-[fadeIn_0.2s_ease]">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5" htmlFor="expiry-input">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  Select Date & Time (Local)
                </label>
                <input
                  type="datetime-local"
                  id="expiry-input"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="px-4 py-2.5 rounded-xl glass-input text-slate-200 text-sm font-sans"
                />
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl text-red-400 text-sm flex items-start gap-2.5" id="form-error-alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Error shortening link:</span>
                <p className="mt-0.5 text-xs text-red-300">{errorMsg}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full py-4 mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-extrabold rounded-2xl flex items-center justify-center gap-2 transition active:scale-98 shadow-xl shadow-purple-950/30 glow-button cursor-pointer"
            id="shorten-submit-btn"
          >
            {loading ? "Shortening..." : "Get Shortened Link"}
          </button>
        </form>
      )}
    </div>
  );
}
