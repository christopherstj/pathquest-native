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

/**
 * Safely parse a date string, handling various formats including date-only strings
 * Returns null if the date is invalid
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    // Handle date-only strings (YYYY-MM-DD) by appending time to ensure proper parsing
    const trimmed = dateString.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      // Date-only format - append time to ensure consistent parsing
      const date = new Date(`${trimmed}T00:00:00`);
      if (isNaN(date.getTime())) return null;
      return date;
    }
    
    // Try parsing as-is (handles ISO strings, timestamps, etc.)
    const date = new Date(trimmed);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

/**
 * Format a date string to a readable date format
 * Returns null if the date is invalid
 */
export function formatDateString(dateString: string | null | undefined, options?: Intl.DateTimeFormatOptions): string | null {
  const date = parseDate(dateString);
  if (!date) return null;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  
  return date.toLocaleDateString(undefined, { ...defaultOptions, ...options });
}


