import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  MenuItem,
} from "@mui/material";
import { apiService } from "../../../services/api";
import { authUtils } from "../../../utils/storageUtils";
import { HALT_ACTIONS } from "../../../constants";
import ConfirmDialog from "../../ui/ConfirmDialog";
import HaltModalField from "./HaltModalField";
import "./CreateNewHaltModal.css";
import {
  compareDateTimeToSecond,
  getCurrentESTDateTime,
  formatForBackend,
  DATETIME_FORMATS,
} from "../../../utils/dateUtils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
const EST_ZONE = "America/New_York";

// Initial form state - moved outside component to avoid recreation
const getInitialFormData = () => ({
  security: null,
  issueName: "",
  listingMarket: "",
  allIssue: "",
  haltReason: null,
  haltTime: "",
  resumptionTime: "",
  immediateHalt: false,
  extendedHalt: false,
  createdBy: authUtils.getLoggedInUser() || "",
  comment: "",
});

const CreateNewHaltModal = ({
  open,
  onClose,
  securities = [],
  haltReasons = [],
  onHaltCreated,
  checkExistingHaltsForSymbol
}) => {
  const [formData, setFormData] = useState(getInitialFormData);
  const [symbolInput, setSymbolInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [symbolError, setSymbolError] = useState("");
  const [haltReasonError, setHaltReasonError] = useState("");
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  const getCurrentTimeBackendFormat = useCallback((dateTime) => {
    if (dateTime) {
      return formatForBackend(dateTime);
    }
    return getCurrentESTDateTime(DATETIME_FORMATS.BACKEND);
  }, []);

  // Check if any fields have been changed from initial values
  const hasUnsavedChanges = useCallback(() => {
    const initial = getInitialFormData();
    return (
      symbolInput !== "" ||
      formData.issueName !== initial.issueName ||
      formData.listingMarket !== initial.listingMarket ||
      formData.allIssue !== initial.allIssue ||
      formData.haltReason !== initial.haltReason ||
      formData.haltTime !== initial.haltTime ||
      formData.resumptionTime !== initial.resumptionTime ||
      formData.immediateHalt !== initial.immediateHalt ||
      formData.extendedHalt !== initial.extendedHalt ||
      formData.comment !== initial.comment
    );
  }, [symbolInput, formData]);

  const handleSavedClose = useCallback(() => {
    if (!loading) {
      setFormData(getInitialFormData());
      setSymbolInput("");
      setSymbolError("");
      setHaltReasonError("");
      setError("");
      onClose();
    }
  }, [loading, onClose]);

  const handleClose = useCallback(() => {
    if (!loading) {
      if (hasUnsavedChanges()) {
        setExitConfirmOpen(true);
      } else {
        setFormData(getInitialFormData());
        setSymbolInput("");
        setSymbolError("");
        setHaltReasonError("");
        setError("");
        onClose();
      }
    }
  }, [loading, onClose, hasUnsavedChanges]);

  const handleExitConfirmCancel = useCallback(() => {
    setExitConfirmOpen(false);
  }, []);

  const handleExitConfirmOk = useCallback(() => {
    setExitConfirmOpen(false);
    setFormData(getInitialFormData());
    setSymbolInput("");
    setSymbolError("");
    setHaltReasonError("");
    setError("");
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Prepare halt time
      let newHaltTime = null;
      if (formData.immediateHalt) {
        newHaltTime = getCurrentTimeBackendFormat();
      } else {
        newHaltTime = getCurrentTimeBackendFormat(formData.haltTime);
      }
      const payload = {
        haltId: "",
        symbol: symbolInput || "",
        issueName: formData.issueName || "",
        listingMarket: formData.listingMarket || "",
        allIssue: formData.allIssue === "Yes" ? "true" : "false",
        haltTime: newHaltTime,
        resumptionTime: "",
        extendedHalt: formData.extendedHalt,
        haltReason: formData.haltReason ? formData.haltReason.description : "",
        remainedHalt: false,
        remainReason: "",
        status: formData.immediateHalt ? "Halted" : "HaltPending",
        haltType: "REG", // Default to REG for new halts
        createdBy: formData.createdBy || "",
        createdTime: "",
        lastModifiedBy: formData.createdBy || "",
        lastModifiedTime: "",
        sscbSrc: "",
        responseMessage: "",
        action: formData.immediateHalt
          ? HALT_ACTIONS.CREATE_IMMEDIATE_HALT
          : HALT_ACTIONS.CREATE_SCHEDULED_HALT,
        comment: formData.comment || "",
      };

      await apiService.createNewHalt(payload);

      // Refresh the dashboard data
      if (onHaltCreated) {
        await onHaltCreated();
      }

      handleSavedClose();
    } catch (err) {
      console.error("Failed to create halt:", err);
      setError(err.message || "Failed to create halt. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    formData,
    symbolInput,
    getCurrentTimeBackendFormat,
    onHaltCreated,
    handleClose,
  ]);

  // Validate and show confirmation dialog before submitting
  const handleCreateClick = useCallback(() => {
    setError("");
    try {
      // Validate required fields
      if (!symbolInput || symbolInput.trim() === "") {
        throw new Error("Please enter a symbol");
      }

      // Check for existing active or pending halts for the symbol
      const existingActiveHalts = checkExistingHaltsForSymbol(symbolInput);
      if (existingActiveHalts.hasActiveHalts) {
        throw new Error(
          `An active halt already exists for symbol ${symbolInput}`
        );
      }
      if (existingActiveHalts.hasScheduledHalts) {
        throw new Error(
          `A scheduled halt already exists for symbol ${symbolInput}, please cancel it before creating a new halt.`
        );
      }

      if (!formData.immediateHalt && !formData.haltTime) {
        throw new Error("Please select a halt time for scheduled halt");
      }
      if (!formData.allIssue) {
        throw new Error("Please select if halt is for all issues");
      }
      if (!formData.haltReason) {
        throw new Error("Please select a halt reason");
      }
      if (formData.haltReason
        && (formData.haltReason.description === "Single Stock Circuit Breaker" ||
          formData.haltReason.description === "Market Wide Circuit Breaker")) {
        // should never happen because we clear on selection, but guard anyway
        throw new Error("You cannot select this halt reason. Circuit Breaker halts are created automatically by the system.");
      }
      // Validate halt time for scheduled halts
      if (!formData.immediateHalt) {
        const haltDateEST = dayjs.tz(formData.haltTime, EST_ZONE);
        const nowEST = dayjs().tz(EST_ZONE);
        const endOfTodayEST = nowEST.endOf("day");

        if (compareDateTimeToSecond(haltDateEST, nowEST) < 0) {
          throw new Error("Halt time must be in the future");
        }
        if (compareDateTimeToSecond(haltDateEST, endOfTodayEST) > 0) {
          throw new Error("Halt time must be within today");
        }
      }
      // If all validations pass, open confirmation dialog for immediate halt only
      if (formData.immediateHalt) {
        setConfirmOpen(true);
      } else {
        // Directly submit for scheduled halts
        handleSubmit();
      }
    } catch (error) {
      setError(error.message);
    }
  }, [
    symbolInput,
    formData.immediateHalt,
    formData.haltTime,
    formData.allIssue,
    formData.haltReason,
    checkExistingHaltsForSymbol,
    handleSubmit
  ]);

  const handleConfirmCancel = useCallback(() => {
    setConfirmOpen(false);
  }, []);

  const handleConfirmOk = useCallback(async () => {
    setConfirmOpen(false);
    await handleSubmit();
  }, [handleSubmit]);

  const handleHaltReasonChange = useCallback((field, value) => {
    setError("");
    // special handling for haltReason selection
    if (value && (value.description === "Single Stock Circuit Breaker" || value.description === "Market Wide Circuit Breaker")) {
      // clear the value and show an error
      setHaltReasonError("You cannot select this halt reason. Circuit Breaker halts are created automatically by the system.");
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      return;
    }
    setHaltReasonError("");

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, [haltReasons]);

  const handleFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleImmediateHaltChange = useCallback(
    (checked) => {
      if (checked) {
        setFormData((prev) => ({
          ...prev,
          immediateHalt: true,
          haltTime: "",
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          immediateHalt: false,
          haltTime: "",
        }));
      }
    },
    []
  );

  const handleSymbolChange = useCallback((event, newValue) => {
    setError("");
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

      // Check for existing active or pending halts for the symbol
      const existingActiveHalts = checkExistingHaltsForSymbol(newValue.symbol);
      if (existingActiveHalts.hasActiveHalts) {
        setSymbolError(
          `An active halt already exists for symbol ${newValue.symbol}`
        );
      } else if (existingActiveHalts.hasScheduledHalts) {
        setSymbolError(
          `A scheduled halt already exists for symbol ${newValue.symbol}, please cancel it before creating a new halt.`
        );
      } else {
        setSymbolError("");
      }
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
  }, [checkExistingHaltsForSymbol]);

  const handleSymbolInputChange = useCallback(
    (event, newInputValue) => {
      setError("");
      // newInputValue is the typed text
      setSymbolInput(newInputValue);

      // Check if the input matches any security from the dropdown
      const matchedSecurity = securities.find(
        (sec) => sec.symbol === newInputValue.toUpperCase()
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

      // Check for existing active or pending halts for the symbol
      const existingActiveHalts = checkExistingHaltsForSymbol(newInputValue);
      if (existingActiveHalts.hasActiveHalts) {
        setSymbolError(
          `An active halt already exists for symbol ${newInputValue}`
        );
      } else if (existingActiveHalts.hasScheduledHalts) {
        setSymbolError(
          `A scheduled halt already exists for symbol ${newInputValue}, please cancel it before creating a new halt.`
        );
      } else {
        setSymbolError("");
      }
    },
    [securities, checkExistingHaltsForSymbol]
  );

  // Memoize confirmation dialog message
  const confirmMessage = useMemo(
    () =>
      formData.immediateHalt
        ? "Please confirm creation of the immediate halt. Once the halt is created, it cannot be cancelled."
        : "Please confirm creation of the scheduled halt.",
    [formData.immediateHalt]
  );

  // Memoize button disabled state
  const isSubmitDisabled = useMemo(
    () => loading || !symbolInput || !formData.allIssue || (!formData.haltTime && !formData.immediateHalt) || !formData.haltReason,
    [loading, symbolInput, formData.allIssue, formData.haltTime, formData.immediateHalt, formData.haltReason]
  );

  return (
    <>
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
            className: "create-halt-dialog-paper",
          },
        }}
        sx={{
          "& .MuiDialog-paper": {
            height: "auto",
          },
        }}
      >
        <DialogTitle className="create-halt-dialog-title">
          <Typography
            variant="h6"
            component="div"
            className="cancel-halt-dialog-title-text"
          >
            Create Halt
          </Typography>
        </DialogTitle>

        <DialogContent className="create-halt-dialog-content">
          {error && (
            <Box className="create-halt-error-message">
              <Typography className="create-halt-error-text">
                {error}
              </Typography>
            </Box>
          )}

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
                    InputProps={{
                      ...params.InputProps,
                      style: { backgroundColor: "white", height: "36px" },
                    }}
                  />
                )}
              />
            </Box>
          </Box>
          {symbolError && (
            <Typography
              variant="body2"
              className="create-halt-error-text-light"
            >
              {symbolError}
            </Typography>
          )}
          <HaltModalField label="Issue Name" value={formData.issueName} />
          <HaltModalField label="Listing Market" value={formData.listingMarket} />

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

          <Box className="cancel-halt-field-container" sx={{ alignItems: "flex-start" }}>
            <Typography className="cancel-halt-label" sx={{ paddingTop: "8px" }}>
              Immediate Halt
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.immediateHalt}
                  onChange={(e) =>
                    handleImmediateHaltChange(e.target.checked)
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
              Halt Time{!formData.immediateHalt ? <span style={{ color: "red" }}>*</span> : ''}
            </Typography>
            <TextField
              fullWidth
              type="datetime-local"
              value={formData.haltTime}
              onChange={(e) => handleFieldChange("haltTime", e.target.value)}
              disabled={loading || formData.immediateHalt}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                style: { backgroundColor: "white", height: "36px" },
              }}
            />
          </Box>

          <Box className="cancel-halt-field-container">
            <Typography className="cancel-halt-label">
              Halt Reason <span style={{ color: "red" }}>*</span>
            </Typography>
            <Box sx={{ flex: 1 }}>
              <Autocomplete
                options={haltReasons}
                getOptionLabel={(option) => option.description || option}
                value={formData.haltReason}
                onChange={(event, newValue) =>
                  handleHaltReasonChange("haltReason", newValue)
                }
                disabled={loading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    variant="outlined"
                    required
                    error={!formData.haltReason && !!error}
                    InputProps={{
                      ...params.InputProps,
                      style: { backgroundColor: "white", height: "36px" },
                    }}
                  />
                )}
              />
            </Box>
          </Box>
          {haltReasonError && (
            <Typography
              variant="body2"
              className="create-halt-error-text-light"
            >
              {haltReasonError}
            </Typography>
          )}

          <HaltModalField label="Halt Reason Type" value={formData.haltReason ? formData.haltReason.type : ""} />

          <HaltModalField label="Halt Type" value="REG" />

          <HaltModalField label="Created By" value={formData.createdBy} />
        </DialogContent>

        <DialogActions className="create-halt-dialog-actions">
          <Button
            onClick={handleCreateClick}
            disabled={isSubmitDisabled}
            variant="contained"
            className="create-halt-submit-button"
          >
            {loading ? "Creating..." : "Create Halt"}
          </Button>
          <Button
            onClick={handleClose}
            disabled={loading}
            className="create-halt-cancel-button"
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Create Halt"
        message={confirmMessage}
        onCancel={handleConfirmCancel}
        onConfirm={handleConfirmOk}
        confirmText="Yes"
        cancelText="No"
      />

      {/* Confirmation Dialog for Unsaved Changes */}
      <Dialog
        open={exitConfirmOpen}
        onClose={handleExitConfirmCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Unsaved Changes</DialogTitle>
        <DialogContent>
          <Typography>
            Please confirm you wish to exit without creating the halt.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleExitConfirmCancel}
            variant="outlined"
            className="cancel-halt-close-button"
          >
            Go Back
          </Button>
          <Button
            onClick={handleExitConfirmOk}
            variant="contained"
            className="create-halt-submit-button"
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CreateNewHaltModal;
