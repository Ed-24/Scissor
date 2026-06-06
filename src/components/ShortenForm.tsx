import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, Calendar, Check, Copy, LayoutDashboard, Link2, RefreshCw, Sparkles } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { useToast } from "../context/ToastContext";
import { useAuthContext } from "../context/useAuthContext";
import QRCodeDisplay from "./QRCodeDisplay";

const PHISHING_BLOCKLIST = [
  "phishing.com",
  "malicious-site.net",
  "get-free-money.xyz",
  "login-paypal-verify.com",
  "steal-creds.org",
];

function validateUrl(input: string): { valid: boolean; message?: string } {
  const value = input.trim();
  if (!value) {
    return { valid: false, message: "Please enter a fully qualified URL such as https://example.com." };
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, message: "Only HTTP and HTTPS destinations are supported." };
    }

    const hostname = parsed.hostname.toLowerCase();
    if (PHISHING_BLOCKLIST.some((blocked) => hostname === blocked || hostname.endsWith(`.${blocked}`))) {
      return { valid: false, message: "This destination is blocked by Scissor's phishing protection." };
    }

    return { valid: true };
  } catch {
    return { valid: false, message: "Please enter a fully qualified URL such as https://example.com." };
  }
}

export default function ShortenForm() {
  const { isSignedIn, openSignIn } = useAuthContext();
  const { toast } = useToast();
  const createShortLink = useMutation(api.links.create);

  const [originalUrl, setOriginalUrl] = useState("");
  const [useCustomSlug, setUseCustomSlug] = useState(false);
  const [customSlug, setCustomSlug] = useState("");
  const [useExpiry, setUseExpiry] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ shortUrl: string; slug: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [debouncedSlug, setDebouncedSlug] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSlug(customSlug.trim()), 280);
    return () => window.clearTimeout(timer);
  }, [customSlug]);

  const originalValidation = validateUrl(originalUrl);
  const showUrlError = originalUrl.trim().length > 0 && !originalValidation.valid ? originalValidation.message ?? null : null;
  const slugPattern = /^[a-zA-Z0-9-]+$/;
  const slugLengthOk = debouncedSlug.length >= 3 && debouncedSlug.length <= 50;
  const slugCharsOk = !debouncedSlug || slugPattern.test(debouncedSlug);
  const shouldCheckSlug = isSignedIn && useCustomSlug && slugLengthOk && slugCharsOk;
  const slugAvailable = useQuery(api.links.checkSlugAvailable, shouldCheckSlug ? { slug: debouncedSlug } : "skip");

  const slugFeedback = useCustomSlug
    ? !slugLengthOk
      ? "Must be between 3 and 50 characters."
      : !slugCharsOk
        ? "Letters, numbers, and hyphens only."
        : slugAvailable === undefined
          ? "Checking availability..."
          : slugAvailable
            ? "Available"
            : "Taken or reserved"
    : null;

  const isSubmitDisabled =
    !isSignedIn ||
    isSubmitting ||
    !originalUrl.trim() ||
    !!showUrlError ||
    (useCustomSlug && (!slugLengthOk || !slugCharsOk || slugAvailable === false));

  const resetForm = () => {
    setSuccessData(null);
    setErrorMessage(null);
    setIsCopied(false);
  };

  const handleCopy = async () => {
    if (!successData) {
      return;
    }

    try {
      await navigator.clipboard.writeText(successData.shortUrl);
      setIsCopied(true);
      toast({
        title: "Short link copied",
        description: successData.shortUrl,
        variant: "success",
      });
      window.setTimeout(() => setIsCopied(false), 1800);
    } catch {
      toast({
        title: "Copy failed",
        description: "Your browser blocked clipboard access.",
        variant: "error",
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!isSignedIn) {
      openSignIn();
      return;
    }

    const validation = validateUrl(originalUrl);
    if (!validation.valid) {
      setErrorMessage(validation.message ?? "Invalid URL.");
      return;
    }

    if (useCustomSlug) {
      const normalized = customSlug.trim();
      if (normalized.length < 3 || normalized.length > 50) {
        setErrorMessage("Custom slug must be between 3 and 50 characters.");
        return;
      }
      if (!slugPattern.test(normalized)) {
        setErrorMessage("Custom slug can only contain letters, numbers, and hyphens.");
        return;
      }
      if (slugAvailable === false) {
        setErrorMessage("This custom slug is already taken.");
        return;
      }
    }

    let expiresAtTimestamp: number | undefined;
    if (useExpiry) {
      if (!expiresAt) {
        setErrorMessage("Choose an expiration date and time.");
        return;
      }

      expiresAtTimestamp = new Date(expiresAt).getTime();
      if (Number.isNaN(expiresAtTimestamp) || expiresAtTimestamp <= Date.now()) {
        setErrorMessage("Expiration must be set in the future.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const result = await createShortLink({
        originalUrl: originalUrl.trim(),
        customSlug: useCustomSlug ? customSlug.trim() : undefined,
        expiresAt: expiresAtTimestamp,
      });

      const shortUrl = `${window.location.origin}/s/${result.slug}`;
      setSuccessData({ shortUrl, slug: result.slug });
      setOriginalUrl("");
      setCustomSlug("");
      setUseCustomSlug(false);
      setUseExpiry(false);
      setExpiresAt("");
      toast({
        title: "Link shortened",
        description: shortUrl,
        variant: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong while shortening the URL.";
      setErrorMessage(message);
      toast({
        title: "Could not shorten link",
        description: message,
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="rounded-[2rem] border border-soft-500/15 bg-white/5 p-8 text-center backdrop-blur-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-soft-500/20 bg-primary-500/10 text-light-200">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-3xl font-display font-extrabold text-white">Sign in to create short links</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Login first, then Scissor will take you straight to the shorten flow with live analytics and QR generation.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <button
              type="button"
              onClick={openSignIn}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-700 shadow-lg shadow-primary-950/20"
            >
              Sign In Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (successData) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="rounded-[2rem] border border-soft-500/15 bg-white/5 p-8 shadow-2xl shadow-primary-950/30 backdrop-blur-2xl">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary-500/20 bg-primary-500/10 text-soft-200">
              <Check className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-3xl font-display font-extrabold text-white">Your link is ready</h2>
              <p className="mt-2 text-sm text-slate-400">Copy it now, or open the dashboard to inspect performance later.</p>
            </div>

            <div className="flex w-full flex-col gap-3 rounded-2xl border border-white/8 bg-[#09080d] p-4 sm:flex-row sm:items-center">
              <span className="min-w-0 flex-1 break-all font-mono text-sm text-slate-200">{successData.shortUrl}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
                id="copy-short-url"
              >
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {isCopied ? "Copied" : "Copy"}
              </button>
            </div>

            <QRCodeDisplay shortUrl={successData.shortUrl} slug={successData.slug} />

            <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 text-sm font-semibold text-soft-200 transition hover:text-light-200"
                id="shorten-another-btn"
              >
                <RefreshCw className="h-4 w-4" />
                Shorten another URL
              </button>
              <span className="text-white/10">|</span>
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary-400 transition hover:text-primary-300"
              >
                <LayoutDashboard className="h-4 w-4" />
                View in Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-6 flex justify-end">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          Go to Dashboard
        </a>
      </div>
      <form
        id="shorten-form"
        onSubmit={handleSubmit}
        className="rounded-[2rem] border border-soft-500/15 bg-white/5 p-6 shadow-2xl shadow-primary-950/20 backdrop-blur-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-soft-200">Create link</p>
            <h2 className="mt-2 text-3xl font-display font-extrabold text-white">Shorten a long URL</h2>
            <p className="mt-2 text-sm text-slate-400">Paste a destination, pick a slug or expiry, and generate a branded link in seconds.</p>
          </div>
          <div className="hidden rounded-2xl border border-soft-500/15 bg-white/5 p-3 text-soft-200 sm:block">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <label htmlFor="original-url-input" className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <Link2 className="h-4 w-4 text-soft-200" />
              Destination URL
            </label>
            <input
              id="original-url-input"
              type="text"
              value={originalUrl}
              onChange={(event) => setOriginalUrl(event.target.value)}
              placeholder="https://example.com/very/long/path"
              className="w-full rounded-2xl border border-soft-500/15 bg-[#09080d] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-primary-500/40"
              aria-invalid={Boolean(showUrlError)}
            />
            {showUrlError ? (
              <p className="mt-2 flex items-start gap-2 text-xs text-rose-300" id="url-validation-error">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {showUrlError}
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-200">
              <input
                id="custom-slug-toggle"
                type="checkbox"
                checked={useCustomSlug}
                onChange={(event) => {
                  setUseCustomSlug(event.target.checked);
                  if (!event.target.checked) {
                    setCustomSlug("");
                  }
                }}
                className="h-4 w-4 rounded border-slate-700 bg-[#09080d] text-primary-500 focus:ring-primary-500"
              />
              Add a custom slug
            </label>

            {useCustomSlug ? (
              <div className="rounded-2xl border border-soft-500/15 bg-[#09080d]/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <span className="font-mono text-sm text-slate-500">{window.location.origin}/s/</span>
                  <input
                    id="custom-slug-input"
                    type="text"
                    value={customSlug}
                    onChange={(event) => setCustomSlug(event.target.value.toLowerCase().replace(/\s+/g, ""))}
                    placeholder="my-brand"
                    className="min-w-0 flex-1 rounded-xl border border-soft-500/15 bg-[#050407] px-4 py-2.5 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-primary-500/40"
                  />
                </div>
                {slugFeedback ? (
                  <p
                    id="slug-feedback"
                    className={`mt-2 text-xs ${
                      slugFeedback === "Available"
                        ? "text-soft-200"
                        : slugFeedback === "Taken or reserved"
                          ? "text-rose-300"
                          : "text-slate-400"
                    }`}
                  >
                    {slugFeedback}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-200">
              <input
                id="expiry-toggle"
                type="checkbox"
                checked={useExpiry}
                onChange={(event) => {
                  setUseExpiry(event.target.checked);
                  if (!event.target.checked) {
                    setExpiresAt("");
                  }
                }}
                className="h-4 w-4 rounded border-slate-700 bg-[#09080d] text-primary-500 focus:ring-primary-500"
              />
              Set an expiry date
            </label>

            {useExpiry ? (
              <div className="rounded-2xl border border-white/8 bg-[#09080d]/60 p-4">
                <label htmlFor="expiry-input" className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  <Calendar className="h-4 w-4 text-soft-200" />
                  Date and time
                </label>
                <input
                  id="expiry-input"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  className="w-full rounded-xl border border-soft-500/15 bg-[#050407] px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-primary-500/40"
                />
              </div>
            ) : null}
          </div>

          {errorMessage ? (
            <div id="form-error-alert" className="flex items-start gap-3 rounded-2xl border border-soft-500/20 bg-primary-950/25 p-4 text-light-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Could not create link</p>
                <p className="mt-1 text-xs text-light-200/80">{errorMessage}</p>
              </div>
            </div>
          ) : null}

          <button
            id="shorten-submit-btn"
            type="submit"
            disabled={isSubmitDisabled}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-600 to-accent-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-950/30 transition hover:from-accent-500 hover:to-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Shortening..." : "Get Shortened Link"}
          </button>
        </div>
      </form>
    </div>
  );
}
