function normalizeBaseUrl(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    try {
      return new URL(`https://${trimmed}`).origin;
    } catch {
      return null;
    }
  }
}

export function getShortUrlBase(): string {
  const configuredBase = normalizeBaseUrl(import.meta.env.VITE_SHORT_URL_BASE);
  if (configuredBase) {
    return configuredBase;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:5173";
}

export function buildShortUrl(slug: string): string {
  return `${getShortUrlBase()}/s/${slug}`;
}
