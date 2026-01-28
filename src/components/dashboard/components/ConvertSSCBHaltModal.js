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

const ConvertSSCBHaltModal = ({ open, onClose, haltData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = useCallback(() => {
    if (!loading) {
      setError("");
      onClose();
    }
  }, [loading, onClose]);

  const handleConfirm = useCallback(async () => {
    setError("");

    try {
      setLoading(true);

      // Build the payload for converting SSCB halt to regulatory halt
      const payload = {
        haltId: haltData?.haltId || "",
        symbol: haltData?.symbol || "",
        issueName: haltData?.issueName || "",
        listingMarket: haltData?.listingMarket || "",
        allIssue: haltData?.allIssue === "Yes" ? "true" : "false",
        haltTime: formatForBackend(haltData?.haltTime) || "",
        resumptionTime: formatForBackend(haltData?.resumptionTime) || "",
        extendedHalt: haltData?.extendedHalt || false,
        haltReason: haltData?.haltReason || "",
        remainedHalt: haltData?.remainedHalt || false,
        remainReason: haltData?.remainReason || "",
        status: haltData?.status || "",
        state: haltData?.state || "",
        haltType: "REG",
        createdBy: haltData?.createdBy || "",
        createdTime: formatForBackend(haltData?.createdTime) || "",
        lastModifiedBy: authUtils.getLoggedInUser() || "",
        lastModifiedTime: "",
        sscbSrc: haltData?.sscbSrc || "",
        responseMessage: haltData?.responseMessage || "",
        action: HALT_ACTIONS.CONVERT_TO_REG,
        comment: "",
      };

      await apiService.updateHalt(payload);
      handleClose();
    } catch (err) {
      console.error("Failed to convert SSCB halt:", err);
      setError(err.message || "Failed to convert SSCB halt. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [haltData, handleClose]);

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
          Convert SSCB Halt to Regulatory Halt
        </Typography>
      </DialogTitle>

      <DialogContent className="cancel-halt-dialog-content">
        {error && (
          <Box className="create-halt-error-message">
            <Typography className="create-halt-error-text">{error}</Typography>
          </Box>
        )}

        <Typography className="cancel-halt-confirmation-text">
          Please confirm the conversion of the SSCB halt to a regulatory halt:
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
          <Typography className="cancel-halt-label">Halt Type</Typography>
          <Box className="cancel-halt-value-box">
            <Typography className="cancel-halt-value-text">
              {haltData?.haltType || ""}
            </Typography>
          </Box>
        </Box>

        <Box className="cancel-halt-field-container">
          <Typography className="cancel-halt-label">All Issues</Typography>
          <Box className="cancel-halt-value-box">
            <Typography className="cancel-halt-value-text">
              {haltData?.allIssue === "Yes" || haltData?.allIssue === "true" || haltData?.allIssue === true ? "Yes" : "No"}
            </Typography>
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
          {loading ? "Processing..." : "Confirm"}
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

export default ConvertSSCBHaltModal;
