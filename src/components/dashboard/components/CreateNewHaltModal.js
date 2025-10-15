import React, { useState } from "react";
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
} from "@mui/material";
import { apiService } from "../../../services/api";
import { authUtils } from "../../../utils/storageUtils";
import { HALT_ACTIONS } from "../../../constants";
import ConfirmDialog from "../../ui/ConfirmDialog";
import {
  compareDateTimeToSecond,
  getCurrentESTDateTime,
  formatForBackend,
  DATETIME_FORMATS
} from '../../../utils/dateUtils';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
const EST_ZONE = 'America/New_York';

const CreateNewHaltModal = ({
  open,
  onClose,
  securities = [],
  haltReasons = [],
  onHaltCreated,
}) => {
  const [formData, setFormData] = useState({
    security: null,
    issueName: "",
    listingMarket: "",
    allIssue: "",
    haltReason: null,
    haltTime: "",
    resumptionTime: "",
    immediateHalt: false,
    extendedHalt: false,
    createdBy: authUtils.getLoggedInUser() || '',
    comment: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleClose = () => {
    if (!loading) {
      setFormData({
        security: null,
        issueName: "",
        listingMarket: "",
        allIssue: "",
        haltReason: null,
        haltTime: "",
        resumptionTime: "",
        immediateHalt: false,
        extendedHalt: false,
        createdBy: authUtils.getLoggedInUser() || '',
        comment: "",
      });
      setError("");
      onClose();
    }
  };

  // Validate and show confirmation dialog before submitting
  const handleCreateClick = () => {
    setError("");
    try {
      // Validate required fields
      if (!formData.security) {
        throw new Error("Please select a security");
      }
      if (!formData.haltReason) {
        throw new Error("Please select a halt reason");
      }
      if (! formData.immediateHalt && !formData.haltTime) {
        throw new Error("Please select a halt time for scheduled halt");
      }
      if(!formData.allIssue){
        throw new Error("Please select if halt is for all issues");
      }
      //Validate halt time for scheduled halts
      if (!formData.immediateHalt) {
        const haltDateEST = dayjs.tz(formData.haltTime, EST_ZONE);
        const nowEST = dayjs().tz(EST_ZONE);
        const endOfTodayEST = nowEST.endOf('day'); 
        console.log("Form Halt Time:", formData.haltTime);
        console.log("Selected Halt Date:", haltDateEST);
        console.log("Now EST:", nowEST);
        console.log("End of Today:", endOfTodayEST);

        if (compareDateTimeToSecond(haltDateEST, nowEST) < 0) {
          throw new Error("Halt time must be in the future");
        }
        if (compareDateTimeToSecond(haltDateEST, endOfTodayEST) > 0) {
          throw new Error("Halt time must be within today");
        }
      } 
      // If all validations pass, open confirmation dialog
      setConfirmOpen(true);
    } catch (error) {
      setError(error.message);
      return;
    }
  };

  const handleConfirmCancel = () => {
    setConfirmOpen(false);
  };

  const handleConfirmOk = async () => {
    setConfirmOpen(false);
    await handleSubmit();
  };

  const handleSubmit = async () => {
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
        haltId: '',
        symbol: formData.security.symbol || "",
        issueName: formData.issueName || "",
        listingMarket: formData.listingMarket || "",
        allIssue: formData.allIssue === "Yes" ? "true" : "false",
        haltTime: newHaltTime,
        resumptionTime: "",
        extendedHalt: formData.extendedHalt,
        haltReason: formData.haltReason.description || formData.haltReason,
        remainReason: "",
        status: formData.immediateHalt ? "Halted" : "HaltPending",
        haltType: "REG", // Default to REG for new halts
        createdBy: formData.createdBy || '',
        createdTime: "",
        lastModifiedBy: formData.createdBy || '',
        lastModifiedTime: "",
        sscbSrc: "",
        responseMessage: "",
        action: formData.immediateHalt
        ? HALT_ACTIONS.CREATE_IMMEDIATE_HALT
        : HALT_ACTIONS.CREATE_SCHEDULED_HALT,
        comment: formData.comment || "",
        type:formData.immediateHalt ? "live" : "schedule"
      };

      console.log("Creating new halt with payload:", payload);

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
  };

  const getCurrentDateTime = () => {
    // Get current time in EST timezone and format for datetime-local input
    return getCurrentESTDateTime(DATETIME_FORMATS.DATETIME_LOCAL);
  };

  const getCurrentTimeBackendFormat = (dateTime) => {
    // If dateTime is provided, format it, otherwise use current EST time
    if (dateTime) {
      return formatForBackend(dateTime);
    }
    return getCurrentESTDateTime(DATETIME_FORMATS.BACKEND);
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImmediateHaltChange = (checked) => {
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
  };

  const handleSymbolChange = (event, newValue) => {
    if (newValue) {
      setFormData((prev) => ({
        ...prev,
        security: newValue,
        issueName: newValue.securityName || newValue.issueName || "",
        listingMarket: newValue.listingMarket || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        security: null,
        issueName: "",
        listingMarket: "",
      }));
    }
  };

  // Confirmation dialog message based on immediateHalt
  const confirmMessage = formData.immediateHalt
    ? "Please confirm creation of the immediate halt. Once the halt is created, it cannot be cancelled."
    : "Please confirm creation of the scheduled halt.";

  return (
  <>
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      onClose={(event, reason) => {
        if (reason === 'backdropClick') {
         return; // Prevent closing on backdrop click
        }
       handleClose();
     }}
      sx={{
        '& .MuiDialog-paper': {
          minHeight: '500px',
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="h2" fontWeight="bold">
          Create New Trading Halt
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Box mb={2}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        )}

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo={true} // Allow free text input
              options={securities}
              getOptionLabel={(option) =>
                `${option.symbol}`
              }
              value={formData.security}
              onChange={handleSymbolChange}
              disabled={loading}
              filterOptions={(options, { inputValue }) =>
                options.filter(option =>
                  option.symbol.toLowerCase().startsWith(inputValue.toLowerCase())
                )
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Symbol *"
                  fullWidth
                  variant="outlined"
                  error={!formData.security && error}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Issue Name"
              value={formData.issueName}
              onChange={(e) => handleFieldChange("issueName", e.target.value)}
              disabled={loading}
              fullWidth
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Listing Market"
              value={formData.listingMarket}
              onChange={(e) =>
                handleFieldChange("listingMarket", e.target.value)
              }
              disabled={loading}
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
              error={!formData.allIssue && error}
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
              error={!formData.haltTime && error}
              InputLabelProps={{ shrink: true }}
              inputProps={{ 
                // Set default value in EST when popup opens
                value: formData.haltTime || getCurrentDateTime(), }} 
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.immediateHalt}
                  onChange={(e) => handleImmediateHaltChange(e.target.checked)}
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
                  label="Halt Reason *"
                  fullWidth
                  variant="outlined"
                  error={!formData.haltReason && error}
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
            <TextField label="Created By" value={formData.createdBy} fullWidth disabled />
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

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={loading} className="confirm-dialog-confirm-button">
          Cancel
        </Button>
        <Button
          onClick={handleCreateClick}
          disabled={
            loading ||
            !formData.security ||
            !formData.haltReason ||
            !formData.allIssue ||
            !formData.haltTime
          }
          className="confirm-dialog-confirm-button"
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
