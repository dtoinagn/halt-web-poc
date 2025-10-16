import { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { HALT_STATUSES, HALT_TYPES } from '../constants';
import { getCurrentDateTime, formatDateTimeForDashboard } from '../utils/dateUtils';

export const useSSE = ({
  haltList,
  activeRegData,
  activeRegHaltList,
  activeSSCBData,
  liftedData,
  pendingData,
  notExtendedList,
  setActiveRegData,
  setActiveSSCBData,
  setLiftedData,
  setPendingData,
  setActiveRegHaltList,
  setNotExtendedList
}) => {
  const [sseTicket, setSSETicket] = useState("");
  const [sseMessage, setSSEMessage] = useState('');
  const [notification, setNotification] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const timeoutRef = useRef(null);

  // NEW: keep EventSource in a ref so it's created only once per ticket
  const sourceRef = useRef(null);

  // NEW: refs for the latest data so the SSE handler can read up-to-date values
  const haltListRef = useRef(haltList);
  const activeRegDataRef = useRef(activeRegData);
  const activeRegHaltListRef = useRef(activeRegHaltList);
  const activeSSCBDataRef = useRef(activeSSCBData);
  const liftedDataRef = useRef(liftedData);
  const pendingDataRef = useRef(pendingData);
  const notExtendedListRef = useRef(notExtendedList);

  // Sync incoming props/state into refs when they change (doesn't re-create EventSource)
  useEffect(() => { haltListRef.current = haltList; }, [haltList]);
  useEffect(() => { activeRegDataRef.current = activeRegData; }, [activeRegData]);
  useEffect(() => { activeRegHaltListRef.current = activeRegHaltList; }, [activeRegHaltList]);
  useEffect(() => { activeSSCBDataRef.current = activeSSCBData; }, [activeSSCBData]);
  useEffect(() => { liftedDataRef.current = liftedData; }, [liftedData]);
  useEffect(() => { pendingDataRef.current = pendingData; }, [pendingData]);
  useEffect(() => { notExtendedListRef.current = notExtendedList; }, [notExtendedList]);

  const getSSETicket = async () => {
    try {
      const data = await apiService.getSSETicket();
      const ticket = data.sseTicket;
      setSSETicket(ticket);
      console.log("Got SSE ticket:", ticket);
    } catch (err) {
      console.error("Failed to get SSE ticket:", err);
    }
  };

  const showNotificationMessage = (message) => {
    setNotification(message);
    setShowNotification(true);

    clearTimeout(timeoutRef.current);
    const { notificationTimeout } = window.runConfig || { notificationTimeout: 3000 };
    timeoutRef.current = setTimeout(() => {
      setShowNotification(false);
    }, notificationTimeout);
  };

  const hideNotification = () => {
    setShowNotification(false);
    clearTimeout(timeoutRef.current);
  };

  useEffect(() => {
    if (!sseTicket) return;

    const { apiSSEstream } = window.runConfig || {};
    if (!apiSSEstream) return;

    // If an EventSource already exists for this ticket, don't recreate it.
    if (sourceRef.current) {
      // If you want to handle ticket changes by recreating, close previous and null out here.
      // For "create only once" behavior, just return.
      return;
    }

    const source = new EventSource(`${apiSSEstream}${sseTicket}`, {
      withCredentials: false,
    });
    sourceRef.current = source;

    console.log("SSE connected");

    source.onmessage = (event) => {
      const dataObj = JSON.parse(event.data);

      if (dataObj.heartbeat) {
        return;
      }

      setSSEMessage(event.data);
      console.log("SSE message received", dataObj);

      const sseBody = JSON.parse(event.data);
      const haltStatus = sseBody.status;
      const haltId = sseBody.haltId;
      const haltTime = sseBody.haltTime;
      const resumptionTime = sseBody.resumptionTime;
      const haltType = sseBody.haltType;
      const extendedStatus = sseBody.extendedHalt;
      const symbol = sseBody.symbol;

      // Format times for dashboard display (YYYY-MM-DD HH:mm:ss without milliseconds)
      if (haltTime) {
        sseBody.haltTime = formatDateTimeForDashboard(haltTime);
      }
      if (resumptionTime) {
        sseBody.resumptionTime = formatDateTimeForDashboard(resumptionTime);
      }

      // Use refs instead of stale state variables
      const haltList = haltListRef.current;
      const activeRegData = activeRegDataRef.current;
      const activeRegHaltList = activeRegHaltListRef.current;
      const activeSSCBData = activeSSCBDataRef.current;
      const liftedData = liftedDataRef.current;
      const pendingData = pendingDataRef.current;
      const notExtendedList = notExtendedListRef.current;

      // Handle existing halt updates
      if (haltList.includes(haltId)) {
        const prev = activeRegData.find(obj => obj.haltId === haltId);
        if (prev) console.log("Find previous obj", prev);
        // Extended status change
        if (activeRegHaltList.includes(haltId) && prev && extendedStatus !== prev.extendedHalt &&
          (haltStatus === HALT_STATUSES.RESUMPTION_PENDING || haltStatus === HALT_STATUSES.HALTED)) {
          let tempNotExtend = [...notExtendedList];
          if (extendedStatus) {
            tempNotExtend = tempNotExtend.filter(obj => obj !== haltId);
            showNotificationMessage(`Halt has been marked as extended for ${symbol}`);
          } else {
            tempNotExtend.push(haltId);
            showNotificationMessage(`Halt has been marked as non-extended for ${symbol}`);
          }

          setNotExtendedList(tempNotExtend);
          const tempActiveReg = activeRegData.filter(obj => obj.haltId !== haltId);
          tempActiveReg.push(sseBody);
          setActiveRegData(tempActiveReg);
        }
        // REG Halt resumed
        else if (haltStatus === HALT_STATUSES.RESUMED && haltType === HALT_TYPES.REG) {
          const newActive = activeRegData.filter(obj => obj.haltId !== haltId);
          setActiveRegData(newActive);
          if (!resumptionTime) {
            sseBody.resumptionTime = getCurrentDateTime();
          }

          const tempLifted = [...liftedData, sseBody];
          setLiftedData(tempLifted);
          showNotificationMessage(`Halt has been resumed for ${symbol}`);

          const tempActiveRegHaltList = activeRegHaltList.filter(id => id !== haltId);
          setActiveRegHaltList(tempActiveRegHaltList);
        }
        // SSCB Halt resumed
        else if (haltStatus === HALT_STATUSES.RESUMED && haltType === HALT_TYPES.SSCB) {
          const newSSCB = activeSSCBData.filter(obj => obj.haltId !== haltId);
          setActiveSSCBData(newSSCB);
          const tempLifted = [...liftedData, sseBody];
          setLiftedData(tempLifted);
          showNotificationMessage(`Halt has been resumed for ${symbol}`);
        }
        // Resumption time set
        else if (activeRegHaltList.includes(haltId) && haltStatus === HALT_STATUSES.RESUMPTION_PENDING && haltType === HALT_TYPES.REG) {
          const tempActiveReg = activeRegData.filter(obj => obj.haltId !== haltId);
          tempActiveReg.push(sseBody);
          setActiveRegData(tempActiveReg);
          showNotificationMessage(`Resumption time has been set for ${symbol}`);
        }
        // Halt activated
        else if (haltStatus === HALT_STATUSES.HALTED && haltType === HALT_TYPES.REG) {
          const prevPending = pendingData.find(obj => obj.haltId === haltId);
          if (prevPending) {
            // Remove from pending if exists
            console.log("Find previous pending obj", prevPending);
            const newPending = pendingData.filter(obj => obj.haltId !== haltId);
            setPendingData(newPending);
            // Add to notExtendedList if not extended
            if (!notExtendedList.includes(haltId) && !extendedStatus) {
              const tempNotExtend = [...notExtendedList, haltId];
              setNotExtendedList(tempNotExtend);
            }
          }

          // Check if halt already exists in activeRegData
          const existingActiveHalt = activeRegData.find(obj => obj.haltId === haltId);
          let tempActiveReg;
          if (existingActiveHalt) {
            // Update existing halt
            tempActiveReg = activeRegData.filter(obj => obj.haltId !== haltId);
            tempActiveReg.push(sseBody);
          } else {
            // Add new halt
            tempActiveReg = [...activeRegData, sseBody];
          }
          setActiveRegData(tempActiveReg);
          showNotificationMessage(`Halt is now active for ${symbol}`);

          if (notExtendedList.includes(haltId) && extendedStatus === true) {
            const tempNotExtend = notExtendedList.filter(obj => obj !== haltId);
            setNotExtendedList(tempNotExtend);
            showNotificationMessage(`Halt has been marked as extended for ${symbol}`);
          }
        }
      }
      // Handle new halts
      else {
        // Add the new haltId to the list to track it
        haltList.push(haltId);
        if (haltStatus === HALT_STATUSES.HALTED && haltType === HALT_TYPES.REG) {
          const tempActiveReg = [...activeRegData, sseBody];
          setActiveRegData(tempActiveReg);
          showNotificationMessage(`New regulatory halt has been created for ${symbol}`);

          const tempActiveList = [...activeRegHaltList, haltId];
          setActiveRegHaltList(tempActiveList);
          notExtendedList.push(haltId);
        } else if (haltStatus === HALT_STATUSES.RESUMPTION_PENDING && haltType === HALT_TYPES.SSCB) {
          const tempActiveSSCB = [...activeSSCBData, sseBody];
          setActiveSSCBData(tempActiveSSCB);
          showNotificationMessage(`New SSCB halt has been created for ${symbol}`);
        } else if (haltStatus === HALT_STATUSES.HALT_PENDING || haltStatus === HALT_STATUSES.HALT_SCHEDULED) {
          const tempPending = [...pendingData, sseBody];
          setPendingData(tempPending);
          showNotificationMessage(`New regulatory halt has been scheduled for ${symbol}`);
        }
      }
    };

    source.onerror = (err) => {
      console.error("SSE error:", err);
      source.close();
      sourceRef.current = null;
    };

    // Cleanup when component unmounts or ticket changes explicitly (if you choose to recreate)
    return () => {
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
      clearTimeout(timeoutRef.current);
    };
  }, [sseTicket]); // <-- only depends on sseTicket so EventSource is created once per ticket

  return {
    getSSETicket,
    sseMessage,
    notification,
    showNotification,
    hideNotification
  };
};