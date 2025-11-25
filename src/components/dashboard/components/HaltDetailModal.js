import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  IconButton,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
} from "@mui/material";
import { Close as CloseIcon, Info as InfoIcon } from "@mui/icons-material";
import { formatForHaltDetail } from "../../../utils/dateUtils";
import { buildHaltPayload } from "../../../utils/haltDataUtils";
import { apiService } from "../../../services/api";
import { authUtils } from "../../../utils/storageUtils";
import { HALT_ACTIONS } from "../../../constants";
import "./CreateNewHaltModal.css";

const HaltDetailModal = ({
  open,
  onClose,
  haltData,
  haltReasons = [],
  remainReasons = [],
  onHaltUpdated,
}) => {
  const [formData, setFormData] = useState({
    extendedHalt: false,
    haltReason: null,
    remainedHalt: false,
    remainReason: null,
    comment: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when haltData changes
  useEffect(() => {
    if (haltData) {
      // Find matching halt reason
      const matchedHaltReason = haltReasons.find(
        (reason) => reason.description === haltData.haltReason
      );

      // Find matching remain reason
      const matchedRemainReason = remainReasons.find(
        (reason) => reason.description === haltData.remainReason
      );

      setFormData({
        extendedHalt: haltData.extendedHalt || false,
        haltReason: matchedHaltReason || null,
        remainedHalt: haltData.remainedHalt || false,
        remainReason: matchedRemainReason || null,
        comment: haltData.comment || "",
      });
      setHasChanges(false);
      setError("");
    }
  }, [haltData, haltReasons, remainReasons]);

  // Check if form data has changed
  useEffect(() => {
    if (!haltData) return;

    const extendedChanged = formData.extendedHalt !== haltData.extendedHalt;

    // Normalize empty/null values for comparison
    const currentHaltReason = formData.haltReason?.description || "";
    const originalHaltReason = haltData.haltReason || "";
    const haltReasonChanged = currentHaltReason !== originalHaltReason;

    const remainedChanged = formData.remainedHalt !== haltData.remainedHalt;

    const currentRemainReason = formData.remainReason?.description || "";
    const originalRemainReason = haltData.remainReason || "";
    const remainReasonChanged = currentRemainReason !== originalRemainReason;

    const currentComment = formData.comment || "";
    const originalComment = haltData.comment || "";
    const commentChanged = currentComment !== originalComment;

    setHasChanges(
      extendedChanged ||
        haltReasonChanged ||
        remainedChanged ||
        remainReasonChanged ||
        commentChanged
    );
  }, [formData, haltData]);

  const handleFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      // Clear remain reason if remain halt is set to false
      ...(field === "remainedHalt" && !value && { remainReason: null }),
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setError("");

    try {
      if (!haltData) {
        throw new Error("No halt data available");
      }
      setLoading(true);

      // Build the payload
      const payload = {
        ...buildHaltPayload(haltData),
        extendedHalt: formData.extendedHalt,
        haltReason: formData.haltReason
          ? formData.haltReason.description
          : haltData.haltReason || "",
        remainedHalt: formData.remainedHalt,
        remainReason: formData.remainReason
          ? formData.remainReason.description
          : "",
        comment: formData.comment || "",
        lastModifiedBy: authUtils.getLoggedInUser() || "",
        action: HALT_ACTIONS.MODIFY_HALT_DETAILS,
      };

      await apiService.updateHalt(payload);

      // Call onHaltUpdated callback if provided
      if (onHaltUpdated) {
        await onHaltUpdated();
      }

      onClose();
    } catch (err) {
      console.error("Failed to update halt:", err);
      setError(err.message || "Failed to update halt. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [haltData, formData, onHaltUpdated, onClose]);

  const handleClose = useCallback(() => {
    if (!loading) {
      setError("");
      onClose();
    }
  }, [loading, onClose]);

  if (!haltData) return null;

  const formatDateTime = (dateTime) => {
    if (!dateTime) return "";
    return formatForHaltDetail(dateTime);
  };

  const FieldRow = ({
    label,
    value,
    isGray = true,
    isBlue = false,
    fullWidth = false,
  }) => (
    <Grid item xs={12} md={fullWidth ? 12 : 6}>
      <Box className="halt-detail-field-container">
        <Typography className="halt-detail-label">{label}</Typography>
        <Box
          className={`halt-detail-value-box ${
            isGray
              ? "halt-detail-value-box-gray"
              : "halt-detail-value-box-white"
          }`}
        >
          <Typography
            className={`halt-detail-value-text ${
              isBlue ? "halt-detail-value-text-blue" : ""
            }`}
          >
            {value || ""}
          </Typography>
        </Box>
      </Box>
    </Grid>
  );

  const EditableSelectField = ({
    label,
    value,
    onChange,
    options,
    fullWidth = false,
    disabled = false,
  }) => (
    <Grid item xs={12} md={fullWidth ? 12 : 6}>
      <Box className="halt-detail-field-container">
        <Typography className="halt-detail-label">{label}</Typography>
        <Select
          fullWidth
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={{
            backgroundColor: "white",
            height: "36px",
            fontSize: "0.688rem",
            textAlign: "center",
          }}
          MenuProps={{
            PaperProps: {
              style: {
                textAlign: "center",
              },
            },
          }}
        >
          {options.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              style={{ fontSize: "0.688rem", justifyContent: "center" }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Grid>
  );

  const EditableAutocompleteField = ({
    label,
    value,
    onChange,
    options,
    fullWidth = false,
    disabled = false,
  }) => (
    <Grid item xs={12} md={fullWidth ? 12 : 6}>
      <Box className="halt-detail-field-container">
        <Typography className="halt-detail-label">{label}</Typography>
        <Autocomplete
          fullWidth
          value={value}
          onChange={(event, newValue) => onChange(newValue)}
          options={options}
          getOptionLabel={(option) => option.description || ""}
          isOptionEqualToValue={(option, value) =>
            option.description === value?.description
          }
          disabled={disabled}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select..."
              InputProps={{
                ...params.InputProps,
                style: {
                  backgroundColor: "white",
                  height: "36px",
                  padding: "0",
                  fontSize: "0.688rem",
                },
              }}
              inputProps={{
                ...params.inputProps,
                style: { padding: "8px 14px", fontSize: "0.688rem" },
              }}
            />
          )}
          sx={{
            "& .MuiOutlinedInput-root": {
              padding: "0 !important",
              height: "36px",
              fontSize: "0.688rem",
            },
            "& .MuiAutocomplete-endAdornment": {
              top: "calc(50% - 12px)",
            },
            "& .MuiAutocomplete-option": {
              fontSize: "0.688rem",
            },
          }}
        />
      </Box>
    </Grid>
  );

  return (
    <Dialog
      open={open}
      maxWidth="lg"
      fullWidth
      onClose={onClose}
      slotProps={{
        paper: {
          className: "create-halt-dialog-paper halt-detail-dialog-paper",
        },
      }}
    >
      <DialogTitle className="create-halt-dialog-title">
        <Box className="create-halt-dialog-title-content">
          <InfoIcon className="create-halt-dialog-icon" />
          <Typography
            variant="h6"
            component="div"
            className="create-halt-dialog-title-text"
          >
            Halt Details
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          className="create-halt-dialog-close-button"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent className="create-halt-dialog-content">
        {error && (
          <Box className="create-halt-error-message" sx={{ marginBottom: 2 }}>
            <Typography className="create-halt-error-text">{error}</Typography>
          </Box>
        )}
        <Grid container spacing={0.3} className="halt-detail-content-grid">
          {/* Row 1 */}
          <FieldRow
            label="Halt Event ID"
            value={haltData.haltId}
            isGray={true}
          />
          <EditableAutocompleteField
            label="Remain Reason"
            value={formData.remainReason}
            onChange={(value) => handleFieldChange("remainReason", value)}
            options={remainReasons}
            disabled={!formData.remainedHalt || loading}
          />

          {/* Row 2 */}
          <FieldRow
            label="Symbol *"
            value={haltData.symbol}
            isGray={true}
            isBlue={false}
          />
          <EditableSelectField
            label="Remain Halt"
            value={formData.remainedHalt}
            onChange={(value) => handleFieldChange("remainedHalt", value)}
            options={[
              { value: true, label: "Yes" },
              { value: false, label: "No" },
            ]}
            disabled={loading}
          />

          {/* Row 3 */}
          <FieldRow
            label="Issue Name"
            value={haltData.issueName}
            isGray={true}
          />
          <FieldRow label="Status" value={haltData.status} isGray={true} />

          {/* Row 4 */}
          <FieldRow
            label="Listing Market"
            value={haltData.listingMarket}
            isGray={true}
          />
          <FieldRow label="Halt Type" value={haltData.haltType} isGray={true} />

          {/* Row 5 */}
          <FieldRow
            label="All Issues"
            value={haltData.allIssue}
            isGray={true}
          />
          <FieldRow
            label="Created By"
            value={haltData.createdBy}
            isGray={true}
          />

          {/* Row 6 */}
          <FieldRow
            label="Halt Time"
            value={formatDateTime(haltData.haltTime)}
            isGray={true}
          />
          <FieldRow
            label="Modified By"
            value={haltData.lastModifiedBy}
            isGray={true}
          />

          {/* Row 7 */}
          <FieldRow
            label="Resumption Time"
            value={formatDateTime(haltData.resumptionTime)}
            isGray={true}
          />
          <FieldRow
            label="Created On"
            value={formatDateTime(haltData.createdTime)}
            isGray={true}
          />

          {/* Row 8 */}
          <FieldRow
            label="Halt Cancelled Time"
            value={formatDateTime(haltData.haltCancelledTime)}
            isGray={true}
          />
          <FieldRow
            label="Modified On"
            value={formatDateTime(haltData.lastModifiedTime)}
            isGray={true}
          />

          {/* Row 9 */}
          <EditableSelectField
            label="Extended Halt"
            value={formData.extendedHalt}
            onChange={(value) => handleFieldChange("extendedHalt", value)}
            options={[
              { value: true, label: "Yes" },
              { value: false, label: "No" },
            ]}
            disabled={loading}
          />
          <Grid item xs={12} md={6}>
            {/* Empty space */}
          </Grid>

          {/* Full Width - Halt Reason */}
          <EditableAutocompleteField
            label="Halt Reason"
            value={formData.haltReason}
            onChange={(value) => handleFieldChange("haltReason", value)}
            options={haltReasons}
            fullWidth={true}
            disabled={loading}
          />

          {/* Full Width - SSCB Source (if exists) */}
          {haltData.sscbSrc && (
            <FieldRow
              label="SSCB Source"
              value={haltData.sscbSrc}
              isGray={true}
              fullWidth={true}
            />
          )}

          {/* Full Width - Notes */}
          <Grid item xs={12}>
            <Box className="halt-detail-field-container">
              <Typography className="halt-detail-label">Notes</Typography>
              <TextField
                fullWidth
                multiline
                rows={1}
                value={formData.comment}
                onChange={(e) => handleFieldChange("comment", e.target.value)}
                disabled={loading}
                placeholder="Enter notes..."
                InputProps={{
                  style: {
                    backgroundColor: "white",
                    minHeight: "36px",
                    fontSize: "0.688rem",
                  },
                }}
                inputProps={{
                  style: { fontSize: "0.688rem" },
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions className="create-halt-dialog-actions">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || loading}
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

export default HaltDetailModal;
