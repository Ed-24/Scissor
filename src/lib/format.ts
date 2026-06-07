export function formatRelativeDate(value: number | undefined): string {
  if (!value) {
    return "Never";
  }

  const now = Date.now();
  const diffInSeconds = Math.floor((value - now) / 1000);
  const absDiff = Math.abs(diffInSeconds);

  if (absDiff < 60) {
    return "Just now";
  }

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absDiff < 3600) {
    return rtf.format(Math.floor(diffInSeconds / 60), "minute");
  }

  if (absDiff < 86400) {
    return rtf.format(Math.floor(diffInSeconds / 3600), "hour");
  }

  if (absDiff < 2592000) {
    return rtf.format(Math.floor(diffInSeconds / 86400), "day");
  }

  if (absDiff < 31536000) {
    return rtf.format(Math.floor(diffInSeconds / 2592000), "month");
  }

  return rtf.format(Math.floor(diffInSeconds / 31536000), "year");
}

export function formatShortDate(value: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export function truncate(value: string, maxLength = 60): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}

export function toLocalDateTimeInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
