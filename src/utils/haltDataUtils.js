import { HALT_STATES } from "../constants";
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

    const haltState = item.state;
    const haltedSameDay = item.resumptionTime
      ? isHaltedSameDay(null, new Date(item.resumptionTime))
      : false;
    const extendedStatus = item.extendedHalt;
    const remainedHalt = item.remainedHalt;

    // Truncate issue name if too long
    if (typeof item.issueName === "string" && item.issueName.length > 25) {
      item.issueName = item.issueName.slice(0, 25);
    }

    // Categorize data based on state
    if (haltState === HALT_STATES.ACTIVE_TRADING && haltedSameDay) {
      processedData.liftedData.push(item);
    } else if (haltState === HALT_STATES.ACTIVE_REG_HALT) {
      processedData.activeRegData.push(item);
      processedData.activeRegHaltList.push(haltId);

      // Track extended/remained halts
      if (extendedStatus === true || remainedHalt === true) {
        if (!processedData.extendedRegHaltIds.includes(haltId)) {
          processedData.extendedRegHaltIds.push(haltId);
        }
      }
    } else if (haltState === HALT_STATES.ACTIVE_SSCB_HALT) {
      processedData.activeSSCBData.push(item);
    } else if (haltState === HALT_STATES.PENDING_HALT) {
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
    haltReasonDescription: haltData.haltReasonDescription || "",
    haltReasonCode: haltData.haltReasonCode || "",
    haltReasonType: haltData.haltReasonType || "",
    remainReason: haltData.remainReason || "",
    state: haltData.state || "",
    haltType: haltData.haltType || "",
    createdBy: haltData.createdBy || "",
    createdTime: haltData.createdTime ? formatForBackend(haltData.createdTime) : "",
    lastModifiedBy: authUtils.getLoggedInUser() || '',
    lastModifiedTime: haltData.lastModifiedTime ? formatForBackend(haltData.lastModifiedTime) : "",
    sscbSource: haltData.sscbSource || "",
    responseMessage: haltData.responseMessage || "",
    comment: haltData.comment || "",
  };

  return payload;
};
