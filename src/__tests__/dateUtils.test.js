import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  DATETIME_FORMATS,
  formatDateTimeForDashboard,
  formatDateTimeEST,
  formatForDashboard,
  formatForBackend,
  formatForHaltDetail,
  formatForDateTimeLocal,
  getCurrentESTDateTime,
  formatDateTime,
  reformatDateTime,
  roundUpDateTime,
  isHaltedSameDay,
  getCurrentDateTime,
  compareDateTimeToSecond,
} from "../utils/dateUtils";

dayjs.extend(utc);
dayjs.extend(timezone);

describe("dateUtils", () => {
  describe("DATETIME_FORMATS", () => {
    it("should have correct format constants", () => {
      expect(DATETIME_FORMATS.DASHBOARD).toBe("YYYY-MM-DD HH:mm:ss");
      expect(DATETIME_FORMATS.BACKEND).toBe("YYYYMMDD-HH:mm:ss.SSS");
      expect(DATETIME_FORMATS.HALT_DETAIL).toBe("YYYY-MM-DD HH:mm:ss:SSS");
      expect(DATETIME_FORMATS.DATETIME_LOCAL).toBe("YYYY-MM-DDTHH:mm");
    });
  });

  describe("formatDateTimeForDashboard", () => {
    it("should return null for empty input", () => {
      expect(formatDateTimeForDashboard(null)).toBeNull();
      expect(formatDateTimeForDashboard(undefined)).toBeNull();
      expect(formatDateTimeForDashboard("")).toBeNull();
    });

    it("should format compact datetime format (YYYYMMDD-HH:mm:ss.SSS)", () => {
      const result = formatDateTimeForDashboard("20241015-14:30:45.123");
      expect(result).toBe("2024-10-15 14:30:45");
    });

    it("should format ISO datetime string", () => {
      const result = formatDateTimeForDashboard("2024-10-15T14:30:45");
      expect(result).toMatch(/2024-10-15 \d{2}:\d{2}:\d{2}/);
    });

    it("should return original string for invalid datetime", () => {
      const invalid = "invalid-date";
      const result = formatDateTimeForDashboard(invalid);
      expect(result).toBe(invalid);
    });
  });

  describe("formatDateTimeEST", () => {
    it("should return null for empty input", () => {
      expect(formatDateTimeEST(null)).toBeNull();
      expect(formatDateTimeEST(undefined)).toBeNull();
      expect(formatDateTimeEST("")).toBeNull();
    });

    it("should format datetime to dashboard format by default", () => {
      const result = formatDateTimeEST("2024-10-15T14:30:45");
      expect(result).toMatch(/2024-10-15 \d{2}:\d{2}:\d{2}/);
    });

    it("should return compact format unchanged", () => {
      const compactDate = "20241015-14:30:45.123";
      const result = formatDateTimeEST(compactDate);
      expect(result).toBe(compactDate);
    });

    it("should format to specified format", () => {
      const result = formatDateTimeEST(
        "2024-10-15T14:30:45",
        DATETIME_FORMATS.HALT_DETAIL
      );
      expect(result).toMatch(/2024-10-15 \d{2}:\d{2}:\d{2}:\d{3}/);
    });

    it("should return original for invalid datetime", () => {
      const invalid = "not-a-date";
      expect(formatDateTimeEST(invalid)).toBe(invalid);
    });
  });

  describe("formatForDashboard", () => {
    it("should format datetime for dashboard display", () => {
      const result = formatForDashboard("2024-10-15T14:30:45.123");
      expect(result).toMatch(/2024-10-15 \d{2}:\d{2}:\d{2}/);
    });
  });

  describe("formatForBackend", () => {
    it("should format datetime for backend API", () => {
      const result = formatForBackend("2024-10-15T14:30:45.123");
      expect(result).toMatch(/\d{8}-\d{2}:\d{2}:\d{2}\.\d{3}/);
    });

    it("should return compact format unchanged", () => {
      const compactDate = "20241015-14:30:45.123";
      expect(formatForBackend(compactDate)).toBe(compactDate);
    });
  });

  describe("formatForHaltDetail", () => {
    it("should format datetime for halt detail popup", () => {
      const result = formatForHaltDetail("2024-10-15T14:30:45.123");
      expect(result).toMatch(/2024-10-15 \d{2}:\d{2}:\d{2}:\d{3}/);
    });
  });

  describe("formatForDateTimeLocal", () => {
    it("should format datetime for datetime-local input", () => {
      const result = formatForDateTimeLocal("2024-10-15T14:30:45.123");
      expect(result).toMatch(/2024-10-15T\d{2}:\d{2}/);
    });
  });

  describe("getCurrentESTDateTime", () => {
    it("should return current datetime in EST with default format", () => {
      const result = getCurrentESTDateTime();
      expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it("should return current datetime in EST with custom format", () => {
      const result = getCurrentESTDateTime(DATETIME_FORMATS.BACKEND);
      expect(result).toMatch(/\d{8}-\d{2}:\d{2}:\d{2}\.\d{3}/);
    });
  });

  describe("getCurrentDateTime", () => {
    it("should return current datetime in backend format", () => {
      const result = getCurrentDateTime();
      expect(result).toMatch(/\d{8}-\d{2}:\d{2}:\d{2}\.\d{3}/);
    });
  });

  describe("formatDateTime", () => {
    it("should return null for empty input", () => {
      expect(formatDateTime(null)).toBeNull();
      expect(formatDateTime(undefined)).toBeNull();
      expect(formatDateTime("")).toBeNull();
    });

    it("should convert compact datetime to ISO string", () => {
      const result = formatDateTime("20241015-14:30:45.123");
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should convert ISO string", () => {
      const isoString = "2024-10-15T14:30:45.123Z";
      const result = formatDateTime(isoString);
      expect(result).toBe(isoString);
    });

    it("should return original for invalid datetime", () => {
      const invalid = "invalid";
      expect(formatDateTime(invalid)).toBe(invalid);
    });
  });

  describe("reformatDateTime", () => {
    it("should return input if empty", () => {
      expect(reformatDateTime(null)).toBeNull();
      expect(reformatDateTime(undefined)).toBeUndefined();
      expect(reformatDateTime("")).toBe("");
    });

    it("should reformat compact datetime to backend format", () => {
      const result = reformatDateTime("20241015-14:30:45.123");
      expect(result).toMatch(/\d{8}-\d{2}:\d{2}:\d{2}\.\d{3}/);
    });

    it("should convert ISO format to backend format", () => {
      const result = reformatDateTime("2024-10-15T14:30:45.123");
      expect(result).toMatch(/\d{8}-\d{2}:\d{2}:\d{2}\.\d{3}/);
    });
  });

  describe("roundUpDateTime", () => {
    it("should return input if empty", () => {
      expect(roundUpDateTime(null)).toBeNull();
      expect(roundUpDateTime(undefined)).toBeUndefined();
      expect(roundUpDateTime("")).toBe("");
    });

    it("should round up milliseconds to next second for compact format", () => {
      const result = roundUpDateTime("20241015-14:30:45.123");
      expect(result).toBe("20241015-14:30:46.000");
    });

    it("should not change time if no milliseconds", () => {
      const result = roundUpDateTime("20241015-14:30:45.000");
      expect(result).toBe("20241015-14:30:45.000");
    });

    it("should round up ISO format datetime", () => {
      const result = roundUpDateTime("2024-10-15T14:30:45.123");
      expect(result).toMatch(/\d{8}-14:30:46\.000/);
    });
  });

  describe("isHaltedSameDay", () => {
    it("should return true if resumption time is today", () => {
      const now = dayjs().tz("America/New_York");
      const todayCompact = now.format("YYYYMMDD-HH:mm:ss.SSS");
      const result = isHaltedSameDay("20241015-09:00:00.000", todayCompact);
      expect(result).toBe(true);
    });

    it("should return false if resumption time is not today", () => {
      const yesterday = dayjs()
        .tz("America/New_York")
        .subtract(1, "day")
        .format("YYYYMMDD-HH:mm:ss.SSS");
      const result = isHaltedSameDay("20241015-09:00:00.000", yesterday);
      expect(result).toBe(false);
    });
  });

  describe("compareDateTimeToSecond", () => {
    it("should return 0 for equal dates (ignoring milliseconds)", () => {
      const date1 = "2024-10-15T14:30:45.123Z";
      const date2 = "2024-10-15T14:30:45.999Z";
      expect(compareDateTimeToSecond(date1, date2)).toBe(0);
    });

    it("should return -1 when first date is earlier", () => {
      const date1 = "2024-10-15T14:30:44.000Z";
      const date2 = "2024-10-15T14:30:45.000Z";
      expect(compareDateTimeToSecond(date1, date2)).toBe(-1);
    });

    it("should return 1 when first date is later", () => {
      const date1 = "2024-10-15T14:30:46.000Z";
      const date2 = "2024-10-15T14:30:45.000Z";
      expect(compareDateTimeToSecond(date1, date2)).toBe(1);
    });

    it("should compare by year correctly", () => {
      const date1 = "2023-10-15T14:30:45.000Z";
      const date2 = "2024-10-15T14:30:45.000Z";
      expect(compareDateTimeToSecond(date1, date2)).toBe(-1);
    });

    it("should compare by month correctly", () => {
      const date1 = "2024-09-15T14:30:45.000Z";
      const date2 = "2024-10-15T14:30:45.000Z";
      expect(compareDateTimeToSecond(date1, date2)).toBe(-1);
    });

    it("should compare by day correctly", () => {
      const date1 = "2024-10-14T14:30:45.000Z";
      const date2 = "2024-10-15T14:30:45.000Z";
      expect(compareDateTimeToSecond(date1, date2)).toBe(-1);
    });

    it("should compare by hour correctly", () => {
      const date1 = "2024-10-15T13:30:45.000Z";
      const date2 = "2024-10-15T14:30:45.000Z";
      expect(compareDateTimeToSecond(date1, date2)).toBe(-1);
    });

    it("should compare by minute correctly", () => {
      const date1 = "2024-10-15T14:29:45.000Z";
      const date2 = "2024-10-15T14:30:45.000Z";
      expect(compareDateTimeToSecond(date1, date2)).toBe(-1);
    });
  });
});
