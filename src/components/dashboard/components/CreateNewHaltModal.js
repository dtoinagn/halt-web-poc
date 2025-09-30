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
    notes: "",
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
        notes: "",
      });
      setError("");
      onClose();
    }
  };

  // Show confirmation dialog before submitting
  const handleCreateClick = () => {
    setConfirmOpen(true);
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
      // Validate required fields
      if (!formData.security) {
        throw new Error("Please select a security");
      }
      if (!formData.haltReason) {
        throw new Error("Please select a halt reason");
      }
      if (!formData.haltTime) {
        throw new Error("Please select a halt time");
      }
      let newHaltTime = null;
      if (formData.immediateHalt) {
        // For immediate halt, set halt time to current time
        newHaltTime = getCurrentTimeBackendFormat();
      } else {
        console.log("Scheduled halt time:", formData.haltTime);
        const haltDate = new Date(formData.haltTime);
        // If not immediate halt, halt time is scheduled for future
        if (haltDate < new Date()) {
          throw new Error("Halt time must be in the future");
        } else{
          const now = new Date();
          const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          if (haltDate > endOfToday) {
            throw new Error("Halt time must be within today");
          }

          newHaltTime = getCurrentTimeBackendFormat(new Date(formData.haltTime));
        }
      } 

      const payload = {
        haltId: '',
        symbol: formData.security.symbol || "",
        issueName: formData.issueName || "",
        listingMarket: formData.listingMarket || "",
        allIssue: formData.allIssue === "Yes" ? "true" : "false",
        haltTime: newHaltTime,
        resumptionTime: "",
        cancelTime: "",
        extendedHalt: formData.extendedHalt,
        haltReason: formData.haltReason.description || formData.haltReason,
        remainReason: "",
        status: formData.immediateHalt ? "Halted" : "HaltPending",
        haltType: "REG", // Default to REG for new halts
        createdBy: formData.createdBy || '',
        createdTime: "",
        modifiedBy: "",
        modifiedTime: "",
        sscbSrc: "",
        responseMessage: "",
        action: formData.immediateHalt
        ? HALT_ACTIONS.CREATE_IMMEDIATE_HALT
        : HALT_ACTIONS.CREATE_SCHEDULED_HALT,
        coment: formData.notes || "",
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
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getCurrentTimeBackendFormat = (now) => {
    now = now ? new Date(now) : new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const milliseconds = String(now.getMilliseconds()).padStart(3, "0");
    return `${year}${month}${day}-${hours}:${minutes}:${seconds}.${milliseconds}`;
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
              options={securities}
              getOptionLabel={(option) =>
                `${option.symbol}`
              }
              value={formData.security}
              onChange={handleSymbolChange}
              disabled={loading}
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
              value={formData.notes}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
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
