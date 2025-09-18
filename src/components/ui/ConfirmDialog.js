import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import {
  HelpOutline as QuestionIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import './ConfirmDialog.css';

const ConfirmDialog = ({ 
  open, 
  title = "Confirm Action",
  message,
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "No",
  severity = "warning" // warning, info, error
}) => {
  const handleConfirm = () => {
    onConfirm && onConfirm();
  };

  const handleCancel = () => {
    onCancel && onCancel();
  };

  const handleClose = (event, reason) => {
    if (reason === 'backdropClick') {
      return; // Prevent closing on backdrop click
    }
    handleCancel();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: 'confirm-dialog-paper'
      }}
    >
      <DialogTitle
        className={`confirm-dialog-title confirm-dialog-title--${severity}`}
      >
        <Box className="confirm-dialog-title-content">
          <QuestionIcon 
            className={`confirm-dialog-icon confirm-dialog-icon--${severity}`}
          />
          <Typography 
            variant="h6" 
            component="div"
            className="confirm-dialog-title-text"
          >
            {title}
          </Typography>
        </Box>
        <IconButton
          onClick={handleCancel}
          size="small"
          className="confirm-dialog-close-button"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent className="confirm-dialog-content">
        <Typography 
          variant="body1" 
          className="confirm-dialog-message"
        >
          {message}
        </Typography>
      </DialogContent>

      <DialogActions className="confirm-dialog-actions">
        <Button 
          onClick={handleCancel} 
          className="confirm-dialog-cancel-button"
        >
          {cancelText}
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained"
          autoFocus
          className="confirm-dialog-confirm-button"
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;