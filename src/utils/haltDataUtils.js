import { HALT_STATUSES, HALT_TYPES } from "../constants";
import { isHaltedSameDay, formatForBackend } from "./dateUtils";
import { authUtils } from "./storageUtils";

export const processHaltData = (data) => {
  const processedData = {
    activeRegData: [],
    activeSSCBData: [],
    liftedData: [],
    pendingData: [],
    haltList: [],
    activeRegHaltList: [],
    extendedRegHaltIds: [],
  };

  data.forEach((item) => {
    const haltId = item.haltId;
    processedData.haltList.push(haltId);

    const haltType = item.haltType;
    const haltStatus = item.status;
    const haltedSameDay = item.resumptionTime
      ? isHaltedSameDay(null,  new Date(item.resumptionTime))
      : false;
    const extendedStatus = item.extendedHalt;
    const remainedHalt = item.remainedHalt;

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

      // Track extended halts
      if (extendedStatus === true || remainedHalt === true) {
        if (!processedData.extendedRegHaltIds.includes(haltId)) {
          processedData.extendedRegHaltIds.push(haltId);
        }
      }
    } else if (
      (haltStatus === HALT_STATUSES.RESUMPTION_PENDING ||
        haltStatus === HALT_STATUSES.HALTED) &&
      haltType === HALT_TYPES.SSCB
    ) {
      processedData.activeSSCBData.push(item);
    } else if (haltStatus === HALT_STATUSES.HALT_PENDING || haltStatus === HALT_STATUSES.HALT_SCHEDULED || haltStatus === HALT_STATUSES.HALT_PENDING_CANCELLED) {
      processedData.pendingData.push(item);
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
    // Format haltTime for backend: "YYYYMMDD-HH:mm:ss.SSS" in EST
    haltTime: haltData.haltTime
      ? formatForBackend(haltData.haltTime)
      : "",
    resumptionTime: haltData.resumptionTime
      ? formatForBackend(haltData.resumptionTime)
      : "",
    extendedHalt: haltData.extendedHalt,
    remainedHalt: haltData.remainedHalt,
    haltReason: haltData.haltReason || "",
    remainReason: haltData.remainReason || "",
    status: haltData.status || "",
    haltType: haltData.haltType || "",
    createdBy: haltData.createdBy || "",
    createdTime: haltData.createdTime ? formatForBackend(haltData.createdTime) : "",
    lastModifiedBy: authUtils.getLoggedInUser() || '',
    lastModifiedTime: haltData.lastModifiedTime ? formatForBackend(haltData.lastModifiedTime) : "",
    sscbSrc: haltData.sscbSrc || "",
    responseMessage: haltData.responseMessage || "",
    comment: haltData.comment || "",
  };

  return payload;
};
