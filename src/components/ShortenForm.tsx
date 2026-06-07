import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "../context/ToastContext";
import { useAuthContext } from "../context/useAuthContext";
import { getAnonymousClientId } from "../context/authCore";
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
  const { isSignedIn } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const createShortLink = useMutation(api.links.create);

  const [originalUrl, setOriginalUrl] = useState("");
  const [useCustomSlug, setUseCustomSlug] = useState(false);
  const [customSlug, setCustomSlug] = useState("");
  const [useExpiry, setUseExpiry] = useState(false);
  const [expiresOn, setExpiresOn] = useState("");
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
      navigate("/sign-in");
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
      if (!expiresOn) {
        setErrorMessage("Choose an expiration date from the calendar.");
        return;
      }

      expiresAtTimestamp = new Date(`${expiresOn}T23:59:59`).getTime();
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
        anonymousClientId: getAnonymousClientId(),
      });

      const shortUrl = `${window.location.origin}/s/${result.slug}`;
      setSuccessData({ shortUrl, slug: result.slug });
      setOriginalUrl("");
      setCustomSlug("");
      setUseCustomSlug(false);
      setUseExpiry(false);
      setExpiresOn("");
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
        <div className="rounded-[2rem] border border-[#d8cfee] bg-white/55 p-8 text-center shadow-2xl shadow-[#b79bdb]/15 backdrop-blur-2xl">
          <div className="mx-auto h-14 w-14 rounded-full border border-[#9f7cc8] bg-[#7e4ea8] shadow-lg shadow-[#7e4ea8]/20" />
          <h2 className="mt-5 text-3xl font-display font-extrabold text-[#3d245d]">Sign in to create short links</h2>
          <p className="mt-3 text-sm leading-7 text-[#5b4c73]">
            Login first, then Scissor will take you straight to the shorten flow with custom slugs, QR codes, expiry dates, and click tracking.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/sign-in"
              className="inline-flex items-center justify-center rounded-2xl bg-[#783f8e] px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-[#652f79] shadow-lg shadow-[#783f8e]/20"
            >
              Sign In Now
            </Link>
            <Link
              to="/sign-up"
              className="inline-flex items-center justify-center rounded-2xl border border-[#c8c6d7] bg-white/65 px-8 py-3.5 text-sm font-semibold text-[#4a4063] transition hover:bg-white"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (successData) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="rounded-[2rem] border border-[#d8cfee] bg-white/55 p-8 shadow-2xl shadow-[#b79bdb]/15 backdrop-blur-2xl">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#9f7cc8] bg-[#7e4ea8] text-white shadow-lg shadow-[#7e4ea8]/20">
              <span className="text-lg font-semibold">Done</span>
            </div>
            <div>
              <h2 className="text-3xl font-display font-extrabold text-[#3d245d]">Your link is ready</h2>
              <p className="mt-2 text-sm text-[#5b4c73]">Copy it now, or open the dashboard to inspect performance later.</p>
            </div>

            <div className="flex w-full flex-col gap-3 rounded-2xl border border-[#d8cfee] bg-[#f8f5fd] p-4 sm:flex-row sm:items-center">
              <span className="min-w-0 flex-1 break-all font-mono text-sm text-[#4a4063]">{successData.shortUrl}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center justify-center rounded-xl bg-[#783f8e] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#652f79]"
                id="copy-short-url"
              >
                {isCopied ? "Copied" : "Copy"}
              </button>
            </div>

            <QRCodeDisplay shortUrl={successData.shortUrl} slug={successData.slug} />

            <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center text-sm font-semibold text-[#783f8e] transition hover:text-[#652f79]"
                id="shorten-another-btn"
              >
                Shorten another URL
              </button>
              <span className="text-[#c8c6d7]">|</span>
              <a
                href="/dashboard"
                className="inline-flex items-center text-sm font-semibold text-[#783f8e] transition hover:text-[#652f79]"
              >
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
          className="inline-flex items-center rounded-xl border border-[#d8cfee] bg-white/55 px-4 py-2 text-xs font-bold text-[#4a4063] transition hover:bg-white hover:text-[#3d245d]"
        >
          Go to Dashboard
        </a>
      </div>
      <form
        id="shorten-form"
        onSubmit={handleSubmit}
        className="rounded-[2rem] border border-[#d8cfee] bg-white/55 p-6 shadow-2xl shadow-[#b79bdb]/15 backdrop-blur-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#783f8e]">Create link</p>
            <h2 className="mt-2 text-3xl font-display font-extrabold text-[#3d245d]">Shorten a long URL</h2>
            <p className="mt-2 text-sm text-[#5b4c73]">Paste a destination, pick a slug or expiry, and generate a branded link in seconds.</p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <label htmlFor="original-url-input" className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#5b4c73]">
              Destination URL
            </label>
            <input
              id="original-url-input"
              type="text"
              value={originalUrl}
              onChange={(event) => setOriginalUrl(event.target.value)}
              placeholder="https://example.com/very/long/path"
              className="w-full rounded-2xl border border-[#d8cfee] bg-[#f8f5fd] px-4 py-3 text-sm text-[#3d245d] outline-none transition placeholder:text-[#9b8fb4] focus:border-[#9b7bc7]"
              aria-invalid={Boolean(showUrlError)}
            />
            {showUrlError ? (
              <p className="mt-2 text-xs text-[#a14c5f]" id="url-validation-error">
                {showUrlError}
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-3 text-sm text-[#3d245d]">
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
                className="h-4 w-4 rounded border-[#c8c6d7] bg-white text-[#783f8e] focus:ring-[#783f8e]"
              />
              Add a custom slug
            </label>

            {useCustomSlug ? (
              <div className="rounded-2xl border border-[#d8cfee] bg-[#f8f5fd] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <span className="font-mono text-sm text-[#7f7396]">{window.location.origin}/s/</span>
                  <input
                    id="custom-slug-input"
                    type="text"
                    value={customSlug}
                    onChange={(event) => setCustomSlug(event.target.value.toLowerCase().replace(/\s+/g, ""))}
                    placeholder="my-brand"
                    className="min-w-0 flex-1 rounded-xl border border-[#d8cfee] bg-white px-4 py-2.5 font-mono text-sm text-[#3d245d] outline-none transition placeholder:text-[#9b8fb4] focus:border-[#9b7bc7]"
                  />
                </div>
                {slugFeedback ? (
                  <p
                    id="slug-feedback"
                    className={`mt-2 text-xs ${
                      slugFeedback === "Available"
                        ? "text-[#783f8e]"
                        : slugFeedback === "Taken or reserved"
                          ? "text-[#a14c5f]"
                          : "text-[#6f6483]"
                    }`}
                  >
                    {slugFeedback}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-3 text-sm text-[#3d245d]">
              <input
                id="expiry-toggle"
                type="checkbox"
                checked={useExpiry}
                onChange={(event) => {
                  setUseExpiry(event.target.checked);
                  if (!event.target.checked) {
                    setExpiresOn("");
                  }
                }}
                className="h-4 w-4 rounded border-[#c8c6d7] bg-white text-[#783f8e] focus:ring-[#783f8e]"
              />
              Set an expiry date
            </label>

            {useExpiry ? (
              <div className="rounded-2xl border border-[#d8cfee] bg-[#f8f5fd] p-4">
                <label htmlFor="expiry-input" className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#5b4c73]">
                  Date from calendar
                </label>
                <input
                  id="expiry-input"
                  type="date"
                  value={expiresOn}
                  onChange={(event) => setExpiresOn(event.target.value)}
                  className="w-full rounded-xl border border-[#d8cfee] bg-white px-4 py-2.5 text-sm text-[#3d245d] outline-none transition focus:border-[#9b7bc7]"
                />
                <p className="mt-2 text-xs text-[#7f7396]">The link expires at the end of the selected day.</p>
              </div>
            ) : null}
          </div>

          {errorMessage ? (
            <div id="form-error-alert" className="rounded-2xl border border-[#d7b0bc] bg-[#fff6f8] p-4 text-[#8d4d60]">
              <div>
                <p className="text-sm font-semibold">Could not create link</p>
                <p className="mt-1 text-xs">{errorMessage}</p>
              </div>
            </div>
          ) : null}

          <button
            id="shorten-submit-btn"
            type="submit"
            disabled={isSubmitDisabled}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#783f8e] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#783f8e]/20 transition hover:bg-[#652f79] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Shortening..." : "Get Shortened Link"}
          </button>
        </div>
      </form>
    </div>
  );
}

