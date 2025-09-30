import { HALT_STATUSES, HALT_TYPES } from "../constants";
import { isHaltedSameDay, DATETIME_FORMATS } from "./dateUtils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const EST_ZONE = "America/New_York";

// Helper function to safely format datetime for dashboard display
const formatDateTimeForDashboard = (dateTimeString) => {
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

export const processHaltData = (data) => {
  const processedData = {
    activeRegData: [],
    activeSSCBData: [],
    liftedData: [],
    pendingData: [],
    haltList: [],
    activeRegHaltList: [],
    notExtendedList: [],
  };

  data.forEach((item) => {
    const haltId = item.haltId;
    processedData.haltList.push(haltId);

    const haltType = item.haltType;
    const haltStatus = item.status;
    const resumptionTime = item.resumptionTime
      ? new Date(item.resumptionTime)
      : null;
    const haltedSameDay = resumptionTime
      ? isHaltedSameDay(null, resumptionTime)
      : false;
    const extendedStatus = item.extendedHalt;

    // Format times for dashboard display (YYYY-MM-DD HH:mm:ss without milliseconds)
    if (item.haltTime) {
      item.haltTime = formatDateTimeForDashboard(item.haltTime);
    }

    if (item.resumptionTime) {
      item.resumptionTime = formatDateTimeForDashboard(item.resumptionTime);
    }

    // Truncate issue name if too long
    if (typeof item.issueName === "string" && item.issueName.length > 25) {
      item.issueName = item.issueName.slice(0, 25);
    }

    // Categorize data based on status and type
    if (haltStatus === HALT_STATUSES.RESUMED && haltedSameDay) {
      processedData.liftedData.push(item);
    } else if (
      (haltStatus === HALT_STATUSES.HALTED ||
        haltStatus === HALT_STATUSES.RESUMPTION_PENDING) &&
      haltType === HALT_TYPES.REG
    ) {
      processedData.activeRegData.push(item);
      processedData.activeRegHaltList.push(haltId);
    } else if (
      (haltStatus === HALT_STATUSES.RESUMPTION_PENDING ||
        haltStatus === HALT_STATUSES.HALTED) &&
      haltType === HALT_TYPES.SSCB
    ) {
      processedData.activeSSCBData.push(item);
    } else if (haltStatus === HALT_STATUSES.HALT_PENDING) {
      processedData.pendingData.push(item);
    }

    // Track non-extended halts
    if (
      extendedStatus === false &&
      haltType === HALT_TYPES.REG &&
      (haltStatus === HALT_STATUSES.HALTED ||
        haltStatus === HALT_STATUSES.RESUMPTION_PENDING)
    ) {
      processedData.notExtendedList.push(haltId);
    }
  });

  return processedData;
};

export const buildHaltPayload = (haltData) => {
  const payload = {
    haltId: haltData.haltId,
    symbol: haltData.symbol || "",
    issueName: haltData.issueName || "",
    listingMarket: haltData.listingMarket || "",
    allIssue: haltData.allIssue || "",
    haltTime: "",
    resumptionTime: "",
    cancelTime: "",
    extendedHalt: haltData.extendedHalt,
    haltReason: haltData.haltReason || "",
    remainReason: haltData.remainReason || "",
    status: haltData.status || "",
    haltType: haltData.haltType || "",
    createdBy: haltData.createdBy || "",
    createdTime: "",
    modifiedBy: haltData.modifiedBy || "",
    modifiedTime: "",
    sscbSrc: haltData.sscbSrc || "",
    responseMessage: haltData.responseMessage || "",
    id: haltData.id || "",
  };

  return payload;
};
