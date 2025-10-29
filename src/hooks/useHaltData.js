import { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { processHaltData, buildHaltPayload } from "../utils/haltDataUtils";
import { sortUtils, authUtils } from "../utils/storageUtils";
import { HALT_ACTIONS } from "../constants";

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
  const [notExtendedList, setNotExtendedList] = useState([]);

  // Additional data
  const [securities, setSecurities] = useState([]);
  const [haltReasons, setHaltReasons] = useState([]);

  const fetchActiveHalts = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiService.fetchActiveHalts();
      console.log("Debug active halt data", data);

      const processedData = processHaltData(data);

      setHaltList(processedData.haltList);
      setActiveRegHaltList(processedData.activeRegHaltList);
      setActiveRegData(processedData.activeRegData);
      setPendingData(processedData.pendingData);
      setLiftedData(processedData.liftedData);
      setActiveSSCBData(processedData.activeSSCBData);
      setNotExtendedList(processedData.notExtendedList);

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

  const initializeSortPreferences = () => {
    sortUtils.initializeSortPreferences();
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
      const updatedActiveRegData = activeRegData.filter(
        (obj) => obj.haltId !== haltId
      );
      updatedActiveRegData.push(updatedHaltData);
      setActiveRegData(updatedActiveRegData);

      // Update not extended list
      if (newExtendedState) {
        setNotExtendedList((prev) => prev.filter((id) => id !== haltId));
      } else {
        setNotExtendedList((prev) => [...prev, haltId]);
      }

      // Send API request
      const payload = {
        ...buildHaltPayload(updatedHaltData),
        action: HALT_ACTIONS.EXTEND_HALT,
        lastModifiedTime: "",
        remainReason: "",
        resumptionTime: "",
        lastModifiedBy: authUtils.getLoggedInUser() || "",
        type: "update",
      };

      await apiService.updateHaltState(payload);
      console.log("Extended halt state updated successfully");

      return { success: true };
    } catch (err) {
      console.error("Error updating extended halt state:", err);
      // Parse the error message from the response if available
      let errorMessage = err.message;
      console.log(`Failed to update extended halt state: ${errorMessage}`);
      // Revert optimistic update on error
      fetchActiveHalts();
      return { success: false, error: errorMessage };
    }
  };

  // Initialize data on mount
  useEffect(() => {
    fetchActiveHalts();
    fetchSecurities();
    fetchHaltReasons();
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
    notExtendedList,
    securities,
    haltReasons,

    // State
    loading,
    error,

    // Actions
    fetchActiveHalts,
    fetchSecurities,
    fetchHaltReasons,
    updateExtendedHaltState,

    // Setters for SSE updates
    setActiveRegData,
    setActiveSSCBData,
    setLiftedData,
    setPendingData,
    setActiveRegHaltList,
    setNotExtendedList,
  };
};
