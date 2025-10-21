import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
} from "@mui/material";
import { formatDateTimeForDashboard } from "../../utils/dateUtils";

const HaltDetailModal = ({ open, onClose, haltData }) => {
  if (!haltData) return null;

  const formatDateTime = (dateTime) => {
    if (!dateTime) return "N/A";
    return formatDateTimeForDashboard(dateTime);
  };

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          minHeight: '500px',
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="h2" fontWeight="bold">
          Halt Event Details
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Halt Event ID"
              value={haltData.haltId || "N/A"}
              fullWidth
              variant="outlined"
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Symbol"
              value={haltData.symbol || "N/A"}
              fullWidth
              variant="outlined"
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Issue Name"
              value={haltData.issueName || "N/A"}
              fullWidth
              variant="outlined"
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Listing Market"
              value={haltData.listingMarket || "N/A"}
              fullWidth
              variant="outlined"
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="All Issues"
              value={haltData.allIssue || "N/A"}
              fullWidth
              variant="outlined"
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Halt Time"
              value={formatDateTime(haltData.haltTime)}
              fullWidth
              variant="outlined"
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Resumption Time"
              value={formatDateTime(haltData.resumptionTime)}
              fullWidth
              variant="outlined"
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Halt Reason"
              value={haltData.haltReason || "N/A"}
              fullWidth
              variant="outlined"
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Remain Reason"
              value={haltData.remainReason || "N/A"}
              fullWidth
              variant="outlined"
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Status"
              value={haltData.status || "N/A"}
              fullWidth
              variant="outlined"
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Halt Type"
              value={haltData.haltType || "N/A"}
              fullWidth
              variant="outlined"
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Extended Halt"
              value={haltData.extendedHalt ? "Yes" : "No"}
              fullWidth
              variant="outlined"
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Created By"
              value={haltData.createdBy || "N/A"}
              fullWidth
              variant="outlined"
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Created Time"
              value={formatDateTime(haltData.createdTime)}
              fullWidth
              variant="outlined"
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Last Modified By"
              value={haltData.lastModifiedBy || "N/A"}
              fullWidth
              variant="outlined"
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Last Modified Time"
              value={formatDateTime(haltData.lastModifiedTime)}
              fullWidth
              variant="outlined"
              InputProps={{ readOnly: true }}
            />
          </Grid>

          {haltData.sscbSrc && (
            <Grid item xs={12}>
              <TextField
                label="SSCB Source"
                value={haltData.sscbSrc}
                fullWidth
                variant="outlined"
                InputProps={{ readOnly: true }}
              />
            </Grid>
          )}

          {haltData.comment && (
            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={haltData.comment}
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                InputProps={{ readOnly: true }}
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} className="confirm-dialog-confirm-button">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HaltDetailModal;
