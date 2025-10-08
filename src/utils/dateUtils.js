import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const EST_ZONE = "America/New_York";

// Datetime formatting constants
export const DATETIME_FORMATS = {
  DASHBOARD: "YYYY-MM-DD HH:mm:ss", // For Dashboard display (no milliseconds)
  BACKEND: "YYYYMMDD-HH:mm:ss.SSS", // For backend API calls
  HALT_DETAIL: "YYYY-MM-DD HH:mm:ss:SSS", // For Halt Detail popup
  DATETIME_LOCAL: "YYYY-MM-DDTHH:mm", // For datetime-local inputs
};

// Helper function to safely format datetime for dashboard display
export const formatDateTimeForDashboard = (dateTimeString) => {
  if (!dateTimeString) return null;

  try {
    // Handle different possible formats
    let date;

    // Check if it's already in compact format (YYYYMMDD-HH:mm:ss.SSS)
    const compactMatch = dateTimeString.match(
      /^(\d{8})-(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/
    );
    if (compactMatch) {
      const [, dateStr, hours, minutes, seconds, milliseconds] = compactMatch;
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);

      // Create a proper ISO string for parsing
      const isoString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
      date = dayjs.tz(isoString, EST_ZONE);
    } else {
      // Try to parse as regular datetime string
      date = dayjs.tz(dateTimeString, EST_ZONE);
    }

    // Validate the parsed date
    if (!date.isValid()) {
      console.warn("Invalid datetime in processHaltData:", dateTimeString);
      return dateTimeString; // Return original if can't parse
    }

    // Format for dashboard display (YYYY-MM-DD HH:mm:ss)
    return date.format(DATETIME_FORMATS.DASHBOARD);
  } catch (error) {
    console.error(
      "Error formatting datetime in processHaltData:",
      error,
      "Input:",
      dateTimeString
    );
    return dateTimeString; // Return original on error
  }
};

// Generic function to format datetime in EST timezone
export const formatDateTimeEST = (
  dateTimeString,
  format = DATETIME_FORMATS.DASHBOARD
) => {
  if (!dateTimeString) return null;

  try {

    // Check if it's already in compact format (YYYYMMDD-HH:mm:ss.SSS)
    const compactMatch = dateTimeString.match(
      /^(\d{8})-(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/
    );
    if (compactMatch) {
      return dateTimeString; // Already in backend format
    }
    // Parse and convert to EST timezone
    const date = dayjs.tz(dateTimeString, EST_ZONE);

    // Check if the parsed date is valid
    if (!date.isValid()) {
      console.warn("Invalid datetime value:", dateTimeString);
      return dateTimeString; // Return original value if parsing fails
    }

    return date.format(format);
  } catch (error) {
    console.error(
      "Error formatting datetime:",
      error,
      "Input:",
      dateTimeString
    );
    return dateTimeString; // Return original value on error
  }
};

// Specific formatting functions for different use cases
export const formatForDashboard = (dateTimeString) => {
  return formatDateTimeEST(dateTimeString, DATETIME_FORMATS.DASHBOARD);
};

export const formatForBackend = (dateTimeString) => {
  return formatDateTimeEST(dateTimeString, DATETIME_FORMATS.BACKEND);
};

export const formatForHaltDetail = (dateTimeString) => {
  return formatDateTimeEST(dateTimeString, DATETIME_FORMATS.HALT_DETAIL);
};

export const formatForDateTimeLocal = (dateTimeString) => {
  return formatDateTimeEST(dateTimeString, DATETIME_FORMATS.DATETIME_LOCAL);
};

// Get current datetime in EST for different formats
export const getCurrentESTDateTime = (format = DATETIME_FORMATS.DASHBOARD) => {
  return dayjs().tz(EST_ZONE).format(format);
};

// Legacy function - kept for backward compatibility
export const formatDashboard = (dateTimeString) => {
  return formatForDashboard(dateTimeString);
};

const parseCompactDateTime = (compactString) => {
  if (!compactString || typeof compactString !== "string") return null;

  const match = compactString.match(
    /^(\d{8})-(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/
  );
  if (!match) return null;

  const [, dateStr, hours, minutes, seconds, milliseconds] = match;
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  // Create date in EST timezone
  const dateString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  return dayjs.tz(dateString, EST_ZONE).toDate();
};

// Convert Date object to backend format in EST timezone
const formatToBackendDateTime = (date) => {
  if (!date || !(date instanceof Date)) return null;

  // Convert to EST timezone first
  const estDate = dayjs(date).tz(EST_ZONE);
  return estDate.format(DATETIME_FORMATS.BACKEND);
};

// Legacy function - kept for backward compatibility
const formatToCompactDateTime = (date) => {
  return formatToBackendDateTime(date);
};

export const formatDateTime = (isoString) => {
  if (!isoString) return null;
  try {
    const compactDate = parseCompactDateTime(isoString);
    if (compactDate) {
      return compactDate.toISOString();
    }
    return new Date(isoString).toISOString();
  } catch {
    return isoString;
  }
};

export const reformatDateTime = (dateTimeString) => {
  if (!dateTimeString) return dateTimeString;

  const compactDate = parseCompactDateTime(dateTimeString);
  if (compactDate) {
    return formatToBackendDateTime(compactDate);
  }

  // For ISO format strings, convert to backend format
  try {
    return formatForBackend(dateTimeString);
  } catch {
    return dateTimeString.replace(/T/g, " ");
  }
};

export const roundUpDateTime = (dateTimeString) => {
  if (!dateTimeString) return dateTimeString;

  let date = parseCompactDateTime(dateTimeString);
  if (!date) {
    // Parse as EST timezone
    date = dayjs.tz(dateTimeString, EST_ZONE).toDate();
  }

  // Work with EST timezone
  let estDate = dayjs(date).tz(EST_ZONE);
  if (estDate.millisecond() > 0) {
    estDate = estDate.add(1, "second").millisecond(0);
  }

  return formatToBackendDateTime(estDate.toDate());
};

export const isHaltedSameDay = (haltTime, resumptionTime) => {
  // Get current time in EST
  const currTimeEST = dayjs().tz(EST_ZONE);

  let resumption = parseCompactDateTime(resumptionTime);
  if (!resumption) {
    // Parse as EST timezone
    resumption = dayjs.tz(resumptionTime, EST_ZONE).toDate();
  }

  // Convert resumption to EST for comparison
  const resumptionEST = dayjs(resumption).tz(EST_ZONE);

  return (
    currTimeEST.year() === resumptionEST.year() &&
    currTimeEST.month() === resumptionEST.month() &&
    currTimeEST.date() === resumptionEST.date()
  );
};

export const getCurrentDateTime = () => {
  return getCurrentESTDateTime(DATETIME_FORMATS.BACKEND);
};

/**
 * Compare two date/time values by date, hour, minute, and second (ignores ms).
 * Returns:
 *   -1 if a < b
 *    0 if a == b
 *    1 if a > b
 */
export function compareDateTimeToSecond(a, b) {
  const d1 = new Date(a);
  const d2 = new Date(b);

  const vals1 = [
    d1.getFullYear(),
    d1.getMonth(),
    d1.getDate(),
    d1.getHours(),
    d1.getMinutes(),
    d1.getSeconds(),
  ];
  const vals2 = [
    d2.getFullYear(),
    d2.getMonth(),
    d2.getDate(),
    d2.getHours(),
    d2.getMinutes(),
    d2.getSeconds(),
  ];

  for (let i = 0; i < vals1.length; i++) {
    if (vals1[i] < vals2[i]) return -1;
    if (vals1[i] > vals2[i]) return 1;
  }
  return 0;
}
