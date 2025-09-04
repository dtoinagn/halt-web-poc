import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const Notification = ({ 
  open, 
  message, 
  onClose, 
  severity = 'info', 
  autoHideDuration = 3000 
}) => {
  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      onClose={onClose}
      autoHideDuration={autoHideDuration}
    >
      <Alert 
        onClose={onClose} 
        severity={severity} 
        sx={{ width: '100%', marginTop: 1 }} 
        variant="filled"
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Notification;