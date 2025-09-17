import React from 'react';
import { Box } from '@mui/material';

const DashboardTabs = ({ 
  activeTab, 
  onTabChange, 
  counts, 
  onNewHaltClick, 
  windowHeight 
}) => {
  const mainTabHeight = 0.08 * windowHeight;

  const tabStyle = (isActive) => ({
    onClick: () => onTabChange,
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    flex: 1, 
    marginLeft: 0.2,
    bgcolor: isActive ? "#6d8b89" : "#b7c6c6", 
    height: "95%",
    color: "white",
    fontSize: 16,
    cursor: "pointer",
    userSelect: "none"
  });

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      textAlign="center"
      height={mainTabHeight}
      width="95%"
      padding={1}
      marginTop={3}
      fontWeight="bold"
      flex={1}
      position="relative"
    >   
      <Box 
        onClick={() => onTabChange('reg')}
        sx={{
          ...tabStyle(activeTab === 'reg'),
          marginLeft: 1
        }}
      > 
        Active Reg Halt
        <button className="tab-num">{counts.activeReg}</button>
      </Box>
      
      <Box 
        onClick={() => onTabChange('sscb')}
        sx={tabStyle(activeTab === 'sscb')}
      > 
        Active SSCB Halt
        <button className="tab-num">{counts.activeSSCB}</button>
      </Box>
      
      <Box 
        onClick={() => onTabChange('pending')}
        sx={tabStyle(activeTab === 'pending')}
      > 
        Scheduled Halts
        <button className="tab-num">{counts.pending}</button>
      </Box>
      
      <Box 
        onClick={() => onTabChange('lifted')}
        sx={{
          ...tabStyle(activeTab === 'lifted'),
          textDecoration: activeTab === 'lifted' ? "underline" : "none"
        }}
      > 
        Today Lifted Halt
        <button className="tab-num">{counts.lifted}</button>
      </Box>
      
      <button 
        className="newhalt-button" 
        onClick={onNewHaltClick}
      >  
        Create new halts 
      </button>
    </Box>
  );
};

export default DashboardTabs;