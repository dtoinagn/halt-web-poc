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
  MenuItem,
} from "@mui/material";
import { apiService } from "../../../services/api";
import { authUtils } from "../../../utils/storageUtils";
import { formatForBackend } from "../../../utils/dateUtils";
import { HALT_ACTIONS } from "../../../constants";
import HaltModalField from "./HaltModalField";
import HaltReasonSelector from "./HaltReasonSelector";
import "./CreateNewHaltModal.css";

const ConvertSSCBHaltModal = ({ open, onClose, haltData, haltReasons = [] }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    haltReason: null,
    allIssue: "",
  });

  // Update form data when haltData changes
  useEffect(() => {
    if (haltData && haltReasons.length > 0) {
      // Find matching halt reason
      const matchedHaltReason = haltReasons.find(
        (reason) => reason.description === haltData.haltReason
      );

      setFormData({
        haltReason: matchedHaltReason || null,
        allIssue: haltData?.allIssue === "Yes" || haltData?.allIssue === "true" || haltData?.allIssue === true ? "Yes" : "No",
      });
      setError("");
    }
  }, [haltData, haltReasons]);

  const handleClose = useCallback(() => {
    if (!loading) {
      setError("");
      onClose();
    }
  }, [loading, onClose]);

  const handleFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleHaltReasonChange = useCallback((value) => {
    setFormData((prev) => ({
      ...prev,
      haltReason: value,
    }));
  }, []);

  const handleHaltReasonError = useCallback((errorMsg) => {
    setError(errorMsg);
  }, []);

  const handleConfirm = useCallback(async () => {
    setError("");

    try {
      // Validate halt reason is selected
      if (!formData.haltReason) {
        throw new Error("Please select a halt reason");
      }

      // Validate all issues is selected
      if (!formData.allIssue) {
        throw new Error("Please select if halt is for all issues");
      }

      // Guard against circuit breaker halts
      if (formData.haltReason && (formData.haltReason.description === "Single Stock Circuit Breaker" || formData.haltReason.description === "Market Wide Circuit Breaker")) {
        throw new Error("You cannot select this halt reason. Circuit Breaker halts are created automatically by the system.");
      }

      setLoading(true);

      // Build the payload for converting SSCB halt to regulatory halt
      const payload = {
        haltId: haltData?.haltId || "",
        symbol: haltData?.symbol || "",
        issueName: haltData?.issueName || "",
        listingMarket: haltData?.listingMarket || "",
        allIssue: formData.allIssue === "Yes" ? "true" : "false",
        haltTime: formatForBackend(haltData?.haltTime) || "",
        resumptionTime: formatForBackend(haltData?.resumptionTime) || "",
        extendedHalt: haltData?.extendedHalt || false,
        haltReason: formData.haltReason ? formData.haltReason.description : "",
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
  }, [haltData, formData.haltReason, formData.allIssue, handleClose]);

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

        <HaltModalField label="Halt Event ID" value={haltData?.haltId} />
        <HaltModalField label="Symbol" value={haltData?.symbol} />
        <HaltModalField label="Halt Type" value={haltData?.haltType} />

        <Box className="cancel-halt-field-container">
          <Typography className="cancel-halt-label">
            All Issues <span style={{ color: "red" }}>*</span>
          </Typography>
          <TextField
            select
            fullWidth
            value={formData.allIssue}
            onChange={(e) => handleFieldChange("allIssue", e.target.value)}
            disabled={loading}
            variant="outlined"
            error={!formData.allIssue && !!error}
            required
            InputProps={{
              style: { backgroundColor: "white", height: "36px" },
            }}
          >
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </TextField>
        </Box>

        <HaltReasonSelector
          haltReasons={haltReasons}
          value={formData.haltReason}
          onChange={handleHaltReasonChange}
          onError={handleHaltReasonError}
          loading={loading}
          error={error}
        />
      </DialogContent>
      <DialogActions className="cancel-halt-dialog-actions">
        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant="contained"
          className="create-halt-submit-button"
        >
          {loading ? "Updating..." : "Confirm"}
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
