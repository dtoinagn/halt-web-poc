import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Autocomplete,
  TextField,
} from "@mui/material";
import { apiService } from "../../../services/api";
import { authUtils } from "../../../utils/storageUtils";
import { formatForBackend } from "../../../utils/dateUtils";
import { HALT_ACTIONS } from "../../../constants";
import HaltModalField from "./HaltModalField";
import "./CreateNewHaltModal.css";

const RemainHaltModal = ({ open, onClose, haltData, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remainedHalt, setRemainedHalt] = useState(false);
  const [remainReasons, setRemainReasons] = useState([]);
  const [selectedRemainReason, setSelectedRemainReason] = useState(null);

  // Fetch remain reasons when modal opens
  useEffect(() => {
    const fetchRemainReasons = async () => {
      if (open) {
        try {
          const reasons = await apiService.fetchHaltRemainReasons();
          setRemainReasons(reasons || []);
        } catch (err) {
          console.error("Failed to fetch remain reasons:", err);
          setRemainReasons([]);
        }
      }
    };

    fetchRemainReasons();
  }, [open]);

  // Initialize form state when haltData changes
  useEffect(() => {
    if (haltData) {
      setRemainedHalt(haltData.remained || false);
      // If there's an existing remain reason, find and select it
      if (haltData.remainReason && remainReasons.length > 0) {
        const matchedReason = remainReasons.find(
          (reason) => reason.id === haltData.remainReason || reason.description === haltData.remainReason
        );
        setSelectedRemainReason(matchedReason || null);
      } else {
        setSelectedRemainReason(null);
      }
    }
  }, [haltData, remainReasons]);

  const handleClose = useCallback(() => {
    if (!loading) {
      setError("");
      setRemainedHalt(false);
      setSelectedRemainReason(null);
      onClose();
    }
  }, [loading, onClose]);

  const handleRemainedHaltChange = useCallback((event, newValue) => {
    const isYes = newValue === "Yes";
    setRemainedHalt(isYes);
    // Clear selected reason when selecting "No"
    if (!isYes) {
      setSelectedRemainReason(null);
    }
  }, []);

  const handleRemainReasonChange = useCallback((event, newValue) => {
    setSelectedRemainReason(newValue);
  }, []);

  const handleConfirm = useCallback(async () => {
    setError("");

    try {
      if (!haltData) {
        throw new Error("No halt data available");
      }

      // Validate: if remainedHalt is checked, a remain reason must be selected
      if (remainedHalt && !selectedRemainReason) {
        throw new Error("Please select a remain reason");
      }

      setLoading(true);

      // Build the payload matching the update request structure
      const payload = {
        haltId: haltData.haltId || "",
        symbol: haltData.symbol || "",
        issueName: haltData.issueName || "",
        listingMarket: haltData.listingMarket || "",
        allIssue: haltData.allIssue === "Yes" || haltData.allIssue === true,
        haltTime: formatForBackend(haltData.haltTime) || "",
        resumptionTime: haltData.resumptionTime ? formatForBackend(haltData.resumptionTime) : "",
        extendedHalt: haltData.extendedHalt || false,
        haltReason: haltData.haltReason || "",
        remainReason: remainedHalt && selectedRemainReason ? selectedRemainReason.description : "",
        status: haltData.status || "Halted",
        state: haltData.state || "HaltSent",
        haltType: haltData.haltType || "REG",
        createdBy: haltData.createdBy || "",
        createdTime: haltData.createdTime ? formatForBackend(haltData.createdTime) : "",
        lastModifiedBy: authUtils.getLoggedInUser() || "",
        lastModifiedTime: "",
        sscbSrc: haltData.sscbSrc || "",
        responseMessage: haltData.responseMessage || "",
        remainedHalt: remainedHalt,
        action: HALT_ACTIONS.REMAINED_HALT,
      };

      console.log("Updating remained halt with payload:", payload);

      await apiService.updateHalt(payload);

      // Call onSuccess callback if provided
      if (onSuccess) {
        await onSuccess(remainedHalt, remainedHalt && selectedRemainReason ? selectedRemainReason.description : "");
      }

      handleClose();
    } catch (err) {
      console.error("Failed to update remained halt:", err);
      setError(err.message || "Failed to update remained halt. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [haltData, remainedHalt, selectedRemainReason, handleClose, onSuccess]);

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      onClose={(event, reason) => {
        if (reason === "backdropClick") {
          return; // Prevent closing on backdrop click
        }
        handleClose();
      }}
      slotProps={{
        paper: {
          className: "cancel-halt-dialog-paper",
        },
      }}
    >
      <DialogTitle className="cancel-halt-dialog-title">
        <Typography
          variant="h6"
          component="div"
          className="cancel-halt-dialog-title-text"
        >
          Update Remained Halt Flag
        </Typography>
      </DialogTitle>

      <DialogContent className="cancel-halt-dialog-content">
        {error && (
          <Box className="create-halt-error-message">
            <Typography className="create-halt-error-text">{error}</Typography>
          </Box>
        )}

        <Typography className="cancel-halt-confirmation-text">
          Please confirm the change to the Remained Halt flag:
        </Typography>

        <HaltModalField label="Halt Event ID" value={haltData?.haltId} />

        <HaltModalField label="Symbol" value={haltData?.symbol} />

        <Box className="cancel-halt-field-container">
          <Typography className="cancel-halt-label">
            Remained Halt
          </Typography>
          <Box sx={{ flex: 1 }}>
            <Autocomplete
              options={["Yes", "No"]}
              value={remainedHalt ? "Yes" : "No"}
              onChange={handleRemainedHaltChange}
              disabled={loading}
              disableClearable
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    ...params.InputProps,
                    style: { backgroundColor: "white", height: "36px" },
                  }}
                />
              )}
            />
          </Box>
        </Box>

        <Box className="cancel-halt-field-container">
          <Typography className="cancel-halt-label">
            Remain Reason {remainedHalt && <span style={{ color: "red" }}>*</span>}
          </Typography>
          <Box sx={{ flex: 1 }}>
            <Autocomplete
              options={remainReasons}
              getOptionLabel={(option) => option.description || ""}
              value={selectedRemainReason}
              onChange={handleRemainReasonChange}
              disabled={loading || !remainedHalt}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  variant="outlined"
                  error={remainedHalt && !selectedRemainReason && !!error}
                  placeholder="Select a remain reason"
                  InputProps={{
                    ...params.InputProps,
                    style: { backgroundColor: "white", height: "36px" },
                  }}
                />
              )}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className="cancel-halt-dialog-actions">
        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant="contained"
          className="create-halt-submit-button"
        >
          {loading ? "Confirming..." : "Confirm"}
        </Button>
        <Button
          onClick={handleClose}
          disabled={loading}
          className="cancel-halt-close-button"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RemainHaltModal;
