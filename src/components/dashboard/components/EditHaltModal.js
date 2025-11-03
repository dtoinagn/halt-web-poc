import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
} from "@mui/material";
import { apiService } from "../../../services/api";
import { authUtils } from "../../../utils/storageUtils";
import { formatForBackend, formatForDateTimeLocal, compareDateTimeToSecond } from "../../../utils/dateUtils";
import { HALT_ACTIONS } from "../../../constants";
import "./CreateNewHaltModal.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
const EST_ZONE = "America/New_York";

const EditHaltModal = ({ open, onClose, haltData, onHaltUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    haltTime: haltData?.haltTime || "",
    allIssue: haltData?.allIssue === "Yes" || haltData?.allIssue === "true" ? "Yes" : "No",
  });

  // Update form data when haltData changes
  useEffect(() => {
    if (haltData) {
      const formattedHaltTime = formatForDateTimeLocal(haltData.haltTime);
      console.log("Original haltTime:", haltData.haltTime);
      console.log("Formatted haltTime:", formattedHaltTime);
      setFormData({
        haltTime: formattedHaltTime || "",
        allIssue: haltData.allIssue === "Yes" || haltData.allIssue === "true" ? "Yes" : "No",
      });
    }
  }, [haltData]);

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

  const handleConfirm = useCallback(async () => {
    setError("");

    try {
      // Validate halt time
      if (!formData.haltTime) {
        throw new Error("Please select a halt time");
      }

      const haltDateEST = dayjs.tz(formData.haltTime, EST_ZONE);
      const nowEST = dayjs().tz(EST_ZONE);
      const endOfTodayEST = nowEST.endOf("day");

      if (compareDateTimeToSecond(haltDateEST, nowEST) < 0) {
        throw new Error("Halt time must be in the future");
      }
      if (compareDateTimeToSecond(haltDateEST, endOfTodayEST) > 0) {
        throw new Error("Halt time must be within today");
      }

      setLoading(true);

      // Build the payload matching the update request structure
      const payload = {
        haltId: haltData.haltId || "",
        symbol: haltData.symbol || "",
        issueName: haltData.issueName || "",
        listingMarket: haltData.listingMarket || "",
        allIssue: formData.allIssue === "Yes" ? "true" : "false",
        haltTime: formatForBackend(formData.haltTime) || "",
        resumptionTime: formatForBackend(haltData.resumptionTime) || "",
        extendedHalt: haltData.extendedHalt || false,
        haltReason: haltData.haltReason || "",
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
        action: HALT_ACTIONS.EDIT_SCHEDULED_HALT,
        comment: "",
        type: "update",
      };

      console.log("Editing halt with payload:", payload);

      await apiService.updateHaltState(payload);

      // Refresh the dashboard data
      if (onHaltUpdated) {
        await onHaltUpdated();
      }

      handleClose();
    } catch (err) {
      console.error("Failed to edit halt:", err);
      setError(err.message || "Failed to edit halt. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [haltData, formData, onHaltUpdated, handleClose]);

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
          Edit Scheduled Halt
        </Typography>
      </DialogTitle>

      <DialogContent className="cancel-halt-dialog-content">
        {error && (
          <Box className="create-halt-error-message">
            <Typography className="create-halt-error-text">{error}</Typography>
          </Box>
        )}

        <Typography className="cancel-halt-confirmation-text">
          Please modify the 'Halt Time' and 'All Issues' fields for the scheduled halt as required:
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
          <Typography className="cancel-halt-label">
            Halt Time <span style={{ color: "red" }}>*</span>
          </Typography>
          <TextField
            fullWidth
            type="datetime-local"
            value={formData.haltTime}
            onChange={(e) => handleFieldChange("haltTime", e.target.value)}
            disabled={loading}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              style: { backgroundColor: "white", height: "36px" },
            }}
          />
        </Box>

        <Box className="cancel-halt-field-container">
          <Typography className="cancel-halt-label">
            All Issues <span style={{ color: "red" }}>*</span>
          </Typography>
          <Select
            fullWidth
            value={formData.allIssue}
            onChange={(e) => handleFieldChange("allIssue", e.target.value)}
            disabled={loading}
            style={{ backgroundColor: "white", height: "36px" }}
          >
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </Box>
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

export default EditHaltModal;
