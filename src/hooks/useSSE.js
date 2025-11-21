import { useState, useEffect, useRef, useCallback } from "react";
import { apiService } from "../services/api";
import { HALT_STATUSES, HALT_TYPES } from "../constants";
import { getCurrentDateTime, formatDateTimeForDashboard } from "../utils/dateUtils";

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
  const [sseMessage, setSSEMessage] = useState("");
  const [notification, setNotification] = useState("");
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

  const showNotificationMessage = useCallback((msg) => {
    if (!msg) return;
    setNotification(msg);
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
          console.log("Processing SSE message:", sseBody);
          if (sseBody.haltTime) sseBody.haltTime = formatDateTimeForDashboard(sseBody.haltTime);
          if (sseBody.resumptionTime) sseBody.resumptionTime = formatDateTimeForDashboard(sseBody.resumptionTime);

          const status = (sseBody.status || "");
          const state = (sseBody.state || "");
          const haltId = sseBody.haltId;
          const haltType = sseBody.haltType;
          const symbol = sseBody.symbol;
          const extended = Boolean(sseBody.extendedHalt);
          const remained = Boolean(sseBody.remainedHalt);
          const action = sseBody.action;

          if (haltId) seenIdsRef.current.add(haltId);

          // 1) RESUMED flow
          if (status === (HALT_STATUSES.RESUMED)) {
            // ResumedSent: only update existing lifted entry
            if (state === "ResumedSent") {
              const idx = newLifted.findIndex(r => r.haltId === haltId);
              if (idx !== -1) {
                newLifted[idx] = { ...newLifted[idx], ...sseBody };
              }
              return;
            }

            // Normal resumed: remove from active/pending, add/update lifted
            newActiveReg = newActiveReg.filter(r => r.haltId !== haltId);
            newActiveRegList = newActiveRegList.filter(id => id !== haltId);
            newActiveSSCB = newActiveSSCB.filter(r => r.haltId !== haltId);
            newPending = newPending.filter(r => r.haltId !== haltId);
            newExtendedRegHaltIds = newExtendedRegHaltIds.filter(id => id !== haltId); // remove from extended list

            if (!sseBody.resumptionTime) sseBody.resumptionTime = getCurrentDateTime();

            if (!newLifted.find(r => r.haltId === haltId)) newLifted.push(sseBody);
            else newLifted = newLifted.map(r => (r.haltId === haltId ? { ...r, ...sseBody } : r));

            notifications.add(`Halt has been resumed for ${symbol}`);
            return;
          }

          // 2) HALTED (REG) flow - activation or update
          if (status === HALT_STATUSES.HALTED && haltType === HALT_TYPES.REG) {
            const prev = newActiveReg.find(o => o.haltId === haltId && o.haltType === HALT_TYPES.REG);
            // If came from pending, remove pending
            const pendingIdx = newPending.findIndex(p => p.haltId === haltId);
            if (pendingIdx !== -1) {
              newPending = newPending.filter(p => p.haltId !== haltId);
            }

            const existingIdx = newActiveReg.findIndex(r => r.haltId === haltId);
            if (existingIdx !== -1) {
              // update existing
              newActiveReg[existingIdx] = { ...newActiveReg[existingIdx], ...sseBody };
            } else {
              // new activation
              newActiveReg.push(sseBody);
              if (!newActiveRegList.includes(haltId)) newActiveRegList.push(haltId);
              
              if (pendingIdx !== -1)
                // Halt lifted from Scheduled Halt
                notifications.add(`Scheduled halt is now active for ${symbol}`);
              else
                // Newly created Halt
                notifications.add(`New regulatory halt has been created for ${symbol}`);
            }

            if (prev && extended !== prev.extendedHalt) {
              if (extended) {
                notifications.add(`Halt has been marked as extended for ${symbol}`);
              } else {
                notifications.add(`Halt has been marked as non-extended for ${symbol}`);
              }
              // Handle extended and remained flag: add to extendedRegHaltIds if extended or remained, remove if not
              if (extended || remained) {
                if (!newExtendedRegHaltIds.includes(haltId)) newExtendedRegHaltIds.push(haltId);
              } else {
                newExtendedRegHaltIds = newExtendedRegHaltIds.filter(id => id !== haltId);
              }
            } else if (prev && remained !== prev.remainedHalt) {
              if (remained) {
                notifications.add(`Halt has been marked as remained for ${symbol}`);
              } else {
                notifications.add(`Halt has been marked as non-remained for ${symbol}`);
              }
              // Handle extended and remained flag: add to extendedRegHaltIds if extended or remained, remove if not
              if (extended || remained) {
                if (!newExtendedRegHaltIds.includes(haltId)) newExtendedRegHaltIds.push(haltId);
              } else {
                newExtendedRegHaltIds = newExtendedRegHaltIds.filter(id => id !== haltId);
              }
            }
            return
          }

          // 3) RESUMPTION_PENDING for REG (resumption time set/updated)
          if (status === HALT_STATUSES.RESUMPTION_PENDING && haltType === HALT_TYPES.REG) {
            const idx = newActiveReg.findIndex(r => r.haltId === haltId);
            if (idx !== -1) {
              newActiveReg[idx] = { ...newActiveReg[idx], ...sseBody };
            }
            notifications.add(`Resumption time has been set for ${symbol}`);
            return;
          }

          // 4) SSCB creation / update
          if (status === HALT_STATUSES.RESUMPTION_PENDING && haltType === HALT_TYPES.SSCB) {
            const idx = newActiveSSCB.findIndex(r => r.haltId === haltId);
            if (idx === -1) {
              newActiveSSCB.push(sseBody);
              notifications.add(`New SSCB halt has been created for ${symbol}`);
            }
            else {
              newActiveSSCB[idx] = { ...newActiveSSCB[idx], ...sseBody };
            }
            return;
          }

          // 5) PENDING / SCHEDULED
          if (status === HALT_STATUSES.HALT_PENDING || status === HALT_STATUSES.HALT_SCHEDULED) {
            const idx = newPending.findIndex(p => p.haltId === haltId);
            if (idx === -1) {
              newPending.push(sseBody);
              notifications.add(`New regulatory halt has been scheduled for ${symbol}`);
            }
            else {
              // Update existing pending Halts
              newPending[idx] = { ...newPending[idx], ...sseBody };
              if (action === "ModifyScheduledHalt" && state === "HaltPending") {
                notifications.add(`Halt time has been updated for ${symbol}`);
              } else if (action === "CancelScheduledHalt"){
                notifications.add(`Scheduled halt has been cancelled for ${symbol}`);
              }
            }
            return;
          }
          // 7) CANCELED from PENDING, notification already sent so only update the attributes
          if (status === HALT_STATUSES.HALT_PENDING_CANCELLED) {
            const idx = newPending.findIndex(p => p.haltId === haltId);
            if (idx !== -1) {
              newPending[idx] = { ...newPending[idx], ...sseBody };
            }
          }
          // 8) default: if unknown type/status and not seen before -> track as pending generically
          console.log("Unhandled halt status/state/type, added to Pending List: ", haltId, status, state, haltType);
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
      Array.from(notifications).forEach(msg => showNotificationMessage(msg));
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
        setSSEMessage(event.data);
        pendingUpdatesRef.current.push(dataObj);
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
    sseMessage,
    notification,
    showNotification,
    hideNotification,
  };
};