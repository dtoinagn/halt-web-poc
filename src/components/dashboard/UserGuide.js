import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';

const UserGuide = () => {
  return (
    <Box p={4}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Guide
        </Typography>
        <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 3 }}>
          Welcome to the CIRO Equity Trading Halt Management Portal
        </Typography>
        
        <Typography variant="body1" paragraph>
          This portal allows authorized users to manage and monitor equity trading halts.
        </Typography>

        <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 3 }}>
          Main Features:
        </Typography>
        
        <List>
          <ListItem>
            <ListItemText 
              primary="Dashboard" 
              secondary="View and manage active trading halts, including REG and SSCB halts"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="History" 
              secondary="Access historical trading halt data and reports"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Real-time Updates" 
              secondary="Receive live notifications about halt status changes"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Halt Management" 
              secondary="Create new halts, extend existing halts, and manage resumptions"
            />
          </ListItem>
        </List>

        <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 3 }}>
          Support:
        </Typography>
        <Typography variant="body1">
          For technical support or questions about using this portal, please contact the Support Team.
        </Typography>
      </Paper>
    </Box>
  );
};

export default UserGuide;