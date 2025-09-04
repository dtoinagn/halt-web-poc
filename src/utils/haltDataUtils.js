import { HALT_STATUSES, HALT_TYPES } from '../constants';
import { reformatDateTime, roundUpDateTime, isHaltedSameDay } from './dateUtils';

export const processHaltData = (data) => {
  const processedData = {
    activeRegData: [],
    activeSSCBData: [],
    liftedData: [],
    pendingData: [],
    haltList: [],
    activeRegHaltList: [],
    notExtendedList: []
  };

  data.forEach(item => {
    const haltId = item.haltId;
    processedData.haltList.push(haltId);

    const haltType = item.haltType;
    const haltStatus = item.status;
    const resumptionTime = item.resumptionTime ? new Date(item.resumptionTime) : null;
    const haltedSameDay = resumptionTime ? isHaltedSameDay(null, resumptionTime) : false;
    const extendedStatus = item.extendedHalt;

    // Format times
    if (item.haltTime) {
      item.haltTime = reformatDateTime(item.haltTime);
      if (item.haltType === HALT_TYPES.REG) {
        item.haltTime = roundUpDateTime(item.haltTime);
      }
    }

    if (item.resumptionTime) {
      item.resumptionTime = reformatDateTime(item.resumptionTime);
      item.resumptionTime = roundUpDateTime(item.resumptionTime);
    }

    // Truncate issue name if too long
    if (typeof item.issueName === 'string' && item.issueName.length > 25) {
      item.issueName = item.issueName.slice(0, 25);
    }

    // Categorize data based on status and type
    if (haltStatus === HALT_STATUSES.RESUMED && haltedSameDay) {
      processedData.liftedData.push(item);
    } else if (
      (haltStatus === HALT_STATUSES.HALTED || haltStatus === HALT_STATUSES.RESUMPTION_PENDING) && 
      haltType === HALT_TYPES.REG
    ) {
      processedData.activeRegData.push(item);
      processedData.activeRegHaltList.push(haltId);
    } else if (
      (haltStatus === HALT_STATUSES.RESUMPTION_PENDING || haltStatus === HALT_STATUSES.HALTED) && 
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
      (haltStatus === HALT_STATUSES.HALTED || haltStatus === HALT_STATUSES.RESUMPTION_PENDING)
    ) {
      processedData.notExtendedList.push(haltId);
    }
  });

  return processedData;
};

export const buildHaltPayload = (haltData) => {
  const payload = {
    haltId: haltData.haltId,
    symbol: haltData.symbol || '',
    issueName: haltData.issueName || '',
    listingMarket: haltData.listingMarket || '',
    allIssue: haltData.allIssue || '',
    haltTime: '',
    resumptionTime: '',
    cancelTime: '',
    extendedHalt: haltData.extendedHalt,
    haltReason: haltData.haltReason || '',
    remainReason: haltData.remainReason || '',
    status: haltData.status || '',
    haltType: haltData.haltType || '',
    createdBy: haltData.createdBy || '',
    createdTime: '',
    modifiedBy: haltData.modifiedBy || '',
    modifiedTime: '',
    sscbSrc: haltData.sscbSrc || '',
    responseMessage: haltData.responseMessage || '',
    id: haltData.id || ''
  };

  return payload;
};