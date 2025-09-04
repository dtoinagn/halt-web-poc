import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../constants';

const NotLoggedIn = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate(ROUTE_PATHS.LOGIN);
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="400px"
      p={4}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          textAlign: 'center', 
          maxWidth: 400,
          bgcolor: '#f5f5f5'
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom color="primary">
          Access Restricted
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          You need to be logged in to access this page.
        </Typography>
        <button
          onClick={handleLoginClick}
          style={{
            backgroundColor: '#004644',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '10px 20px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Go to Login
        </button>
      </Paper>
    </Box>
  );
};

export default NotLoggedIn;