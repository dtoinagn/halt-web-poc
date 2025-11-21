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
  Grid,
  Typography,
  Box,
  MenuItem,
  IconButton,
} from "@mui/material";
import {
  AddCircleOutline as AddIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { apiService } from "../../../services/api";
import { authUtils } from "../../../utils/storageUtils";
import { HALT_ACTIONS } from "../../../constants";
import ConfirmDialog from "../../ui/ConfirmDialog";
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
  checkExistingHaltsForSymbol,
}) => {
  const [formData, setFormData] = useState(getInitialFormData);
  const [symbolInput, setSymbolInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [symbolError, setSymbolError] = useState("");
  const [existingHaltsWarning, setExistingHaltsWarning] = useState(null);

  // Memoize helper functions
  const getCurrentDateTime = useCallback(() => {
    return getCurrentESTDateTime(DATETIME_FORMATS.DATETIME_LOCAL);
  }, []);

  const getCurrentTimeBackendFormat = useCallback((dateTime) => {
    if (dateTime) {
      return formatForBackend(dateTime);
    }
    return getCurrentESTDateTime(DATETIME_FORMATS.BACKEND);
  }, []);

  const handleClose = useCallback(() => {
    if (!loading) {
      setFormData(getInitialFormData());
      setSymbolInput("");
      setSymbolError("");
      setError("");
      onClose();
    }
  }, [loading, onClose]);

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
      } else{
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
  ]);

  const handleConfirmCancel = useCallback(() => {
    setConfirmOpen(false);
  }, []);

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

      handleClose();
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

  const handleConfirmOk = useCallback(async () => {
    setConfirmOpen(false);
    await handleSubmit();
  }, [handleSubmit]);

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
          haltTime: getCurrentDateTime(),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          immediateHalt: false,
          haltTime: "",
        }));
      }
    },
    [getCurrentDateTime]
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
    },
    [securities]
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
    () => loading || !symbolInput || !formData.allIssue || !formData.haltTime,
    [loading, symbolInput, formData.allIssue, formData.haltTime]
  );

  return (
    <>
      <Dialog
        open={open}
        maxWidth="md"
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
            minHeight: "500px",
          },
        }}
      >
        <DialogTitle className="create-halt-dialog-title">
          <Box className="create-halt-dialog-title-content">
            <AddIcon className="create-halt-dialog-icon" />
            <Typography
              variant="h6"
              component="div"
              className="create-halt-dialog-title-text"
            >
              Create New Trading Halt
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            size="small"
            className="create-halt-dialog-close-button"
            disabled={loading}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent className="create-halt-dialog-content">
          {error && (
            <Box className="create-halt-error-message">
              <Typography className="create-halt-error-text">
                {error}
              </Typography>
            </Box>
          )}

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
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
                    label="Symbol *"
                    fullWidth
                    variant="outlined"
                    error={!symbolInput && !!error}
                  />
                )}
              />
              {symbolError && (
                <Typography
                  variant="body2"
                  className="create-halt-error-text-light"
                >
                  {symbolError}
                </Typography>)}       
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Issue Name"
                value={formData.issueName}
                onChange={(e) => handleFieldChange("issueName", e.target.value)}
                disabled={true}
                fullWidth
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Listing Market"
                value={formData.listingMarket}
                onChange={(e) => handleFieldChange("listingMarket", e.target.value)}
                disabled={true}
                fullWidth
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                label="All Issues"
                value={formData.allIssue}
                onChange={(e) => handleFieldChange("allIssue", e.target.value)}
                disabled={loading}
                fullWidth
                variant="outlined"
                error={!formData.allIssue && !!error}
                required
              >
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Halt Time *"
                type="datetime-local"
                value={formData.haltTime}
                onChange={(e) => handleFieldChange("haltTime", e.target.value)}
                disabled={loading || formData.immediateHalt}
                fullWidth
                variant="outlined"
                error={!formData.haltTime && !!error}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  // Set default value in EST when popup opens
                  value: formData.haltTime || getCurrentDateTime(),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
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
                label="Immediate Halt"
                sx={{ mt: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Autocomplete
                options={haltReasons}
                getOptionLabel={(option) => option.description || option}
                value={formData.haltReason}
                onChange={(event, newValue) =>
                  handleFieldChange("haltReason", newValue)
                }
                disabled={loading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Halt Reason"
                    fullWidth
                    variant="outlined"
                  />
                )}
              />
            </Grid>

            {/* <Grid item xs={12} md={6}>
            <TextField
              label="Resumption Time"
              type="datetime-local"
              value={formData.resumptionTime}
              onChange={(e) =>
                handleFieldChange("resumptionTime", e.target.value)
              }
              disabled={loading}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
          </Grid> */}

            <Grid item xs={12} md={6}>
              <TextField label="Halt Type" value="REG" fullWidth disabled />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Created By"
                value={formData.createdBy}
                fullWidth
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={formData.comment}
                onChange={(e) => handleFieldChange("comment", e.target.value)}
                disabled={loading}
                fullWidth
                multiline
                rows={3}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions className="create-halt-dialog-actions">
          <Button
            onClick={handleClose}
            disabled={loading}
            className="create-halt-cancel-button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateClick}
            disabled={isSubmitDisabled}
            variant="contained"
            className="create-halt-submit-button"
          >
            {loading ? "Creating..." : "Create Halt"}
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
    </>
  );
};

export default CreateNewHaltModal;
