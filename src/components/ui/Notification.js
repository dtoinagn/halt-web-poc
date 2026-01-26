import React from 'react';
import { Snackbar, Alert, Box } from '@mui/material';

const Notification = ({ 
  open, 
  message, 
  onClose, 
  severity = 'info', 
  autoHideDuration = 3000 
}) => {
  // Handle both array and single string messages
  const messages = Array.isArray(message) ? message : [message];
  const hasMultipleMessages = messages.length > 1;

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
        {hasMultipleMessages ? (
          <Box component="ul" sx={{ paddingLeft: 2, margin: 0 }}>
            {messages.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </Box>
        ) : (
          messages[0]
        )}
      </Alert>
    </Snackbar>
  );
};

export default Notification;