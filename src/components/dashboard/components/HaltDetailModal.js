import React from "react";
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
} from "@mui/material";
import { Close as CloseIcon, Info as InfoIcon } from "@mui/icons-material";
import { formatForHaltDetail } from "../../../utils/dateUtils";
import "./CreateNewHaltModal.css";

const HaltDetailModal = ({ open, onClose, haltData }) => {
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

  return (
    <Dialog
      open={open}
      maxWidth="md"
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
        <Grid container spacing={0.5} className="halt-detail-content-grid">
          {/* Row 1 */}
          <FieldRow
            label="Halt Event ID"
            value={haltData.haltId}
            isGray={true}
          />
          <FieldRow
            label="Remain Reason"
            value={haltData.remainReason}
            isGray={true}
          />

          {/* Row 2 */}
          <FieldRow
            label="Symbol *"
            value={haltData.symbol}
            isGray={true}
            isBlue={false}
          />
          <FieldRow
            label="Remain Halt"
            value={haltData.extendedHalt ? "Yes" : "No"}
            isGray={true}
            isBlue={false}
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
          <FieldRow
            label="Extended Halt"
            value={haltData.extendedHalt ? "Yes" : "No"}
            isGray={true}
            isBlue={false}
          />
          <Grid item xs={12} md={6}>
            {/* Empty space */}
          </Grid>

          {/* Full Width - Halt Reason */}
          <FieldRow
            label="Halt Reason"
            value={haltData.haltReason}
            isGray={true}
            isBlue={false}
            fullWidth={true}
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

          {/* Full Width - Notes (if exists) */}
          {haltData.comment && (
            <FieldRow
              label="Notes"
              value={haltData.comment}
              isGray={true}
              fullWidth={true}
            />
          )}
        </Grid>
      </DialogContent>

      <DialogActions className="create-halt-dialog-actions">
        <Button onClick={onClose} className="create-halt-submit-button">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HaltDetailModal;
