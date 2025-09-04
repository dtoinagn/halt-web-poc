import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="200px"
      gap={2}
    >
      <Alert severity="error" sx={{ width: '100%', maxWidth: 400 }}>
        <Typography variant="body1">
          {message || 'An unexpected error occurred'}
        </Typography>
      </Alert>
      {onRetry && (
        <button 
          onClick={onRetry}
          style={{
            padding: '8px 16px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      )}
    </Box>
  );
};

export default ErrorMessage;