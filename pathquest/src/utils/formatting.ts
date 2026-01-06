// Extract IANA timezone from format like "(GMT-07:00) America/Boise"
export function extractIanaTimezone(timezone?: string): string | undefined {
  if (!timezone) return undefined;
  return timezone.split(" ").slice(-1)[0];
}

export function formatDate(timestamp: string, timezone?: string): string {
  try {
    const date = new Date(timestamp);
    const ianaTimezone = extractIanaTimezone(timezone);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: ianaTimezone,
    });
  } catch {
    return timestamp;
  }
}

export function formatTime(timestamp: string, timezone?: string): string {
  try {
    const date = new Date(timestamp);
    const ianaTimezone = extractIanaTimezone(timezone);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: ianaTimezone,
    });
  } catch {
    return "";
  }
}

export function formatDateTime(timestamp: string, timezone?: string): string {
  const date = formatDate(timestamp, timezone);
  const time = formatTime(timestamp, timezone);
  return time ? `${date} at ${time}` : date;
}


