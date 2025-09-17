import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import './ErrorDialog.css';

const ErrorDialog = ({ 
  open, 
  message, 
  onClose, 
  title = "Error",
  severity = "error" // error, warning, info
}) => {
  const getAlertSeverity = () => {
    return severity === 'error' ? 'error' : severity;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: 'error-dialog-paper'
      }}
    >
      <DialogTitle
        className={`error-dialog-title error-dialog-title--${severity}`}
      >
        <Box className="error-dialog-title-content">
          <ErrorIcon 
            className={`error-dialog-icon error-dialog-icon--${severity}`}
          />
          <Typography 
            variant="h6" 
            component="div"
            className="error-dialog-title-text"
          >
            {title}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          className="error-dialog-close-button"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent className="error-dialog-content">
        <Alert 
          severity={getAlertSeverity()}
          variant="outlined"
          className="error-dialog-alert"
        >
          <Typography 
            variant="body1" 
            className="error-dialog-message"
          >
            {message}
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions className="error-dialog-actions">
        <Button 
          onClick={onClose} 
          variant="contained"
          autoFocus
          className="error-dialog-ok-button"
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ErrorDialog;