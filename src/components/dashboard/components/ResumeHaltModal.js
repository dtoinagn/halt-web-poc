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
  Checkbox,
  FormControlLabel,
  Autocomplete,
} from "@mui/material";
import { apiService } from "../../../services/api";
import { authUtils } from "../../../utils/storageUtils";
import {
  formatForBackend,
  formatForDateTimeLocal,
  compareDateTimeToSecond,
} from "../../../utils/dateUtils";
import { HALT_ACTIONS } from "../../../constants";
import HaltModalField from "./HaltModalField";
import "./CreateNewHaltModal.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
const EST_ZONE = "America/New_York";

const ResumeHaltModal = ({ open, onClose, haltData, securities = [] }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [symbolInput, setSymbolInput] = useState("");
  const [originalSymbol, setOriginalSymbol] = useState("");
  const [formData, setFormData] = useState({
    security: null,
    issueName: "",
    listingMarket: "",
    immediateResumption: false,
    resumptionTime: "",
  });

  // Update form data when haltData changes
  useEffect(() => {
    if (haltData) {
      const formattedResumptionTime = formatForDateTimeLocal(
        haltData.resumptionTime
      );
      console.log("Original resumptionTime:", haltData.resumptionTime);
      console.log("Formatted resumptionTime:", formattedResumptionTime);

      // Find matching security
      const matchedSecurity = securities.find(
        (sec) =>
          sec.symbol.toLowerCase() === (haltData.symbol || "").toLowerCase()
      );

      const originalSymbolValue = haltData.symbol || "";
      setOriginalSymbol(originalSymbolValue);
      setSymbolInput(originalSymbolValue);
      setFormData({
        security: matchedSecurity || null,
        issueName: haltData.issueName || "",
        listingMarket: haltData.listingMarket || "",
        immediateResumption: false,
        resumptionTime: formattedResumptionTime || "",
      });
    }
  }, [haltData, securities]);

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

  const handleSymbolChange = useCallback((event, newValue) => {
    // newValue is the selected option (object from dropdown or null)
    if (newValue && typeof newValue === "object") {
      // User selected from dropdown
      setFormData((prev) => ({
        ...prev,
        security: newValue,
        issueName: newValue.securityName || newValue.issueName || "",
        listingMarket: newValue.listingMarket || "",
      }));
      setSymbolInput(newValue.symbol || "");
    } else {
      // User cleared the selection
      setFormData((prev) => ({
        ...prev,
        security: null,
        issueName: "",
        listingMarket: "",
      }));
      setSymbolInput("");
    }
  }, []);

  const handleSymbolInputChange = useCallback(
    (event, newInputValue) => {
      // newInputValue is the typed text
      setSymbolInput(newInputValue);

      // Check if the input matches any security from the dropdown
      const matchedSecurity = securities.find(
        (sec) => sec.symbol.toLowerCase() === newInputValue.toLowerCase()
      );

      if (matchedSecurity) {
        // If it matches a security, set it
        setFormData((prev) => ({
          ...prev,
          security: matchedSecurity,
          issueName:
            matchedSecurity.securityName || matchedSecurity.issueName || "",
          listingMarket: matchedSecurity.listingMarket || "",
        }));
      } else {
        // If it doesn't match, clear security but keep the input
        setFormData((prev) => ({
          ...prev,
          security: null,
          issueName: "",
          listingMarket: "",
        }));
      }
    },
    [securities]
  );

  const handleSymbolKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        // Restore original symbol value
        setSymbolInput(originalSymbol);

        // Find the original security
        const originalSecurity = securities.find(
          (sec) => sec.symbol.toLowerCase() === originalSymbol.toLowerCase()
        );

        if (originalSecurity) {
          setFormData((prev) => ({
            ...prev,
            security: originalSecurity,
            issueName:
              originalSecurity.securityName || originalSecurity.issueName || "",
            listingMarket: originalSecurity.listingMarket || "",
          }));
        } else {
          // If original symbol doesn't match any security, restore with original halt data
          setFormData((prev) => ({
            ...prev,
            security: null,
            issueName: haltData?.issueName || "",
            listingMarket: haltData?.listingMarket || "",
          }));
        }

        // Prevent the ESC from closing the modal
        event.stopPropagation();
      }
    },
    [originalSymbol, securities, haltData]
  );

  const handleImmediateResumptionChange = useCallback((checked) => {
    setFormData((prev) => ({
      ...prev,
      immediateResumption: checked,
      // Clear resumption time if immediate resumption is checked
      resumptionTime: checked ? "" : prev.resumptionTime,
    }));
  }, []);

  const handleConfirm = useCallback(async () => {
    setError("");

    try {
      // Validate symbol
      if (!symbolInput || !symbolInput.trim()) {
        throw new Error("Please enter a symbol");
      }

      // Determine the action based on immediate resumption checkbox
      const action = formData.immediateResumption
        ? HALT_ACTIONS.CREATE_IMMEDIATE_RESUMPTION
        : HALT_ACTIONS.CREATE_SCHEDULED_RESUMPTION;

      // Validate resumption time for scheduled resumption
      if (!formData.immediateResumption) {
        if (!formData.resumptionTime) {
          throw new Error("Please select a resumption time");
        }

        const resumptionDateEST = dayjs.tz(formData.resumptionTime, EST_ZONE);
        const nowEST = dayjs().tz(EST_ZONE);
        const endOfTodayEST = nowEST.endOf("day");

        if (compareDateTimeToSecond(resumptionDateEST, nowEST) < 0) {
          throw new Error("Resumption time must be in the future");
        }
        if (compareDateTimeToSecond(resumptionDateEST, endOfTodayEST) > 0) {
          throw new Error("Resumption time must be within today");
        }

        // Validate resumption time is after halt time
        const haltDateEST = dayjs.tz(haltData.haltTime, EST_ZONE);
        if (compareDateTimeToSecond(resumptionDateEST, haltDateEST) <= 0) {
          throw new Error("Resumption time must be after halt time");
        }
      }

      setLoading(true);

      // Build the payload matching the update request structure
      const payload = {
        haltId: haltData.haltId || "",
        symbol: symbolInput.trim() || "",
        issueName: formData.issueName || "",
        listingMarket: formData.listingMarket || "",
        allIssue: haltData.allIssue === "Yes" ? "true" : "false",
        haltTime: formatForBackend(haltData.haltTime) || "",
        resumptionTime: formData.immediateResumption
          ? formatForBackend(dayjs().tz(EST_ZONE).format())
          : formatForBackend(formData.resumptionTime) || "",
        extendedHalt: haltData.extendedHalt || false,
        haltReason: haltData.haltReason || "",
        remainReason: haltData.remainReason || "",
        status: haltData.status || "Halted",
        state: haltData.state || "Halted",
        haltType: haltData.haltType || "REG",
        createdBy: haltData.createdBy || "",
        createdTime: formatForBackend(haltData.createdTime) || "",
        lastModifiedBy: authUtils.getLoggedInUser() || "",
        lastModifiedTime: "",
        sscbSrc: haltData.sscbSrc || "",
        responseMessage: haltData.responseMessage || "",
        action: action,
        comment: "",
        type: "update",
      };

      console.log("Resuming halt with payload:", payload);

      await apiService.updateHaltState(payload);

      handleClose();
    } catch (err) {
      console.error("Failed to resume halt:", err);
      setError(err.message || "Failed to resume halt. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [haltData, formData, symbolInput, handleClose]);

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
          Resume Halt
        </Typography>
      </DialogTitle>

      <DialogContent className="cancel-halt-dialog-content">
        {error && (
          <Box className="create-halt-error-message">
            <Typography className="create-halt-error-text">{error}</Typography>
          </Box>
        )}

        <Typography className="cancel-halt-confirmation-text">
          Please enter the resumption details as required:
        </Typography>

        <HaltModalField label="Halt Event ID" value={haltData?.haltId} />

        <Box className="cancel-halt-field-container">
          <Typography className="cancel-halt-label">
            Symbol <span style={{ color: "red" }}>*</span>
          </Typography>
          <Box sx={{ flex: 1 }}>
            <Autocomplete
              freeSolo={true} // Allow free text input
              options={securities}
              getOptionLabel={(option) => {
                return option.symbol || "";
              }}
              value={formData.security}
              inputValue={symbolInput}
              onChange={handleSymbolChange}
              onInputChange={handleSymbolInputChange}
              disabled={loading}
              filterOptions={(options, { inputValue }) =>
                options.filter((option) =>
                  option.symbol
                    .toLowerCase()
                    .startsWith(inputValue.toLowerCase())
                )
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  variant="outlined"
                  error={!symbolInput && !!error}
                  onKeyDown={handleSymbolKeyDown}
                  helperText="Press ESC to restore original value"
                  InputProps={{
                    ...params.InputProps,
                    style: { backgroundColor: "white", height: "36px" },
                  }}
                  FormHelperTextProps={{
                    style: { fontSize: "0.7rem", marginTop: "2px" },
                  }}
                />
              )}
            />
          </Box>
        </Box>

        <HaltModalField label="Issue Name" value={formData.issueName} />

        <HaltModalField label="Listing Market" value={formData.listingMarket} />

        <HaltModalField
          label="All Issues"
          value={
            haltData?.allIssue === "Yes" || haltData?.allIssue === "true"
              ? "Yes"
              : "No"
          }
        />

        <HaltModalField
          label="Halt Time"
          value={
            haltData?.haltTime
              ? dayjs(haltData.haltTime).format("YYYY-MM-DD HH:mm:ss.SSS")
              : ""
          }
        />

        <Box
          className="cancel-halt-field-container"
          sx={{ alignItems: "flex-start" }}
        >
          <Typography className="cancel-halt-label" sx={{ paddingTop: "8px" }}>
            Immediate Resumption
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.immediateResumption}
                onChange={(e) =>
                  handleImmediateResumptionChange(e.target.checked)
                }
                disabled={loading}
              />
            }
            label=""
            sx={{ margin: 0 }}
          />
        </Box>

        <Box className="cancel-halt-field-container">
          <Typography className="cancel-halt-label">
            Resumption Time <span style={{ color: "red" }}>*</span>
          </Typography>
          <TextField
            fullWidth
            type="datetime-local"
            value={formData.resumptionTime}
            onChange={(e) =>
              handleFieldChange("resumptionTime", e.target.value)
            }
            disabled={loading || formData.immediateResumption}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              style: { backgroundColor: "white", height: "36px" },
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions className="cancel-halt-dialog-actions">
        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant="contained"
          className="create-halt-submit-button"
        >
          {loading ? "Saving..." : "Save"}
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

export default ResumeHaltModal;
