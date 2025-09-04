import { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { HALT_STATUSES, HALT_TYPES } from '../constants';
import { reformatDateTime, getCurrentDateTime } from '../utils/dateUtils';

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

    const source = new EventSource(`${apiSSEstream}${sseTicket}`, {
      withCredentials: false,
    });

    console.log("SSE connected");

    source.onmessage = (event) => {
      const dataObj = JSON.parse(event.data);

      if (dataObj.heartbeat) {
        console.log("SSE heartbeat received", dataObj);
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

      // Format times
      if (haltTime) {
        sseBody.haltTime = reformatDateTime(haltTime);
      }
      if (resumptionTime) {
        sseBody.resumptionTime = reformatDateTime(resumptionTime);
      }

      // Handle existing halt updates
      if (haltList.includes(haltId)) {
        const prev = activeRegData.find(obj => obj.haltId === haltId);

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
        else if (haltStatus === HALT_STATUSES.HALTED && haltType === HALT_TYPES.REG && prev && extendedStatus === prev.extendedHalt) {
          const newPending = pendingData.filter(obj => obj.haltId !== haltId);
          setPendingData(newPending);
          
          const tempActiveReg = [...activeRegData, sseBody];
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
        if (haltStatus === HALT_STATUSES.HALTED && haltType === HALT_TYPES.REG) {
          const tempActiveReg = [...activeRegData, sseBody];
          setActiveRegData(tempActiveReg);
          showNotificationMessage(`New regulatory halt has been created for ${symbol}`);
          
          const tempActiveList = [...activeRegHaltList, haltId];
          setActiveRegHaltList(tempActiveList);
        } else if (haltStatus === HALT_STATUSES.RESUMPTION_PENDING && haltType === HALT_TYPES.SSCB) {
          const tempActiveSSCB = [...activeSSCBData, sseBody];
          setActiveSSCBData(tempActiveSSCB);
          showNotificationMessage(`New SSCB halt has been created for ${symbol}`);
        } else if (haltStatus === HALT_STATUSES.HALT_PENDING) {
          const tempPending = [...pendingData, sseBody];
          setPendingData(tempPending);
          showNotificationMessage(`New regulatory halt has been scheduled for ${symbol}`);
        }
      }
    };

    source.onerror = (err) => {
      console.error("SSE error:", err);
      source.close();
    };

    return () => {
      source.close();
      clearTimeout(timeoutRef.current);
    };
  }, [sseTicket, haltList, activeRegData, activeRegHaltList, activeSSCBData, liftedData, pendingData, notExtendedList]);

  return {
    getSSETicket,
    sseMessage,
    notification,
    showNotification,
    hideNotification
  };
};