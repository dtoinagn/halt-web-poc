import { useState, useEffect, useRef, useCallback } from "react";
import { apiService } from "../services/api";
import { HALT_STATES } from "../constants";
import { getCurrentDateTime, formatDateTimeForDashboard, compareDateTimeToSecond } from "../utils/dateUtils";

/**
 * useSSE
 * - Processes SSE messages and batches updates to minimize reflows.
 * - Keeps internal refs of incoming arrays rather than mutating props.
 * - Tracks extended REG halts via unique halt_event_ids.
 */
export const useSSE = ({
  haltList = [],
  activeRegData = [],
  activeRegHaltList = [],
  activeSSCBData = [],
  liftedData = [],
  pendingData = [],
  extendedRegHaltIds = [],
  setActiveRegData = () => { },
  setActiveSSCBData = () => { },
  setLiftedData = () => { },
  setPendingData = () => { },
  setActiveRegHaltList = () => { },
  setExtendedRegHaltIds = () => { },
}) => {
  const [sseTicket, setSSETicket] = useState("");
  const [notification, setNotification] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const timeoutRef = useRef(null);

  // EventSource and internal trackers
  const sourceRef = useRef(null);
  const seenIdsRef = useRef(new Set(haltList || []));

  // Refs that always point to latest arrays (no mutation of incoming props)
  const activeRegDataRef = useRef(activeRegData);
  const activeRegHaltListRef = useRef(activeRegHaltList);
  const activeSSCBDataRef = useRef(activeSSCBData);
  const liftedDataRef = useRef(liftedData);
  const pendingDataRef = useRef(pendingData);
  const extendedRegHaltIdsRef = useRef(extendedRegHaltIds);

  // Buffer incoming messages and batch via rAF
  const pendingUpdatesRef = useRef([]);
  const rafIdRef = useRef(null);

  // Sync refs when parent updates
  useEffect(() => { activeRegDataRef.current = activeRegData; }, [activeRegData]);
  useEffect(() => { activeRegHaltListRef.current = activeRegHaltList; }, [activeRegHaltList]);
  useEffect(() => { activeSSCBDataRef.current = activeSSCBData; }, [activeSSCBData]);
  useEffect(() => { liftedDataRef.current = liftedData; }, [liftedData]);
  useEffect(() => { pendingDataRef.current = pendingData; }, [pendingData]);
  useEffect(() => { extendedRegHaltIdsRef.current = extendedRegHaltIds; }, [extendedRegHaltIds]);
  useEffect(() => {
    (haltList || []).forEach(id => seenIdsRef.current.add(id));
  }, [haltList]);

  const clearNotificationTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const showNotificationMessage = useCallback((messages) => {
    if (!messages || (Array.isArray(messages) && messages.length === 0 )) return;
    const msgArray = Array.isArray(messages) ? messages : [messages];
    setNotification(msgArray);
    setShowNotification(true);
    clearNotificationTimeout();
    const { notificationTimeout = 3000 } = window.runConfig || {};
    timeoutRef.current = setTimeout(() => setShowNotification(false), notificationTimeout);
  }, []);

  const hideNotification = useCallback(() => {
    setShowNotification(false);
    clearNotificationTimeout();
  }, []);

  const scheduleFlush = () => {
    if (rafIdRef.current != null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      const updates = pendingUpdatesRef.current.splice(0);
      if (!updates.length) return;

      // Snapshot refs (read once)
      let newActiveReg = [...(activeRegDataRef.current || [])];
      let newActiveRegList = [...(activeRegHaltListRef.current || [])];
      let newActiveSSCB = [...(activeSSCBDataRef.current || [])];
      let newLifted = [...(liftedDataRef.current || [])];
      let newPending = [...(pendingDataRef.current || [])];
      let newExtendedRegHaltIds = [...(extendedRegHaltIdsRef.current || [])];
      const notifications = new Set();

      updates.forEach((raw) => {
        try {
          const sseBody = { ...raw };
          if (sseBody.haltTime) sseBody.haltTime = formatDateTimeForDashboard(sseBody.haltTime);
          if (sseBody.resumptionTime) sseBody.resumptionTime = formatDateTimeForDashboard(sseBody.resumptionTime);

          const state = (sseBody.state || "");
          const haltId = sseBody.haltId;
          const haltType = sseBody.haltType;
          const symbol = sseBody.symbol;
          const extended = Boolean(sseBody.extendedHalt);
          const remained = Boolean(sseBody.remainedHalt);
          const action = sseBody.action;

          if (haltId) seenIdsRef.current.add(haltId);

          // 1) ACTIVE_TRADING: halt has been lifted/resumed
          if (state === HALT_STATES.ACTIVE_TRADING) {
            // If already in liftedData, just update the entry (resumption confirmation)
            const existingLiftedIdx = newLifted.findIndex(r => r.haltId === haltId);
            if (existingLiftedIdx !== -1) {
              newLifted[existingLiftedIdx] = { ...newLifted[existingLiftedIdx], ...sseBody };
              return;
            }

            // Remove from active/pending, add to lifted
            newActiveReg = newActiveReg.filter(r => r.haltId !== haltId);
            newActiveRegList = newActiveRegList.filter(id => id !== haltId);
            newActiveSSCB = newActiveSSCB.filter(r => r.haltId !== haltId);
            newPending = newPending.filter(r => r.haltId !== haltId);
            newExtendedRegHaltIds = newExtendedRegHaltIds.filter(id => id !== haltId);

            if (!sseBody.resumptionTime) sseBody.resumptionTime = getCurrentDateTime();
            newLifted.push(sseBody);
            notifications.add(`Halt has been resumed for ${symbol}`);
            return;
          }

          // 2) ACTIVE_REG_HALT: new or update to an active regulatory halt
          if (state === HALT_STATES.ACTIVE_REG_HALT) {
            const prev = newActiveReg.find(o => o.haltId === haltId);
            const pendingIdx = newPending.findIndex(p => p.haltId === haltId);
            if (pendingIdx !== -1) {
              newPending = newPending.filter(p => p.haltId !== haltId);
            }

            const existingIdx = newActiveReg.findIndex(r => r.haltId === haltId);
            if (existingIdx !== -1) {
              newActiveReg[existingIdx] = { ...newActiveReg[existingIdx], ...sseBody };

              if (prev && prev.symbol !== symbol) {
                notifications.add(`Symbol has been changed for halt ${haltId}: ${prev.symbol} → ${symbol}`);
              }
              if (prev && prev.resumptionTime !== sseBody.resumptionTime) {
                if (sseBody.resumptionTime) {
                  notifications.add(`Resumption time has been updated for ${symbol}`);
                } else {
                  notifications.add(`Resumption has been cancelled for ${symbol}`);
                }
              }
              if (prev && prev.haltReasonDescription !== sseBody.haltReasonDescription) {
                notifications.add(`Halt reason has been changed for ${symbol}`);
              }
              if (prev && extended !== prev.extendedHalt) {
                notifications.add(extended
                  ? `Halt has been marked as extended for ${symbol}`
                  : `Halt has been marked as non-extended for ${symbol}`);
                if (extended || remained) {
                  if (!newExtendedRegHaltIds.includes(haltId)) newExtendedRegHaltIds.push(haltId);
                } else {
                  newExtendedRegHaltIds = newExtendedRegHaltIds.filter(id => id !== haltId);
                }
              } else if (prev && remained !== prev.remainedHalt) {
                notifications.add(remained
                  ? `Halt has been marked as remained for ${symbol}`
                  : `Halt has been marked as non-remained for ${symbol}`);
                if (extended || remained) {
                  if (!newExtendedRegHaltIds.includes(haltId)) newExtendedRegHaltIds.push(haltId);
                } else {
                  newExtendedRegHaltIds = newExtendedRegHaltIds.filter(id => id !== haltId);
                }
              }
            } else {
              newActiveReg.push(sseBody);
              if (!newActiveRegList.includes(haltId)) newActiveRegList.push(haltId);
              if (pendingIdx !== -1) {
                notifications.add(`Scheduled halt is now active for ${symbol}`);
              } else {
                notifications.add(`New regulatory halt has been created for ${symbol}`);
              }
            }
            return;
          }

          // 3) ACTIVE_SSCB_HALT: new or update to an active SSCB halt
          if (state === HALT_STATES.ACTIVE_SSCB_HALT) {
            const idx = newActiveSSCB.findIndex(r => r.haltId === haltId);
            if (idx === -1) {
              newActiveSSCB.push(sseBody);
              notifications.add(`New SSCB halt has been created for ${symbol}`);
            } else {
              newActiveSSCB[idx] = { ...newActiveSSCB[idx], ...sseBody };
            }
            return;
          }

          // 4) PENDING_HALT: new or update to a pending/scheduled halt
          if (state === HALT_STATES.PENDING_HALT) {
            const idx = newPending.findIndex(p => p.haltId === haltId);
            if (idx === -1) {
              newPending.push(sseBody);
              notifications.add(`New regulatory halt has been scheduled for ${symbol}`);
            } else {
              if (action === "ModifyScheduledHalt") {
                let notificationMsg = "";
                if (compareDateTimeToSecond(newPending[idx].haltTime, sseBody.haltTime) !== 0) {
                  notificationMsg += `'Halt time' `;
                }
                if (newPending[idx].allIssue !== sseBody.allIssue) {
                  notificationMsg += `'All Issues' flag `;
                }
                if (newPending[idx].haltReasonDescription !== sseBody.haltReasonDescription) {
                  notificationMsg += `'Halt Reason' `;
                }
                if (notificationMsg.length > 0) {
                  notifications.add(`Scheduled halt ${symbol} has been modified: ${notificationMsg.trim()}`);
                }
              } else if (action === "CancelScheduledHalt") {
                notifications.add(`Scheduled halt has been cancelled for ${symbol}`);
              }
              newPending[idx] = { ...newPending[idx], ...sseBody };
            }
            return;
          }

          // Default: unknown state, add to pending generically
          console.log("Unhandled halt state/type, added to Pending List: ", haltId, state, haltType);
          if (!newPending.find(p => p.haltId === haltId)) newPending.push(sseBody);

        } catch (e) {
          console.error("Error processing buffered SSE message:", e);
        }
      });

      // Commit batched updates
      setActiveRegData(newActiveReg);
      setActiveRegHaltList(newActiveRegList);
      setActiveSSCBData(newActiveSSCB);
      setLiftedData(newLifted);
      setPendingData(newPending);
      setExtendedRegHaltIds(newExtendedRegHaltIds);

      // Emit consolidated notifications
      const notificationMessages = Array.from(notifications);
      if (notificationMessages.length > 0) {
        showNotificationMessage(notificationMessages);
      }
    });
  };

  useEffect(() => {
    if (!sseTicket) return;
    const { apiSSEstream } = window.runConfig || {};
    if (!apiSSEstream) return;
    if (sourceRef.current) return;

    const source = new EventSource(`${apiSSEstream}${sseTicket}`, { withCredentials: false });
    sourceRef.current = source;

    source.onmessage = (event) => {
      try {
        const dataObj = JSON.parse(event.data);
        if (dataObj?.heartbeat) return;
        pendingUpdatesRef.current.push(dataObj);
        console.log("Processing SSE message:", dataObj);
        scheduleFlush();
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    source.onerror = (err) => {
      console.error("SSE error:", err);
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
    };

    return () => {
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      clearNotificationTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sseTicket]);

  const getSSETicket = useCallback(async () => {
    try {
      const data = await apiService.getSSETicket();
      const ticket = data?.sseTicket || "";
      setSSETicket(ticket);
      console.log("Got SSE ticket:", ticket);
      return ticket;
    } catch (err) {
      console.error("Failed to get SSE ticket:", err);
      throw err;
    }
  }, []);

  return {
    getSSETicket,
    notification,
    showNotification,
    hideNotification,
  };
};