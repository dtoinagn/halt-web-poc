import { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { processHaltData, buildHaltPayload } from "../utils/haltDataUtils";
import { sortUtils, authUtils } from "../utils/storageUtils";
import { HALT_ACTIONS, HALT_TYPES, HALT_STATUSES } from "../constants";

export const useHaltData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Processed halt data
  const [activeRegData, setActiveRegData] = useState([]);
  const [activeSSCBData, setActiveSSCBData] = useState([]);
  const [liftedData, setLiftedData] = useState([]);
  const [pendingData, setPendingData] = useState([]);
  const [haltList, setHaltList] = useState([]);
  const [activeRegHaltList, setActiveRegHaltList] = useState([]);
  const [extendedRegHaltIds, setExtendedRegHaltIds] = useState([]); // now tracks extended AND/OR remained

  // Additional data
  const [securities, setSecurities] = useState([]);
  const [haltReasons, setHaltReasons] = useState([]);
  const [remainReasons, setRemainReasons] = useState([]);

  const fetchActiveHalts = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiService.fetchActiveHalts();
      const processedData = processHaltData(data);

      setHaltList(processedData.haltList);
      setActiveRegHaltList(processedData.activeRegHaltList);
      setActiveRegData(processedData.activeRegData);
      setPendingData(processedData.pendingData);
      setLiftedData(processedData.liftedData);
      setActiveSSCBData(processedData.activeSSCBData);
      setExtendedRegHaltIds(processedData.extendedRegHaltIds);

      console.log("Dashboard data loaded");
    } catch (err) {
      console.error("Failed to fetch active halts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurities = async () => {
    try {
      const data = await apiService.fetchSecurities();
      setSecurities(data);
    } catch (err) {
      console.error("Failed to fetch securities:", err);
    }
  };

  const fetchHaltReasons = async () => {
    try {
      const data = await apiService.fetchHaltReasons();
      setHaltReasons(data);
    } catch (err) {
      console.error("Failed to fetch halt reasons:", err);
    }
  };

  const fetchHaltRemainReasons = async () => {
    try {
      const data = await apiService.fetchHaltRemainReasons();
      setRemainReasons(data);
    } catch (err) {
      console.error("Failed to fetch remain reasons:", err);
    }
  };

  const initializeSortPreferences = () => {
    sortUtils.initializeSortPreferences();
  };

  // Helper: check existing active/scheduled halts for symbol
  const checkExistingHaltsForSymbol = (symbol) => {
    // Check active REG halts
    const activeHalts = activeRegData.filter((halt) => halt.symbol === symbol);
    // Check scheduled halts - only count pending scheduled halts
    const scheduledHalts = pendingData.filter((halt) => halt.symbol === symbol && halt.status === HALT_STATUSES.HALT_PENDING);
    return {
      hasActiveHalts: activeHalts.length > 0,
      hasScheduledHalts: scheduledHalts.length > 0,
    };
  };

  // Helper: update list of extended/remained REG halts
  // Track haltId if: (extendedHalt === true OR remainedHalt === true) AND haltType === REG
  const updateExtendedRegHaltIdList = (haltId, extendedState, remainedState, haltType) => {
    if (!haltId || haltType !== HALT_TYPES.REG) return;

    setExtendedRegHaltIds((prev) => {
      const exists = prev.includes(haltId);
      // Add to list if EITHER extendedState OR remainedState is true and not already present
      if ((extendedState || remainedState) && !exists) {
        return [...prev, haltId];
      }
      // Remove from list if BOTH extendedState AND remainedState are false and currently present
      if (!extendedState && !remainedState && exists) {
        return prev.filter((id) => id !== haltId);
      }
      return prev; // no change
    });
  };

  const updateExtendedHaltState = async (haltId, newExtendedState) => {
    try {
      // Find the halt data
      const haltData = activeRegData.find((obj) => obj.haltId === haltId);
      if (!haltData) {
        throw new Error("Halt not found");
      }

      // Update local state optimistically
      const updatedHaltData = { ...haltData, extendedHalt: newExtendedState };
      const updatedActiveRegData = activeRegData.map((obj) =>
        obj.haltId === haltId ? updatedHaltData : obj
      );
      setActiveRegData(updatedActiveRegData);

      // Update extended/remained halt IDs list
      // Pass: haltId, extendedState (new), remainedState (existing), haltType
      updateExtendedRegHaltIdList(
        haltId,
        newExtendedState,
        haltData.remainedHalt,
        haltData.haltType
      );

      // Send API request
      const payload = {
        ...buildHaltPayload(updatedHaltData),
        action: HALT_ACTIONS.EXTEND_HALT,
        lastModifiedBy: authUtils.getLoggedInUser() || "",
      };

      await apiService.updateHalt(payload);
      return { success: true };
    } catch (err) {
      console.error("Error updating extended halt state:", err);
      let errorMessage = err.message;
      console.log(`Failed to update extended halt state: ${errorMessage}`);
      // SSE will handle the sync from server; no manual refresh needed
      return { success: false, error: errorMessage };
    }
  };

  const updateRemainedHaltState = async (haltId, remainedHalt, remainReason) => {
    try {
      // Find the halt data
      const haltData = activeRegData.find((obj) => obj.haltId === haltId);
      if (!haltData) {
        throw new Error("Halt not found");
      }

      // Update local state optimistically
      const updatedHaltData = {
        ...haltData,
        remainedHalt: remainedHalt,
        remainReason: remainReason,
        lastModifiedBy: authUtils.getLoggedInUser() || "",
      };
      const updatedActiveRegData = activeRegData.map((obj) =>
        obj.haltId === haltId ? updatedHaltData : obj
      );
      setActiveRegData(updatedActiveRegData);

      // Update extended/remained halt IDs list
      // Pass: haltId, extendedState (existing), remainedState (new), haltType
      updateExtendedRegHaltIdList(
        haltId,
        haltData.extendedHalt,
        remainedHalt,
        haltData.haltType
      );
      return { success: true };
    } catch (err) {
      console.error("Error updating remained halt state:", err);
      let errorMessage = err.message;
      console.log(`Failed to update remained halt state: ${errorMessage}`);
      // SSE will handle the sync from server; no manual refresh needed
      return { success: false, error: errorMessage };
    }
  };

  // Initialize data on mount
  useEffect(() => {
    fetchActiveHalts();
    fetchSecurities();
    fetchHaltReasons();
    fetchHaltRemainReasons();
    initializeSortPreferences();
  }, []);

  return {
    // Data
    activeRegData,
    activeSSCBData,
    liftedData,
    pendingData,
    haltList,
    activeRegHaltList,
    extendedRegHaltIds, // now tracks extended AND/OR remained REG halts
    securities,
    haltReasons,
    remainReasons,

    // State
    loading,
    error,

    // Actions
    fetchActiveHalts,
    fetchSecurities,
    fetchHaltReasons,
    fetchHaltRemainReasons,
    updateExtendedHaltState,
    updateRemainedHaltState,
    checkExistingHaltsForSymbol,

    // Setters for SSE updates
    setActiveRegData,
    setActiveSSCBData,
    setLiftedData,
    setPendingData,
    setActiveRegHaltList,
    setExtendedRegHaltIds,
  };
};
