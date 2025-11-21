import { useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { apiService } from "../../../services/api";
import { authUtils } from "../../../utils/storageUtils";
import { formatForBackend } from "../../../utils/dateUtils";
import { HALT_ACTIONS } from "../../../constants";
import "./CreateNewHaltModal.css";

const CancelHaltModal = ({ open, onClose, haltData, onHaltCancelled }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = useCallback(() => {
    if (!loading) {
      setError("");
      onClose();
    }
  }, [loading, onClose]);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Build the payload matching the cancel request structure
      const payload = {
        haltId: haltData.haltId || "",
        symbol: haltData.symbol || "",
        issueName: haltData.issueName || "",
        listingMarket: haltData.listingMarket || "",
        allIssue: haltData.allIssue === "Yes" || haltData.allIssue === true,
        haltTime: formatForBackend(haltData.haltTime) || "",
        resumptionTime: formatForBackend(haltData.resumptionTime) || "",
        extendedHalt: haltData.extendedHalt || false,
        haltReason: haltData.haltReason || "",
        remainedHalt: haltData.remainedHalt || false,
        remainReason: haltData.remainReason || "",
        status: haltData.status || "HaltPending",
        state: haltData.state || "HaltScheduled",
        haltType: haltData.haltType || "REG",
        createdBy: haltData.createdBy || "",
        createdTime: formatForBackend(haltData.createdTime) || "",
        lastModifiedBy: authUtils.getLoggedInUser() || "",
        lastModifiedTime: "",
        sscbSrc: haltData.sscbSrc || "",
        responseMessage: haltData.responseMessage || "",
        action: HALT_ACTIONS.CANCEL_SCHEDULED_HALT,
        comment: "",
      };

      await apiService.updateHalt(payload);

      // Refresh the dashboard data
      if (onHaltCancelled) {
        await onHaltCancelled();
      }

      handleClose();
    } catch (err) {
      console.error("Failed to cancel halt:", err);
      setError(err.message || "Failed to cancel halt. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [haltData, onHaltCancelled, handleClose]);

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
          Cancel Scheduled Halt
        </Typography>
      </DialogTitle>

      <DialogContent className="cancel-halt-dialog-content">
        {error && (
          <Box className="create-halt-error-message">
            <Typography className="create-halt-error-text">{error}</Typography>
          </Box>
        )}

        <Typography className="cancel-halt-confirmation-text">
          Please confirm the cancellation of the scheduled halt:
        </Typography>

        <Box className="cancel-halt-field-container">
          <Typography className="cancel-halt-label">Halt Event ID</Typography>
          <Box className="cancel-halt-value-box">
            <Typography className="cancel-halt-value-text">
              {haltData?.haltId || ""}
            </Typography>
          </Box>
        </Box>

        <Box className="cancel-halt-field-container">
          <Typography className="cancel-halt-label">Symbol</Typography>
          <Box className="cancel-halt-value-box">
            <Typography className="cancel-halt-value-text">
              {haltData?.symbol || ""}
            </Typography>
          </Box>
        </Box>

        <Box className="cancel-halt-field-container">
          <Typography className="cancel-halt-label">Halt Time</Typography>
          <Box className="cancel-halt-value-box">
            <Typography className="cancel-halt-value-text">
              {haltData?.haltTime || ""}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className="cancel-halt-dialog-actions">
        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant="contained"
          className="cancel-halt-confirm-button"
        >
          {loading ? "Cancelling..." : "Confirm"}
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

export default CancelHaltModal;
